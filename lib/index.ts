import fetch, { FetchError } from "node-fetch"
import { BeatmapExtended, BeatmapAttributes, Beatmap, BeatmapPack } from "./beatmap.js"
import { KudosuHistory, UserExtended, User } from "./user.js"
import { Leader, Match, MatchInfo, MultiplayerScore, PlaylistItem, Room } from "./multiplayer.js"
import { Rulesets, Mod } from "./misc.js"
import { BeatmapUserScore, Score } from "./score.js"
import { Rankings, Spotlight } from "./ranking.js"
import { ChangelogBuild, UpdateStream } from "./changelog.js"

export {BeatmapExtended, Beatmap}
export {UserExtended, User, KudosuHistory}
export {BeatmapUserScore, Score}
export {Room, Leader, PlaylistItem, MultiplayerScore}
export {Rulesets}
export {ChangelogBuild, UpdateStream}

export class APIError {
	message: string
	/**
	 * @param message The reason why things didn't go as expected
	 */
	constructor(message: string) {
		this.message = message
	}
}

/**
 * You can create an API instance using its `createAsync` function!
 */
export class API {
	client: {
		id: number
		secret: string
	}
	token_type: string
	expires: Date
	access_token: string
	refresh_token?: string
	user?: number
	scopes: Scope[]

	// vvv Whole token handling thingie is down there vvv

	/**
	 * Use `createAsync` instead of the default constructor if you don't have at least an access_token
	 */
	constructor(client?: {id: number, secret: string}, token_type?: string, expires?: Date,
	access_token?: string, scopes?: Scope[], refresh_token?: string, user?: number) {
		this.client = client ?? {id: 0, secret: ""}
		this.token_type = token_type ?? ""
		this.expires = expires ?? new Date()
		this.access_token = access_token ?? ""
		this.scopes = scopes ?? []
		if (refresh_token) {this.refresh_token = refresh_token}
		if (user) {this.user = user}
	}

	private log(...to_log: any[]): void {
		console.log("osu!api v2 ->", ...to_log)
	}

	private async obtainToken(body: any, api: API): Promise<API | null> {
		let response = await fetch(`https://osu.ppy.sh/oauth/token`, {
			method: "post",
			headers: {
				"Accept": "application/json",
				"Content-Type": "application/json"
			},
			body: JSON.stringify(body)
		})
		.catch((error: FetchError) => api.log(error.name, error.message))

		if (!response || !response.ok) {
			return null
		}

		let json: any = await response.json()
		if (!json.access_token) {
			return null
		}
		
		let token = json.access_token
		let token_payload = JSON.parse(Buffer.from(token.substring(token.indexOf(".") + 1, token.lastIndexOf(".")), "base64").toString('ascii'))
		if (token_payload.sub && token_payload.sub.length) {api.user = Number(token_payload.sub)}
		api.scopes = token_payload.scopes
		api.access_token = token
		api.token_type = json.token_type
		if (json.refresh_token) {api.refresh_token = json.refresh_token}

		let expiration_date = new Date()
		expiration_date.setSeconds(expiration_date.getSeconds() + json.expires_in)
		api.expires = expiration_date

		return api
	}

	/**
	 * The normal way to create an API instance! Make sure to `await` it
	 * @param client The ID and the secret of your client, can be found on https://osu.ppy.sh/home/account/edit#new-oauth-application
	 * @param user If the instance is supposed to represent a user, use their code and the redirect_uri of your application!
	 * @returns A promise with an API instance (or with null if something goes wrong)
	 */
	public static createAsync = async (client: {id: number, secret: string}, user?: {code: string, redirect_uri: string}) => {
		const new_api = new API()
		new_api.client = client
		
		let body = {
			client_id: client.id,
			client_secret: client.secret,
			grant_type: user ? "authorization_code" : "client_credentials",
			redirect_uri: user ? user.redirect_uri : null,
			code: user ? user.code : null,
			scope: user ? null : "public"
		}

		let api = await new_api.obtainToken(body, new_api)
		return api
	}

	async refreshToken() {
		if (!this.refresh_token) {return false}
		let body = {
			client_id: this.client.id,
			client_secret: this.client.secret,
			grant_type: "refresh_token",
			refresh_token: this.refresh_token	
		}

		let response = await this.obtainToken(body, this)
		return response ? true : false
	}

	// ^^^ Whole token handling thingie is up there ^^^

	/**
	 * @param endpoint What comes in the URL after `api/`
	 * @param parameters The things to specify in the request, such as the beatmap_id when looking for a beatmap
	 * @param number_try How many attempts there's been to get the data
	 * @returns A Promise with either the API's response or `false` upon failing
	 */
	private async request(method: "get" | "post", endpoint: string,
	parameters?: {[k: string]: any}, number_try?: number): Promise<any | false> {
		const max_tries = 5
		if (!number_try) {number_try = 1}
		let to_retry = false

		if (parameters !== undefined) {
			for (let i = 0; i < Object.entries(parameters).length; i++) {
				if (!String(Object.values(parameters)[i]).length || Object.values(parameters)[i] === undefined) {
					i--
					delete parameters[Object.keys(parameters)[i + 1]]
				}
			}
		}

		let response = await fetch(`https://osu.ppy.sh/api/v2/${endpoint}?` + (method === "get" && parameters ? new URLSearchParams(parameters) : ""), {
			method,
			headers: {
				"Accept": "application/json",
				"Accept-Encoding": "gzip",
				"Content-Type": "application/json",
				"User-Agent": "osu-api-v2-js (https://github.com/TTTaevas/osu-api-v2-js)",
				"Authorization": `${this.token_type} ${this.access_token}`
			},
			body: method === "post" ? JSON.stringify(parameters) : null
		})
		.catch((error: FetchError) => {
			this.log(error.name, error.code, {type: endpoint, parameters})
			if (error.code === "401") this.log("Server responded with status code 401, maybe you need to do this action as an user?")
			if (error.code === "429") {
				this.log("Server responded with status code 429, you're sending too many requests at once and are getting rate-limited!")
				if (number_try !== undefined && number_try < max_tries) this.log(`Will request again in a few instants... (Try #${number_try})`)
				to_retry = true
			}
		})

		if (!response) {
			this.log("Request made but server did not respond", `(Try #${number_try})`, {type: endpoint, parameters})
			to_retry = true
		}

		/**
		* Under specific circumstances, we want to retry our request automatically
		* However, spamming the server during the same second in any of these circumstances would be pointless
		* So we wait for 1 to 5 seconds to make our request, 5 times maximum
		*/
		if (to_retry) {
			if (number_try < max_tries) {
				let to_wait = (Math.floor(Math.random() * (500 - 100 + 1)) + 100) * 10
				await new Promise(res => setTimeout(res, to_wait))
				return await this.request(method, endpoint, parameters, number_try + 1)
			} else {
				return false
			}
		}

		return response!.json()
	}


	// USER STUFF

	/**
	 * REQUIRES A USER ASSOCIATED TO THE API OBJECT (PUBLIC SCOPE)
	 */
	async getResourceOwner(ruleset?: Rulesets): Promise<UserExtended | APIError> {
		let response = await this.request("get", "me", {mode: ruleset !== undefined ? Rulesets[ruleset] : ""})
		if (!response) {return new APIError(`No User could be found`)}
		return correctType(response) as UserExtended
	}

	async getUser(user: {id?: number, username?: string} | User, ruleset?: Rulesets): Promise<UserExtended | APIError> {
		if (!user.id && !user.username) {return new APIError("No proper `user` argument was given")}
		let key = user.id !== undefined ? "id" : "username"
		let lookup = user.id !== undefined ? user.id : user.username

		let response = await this.request("get", `users/${lookup}${ruleset !== undefined ? `/${Rulesets[ruleset]}` : ""}`, {key})
		if (!response) {return new APIError(`No User could be found (user id: ${user.id} / username: ${user.username})`)}
		return correctType(response) as UserExtended
	}

	async getUsers(ids?: number[]): Promise<User[] | APIError> {
		let response = await this.request("get", "users", {ids})
		if (!response || !response.users || !response.users.length) {return new APIError(`No User could be found (ids: ${ids})`)}
		return response.users.map((u: User) => correctType(u)) as User[]
	}

	async getUserScores(limit: number, user: {id: number} | User, type: "best" | "firsts" | "recent",
	options?: {ruleset?: Rulesets, include_fails?: boolean, offset?: number}): Promise<Score[] | APIError> {
		let mode = options && options.ruleset !== undefined ? Rulesets[options.ruleset] : ""
		let offset = options && options.offset !== undefined ? options.offset : ""
		let include_fails = options && options.include_fails !== undefined ? options.include_fails : ""

		let response = await this.request("get", `users/${user.id}/scores/${type}`, {limit, mode, offset, include_fails})
		if (!response || !response.length) {return new APIError(`No Score could be found (id: ${user.id} / type: ${type})`)}
		return response.map((s: Score) => correctType(s)) as Score[]
	}

	async getUserKudosu(user: {id: number} | User, limit?: number, offset?: number): Promise<KudosuHistory[] | APIError> {
		let response = await this.request("get", `users/${user.id}/kudosu`, {limit, offset})
		if (!response || !response.length) {return new APIError(`No Kudosu could be found (id: ${user.id})`)}
		return response.map((k: KudosuHistory) => correctType(k)) as KudosuHistory[]
	}

	/**
	 * REQUIRES A USER ASSOCIATED TO THE API OBJECT (FRIENDS.READ SCOPE)
	 */
	async getFriends(): Promise<User[] | APIError> {
		let response = await this.request("get", "friends")
		if (!response || !response.length) {return new APIError(`No Friend could be found`)}
		return response.map((f: User) => correctType(f)) as User[]
	}

	
	// BEATMAP STUFF

	async getBeatmap(beatmap: {id: number} | Beatmap): Promise<BeatmapExtended | APIError> {
		let response = await this.request("get", `beatmaps/${beatmap.id}`)
		if (!response) {return new APIError(`No Beatmap could be found (id: ${beatmap.id})`)}
		return correctType(response) as BeatmapExtended
	}

	async getBeatmaps(ids?: number[]): Promise<BeatmapExtended[] | APIError> {
		let response = await this.request("get", "beatmaps", {ids})
		if (!response || !response.beatmaps || !response.beatmaps.length) {return new APIError(`No Beatmap could be found (ids: ${ids})`)}
		return response.beatmaps.map((b: BeatmapExtended) => correctType(b)) as BeatmapExtended[]
	}

	/**
	 * @remarks Will ignore the settings of your mods
	 */
	async getBeatmapAttributes(beatmap: {id: number} | Beatmap,
	ruleset: Rulesets, mods: Mod[] | string[] | number): Promise<BeatmapAttributes | APIError> {
		let response = await this.request("post", `beatmaps/${beatmap.id}/attributes`, {ruleset_id: ruleset, mods})
		if (!response) {return new APIError(`No Beatmap could be found (id: ${beatmap.id})`)}
		return correctType(response) as BeatmapAttributes
	}

	/**
	 * @remarks The specified ruleset will currently not affect the returned object
	 */
	async getBeatmapUserScore(beatmap: {id: number} | Beatmap, user: {id: number} | User,
	ruleset?: Rulesets): Promise<BeatmapUserScore | APIError> {
		let response = await this.request("get", `beatmaps/${beatmap.id}/scores/users/${user.id}`)
		if (!response) {return new APIError(`No Score could be found (beatmap: ${beatmap.id} / user: ${user.id})`)}
		return correctType(response) as BeatmapUserScore
	}

	async getBeatmapPack(pack: {tag: string} | BeatmapPack): Promise<BeatmapPack | APIError> {
		let response = await this.request("get", `beatmaps/packs/${pack.tag}`)
		if (!response) {return new APIError(`No BeatmapPack could be found (pack: ${pack})`)}
		return correctType(response) as BeatmapPack
	}

	async getBeatmapPacks(type: "standard" | "featured" | "tournament" | "loved" | "chart" | "theme" | "artist" = "standard"): Promise<BeatmapPack[] | APIError> {
		let response = await this.request("get", "beatmaps/packs", {type})
		if (!response || !response.beatmap_packs || !response.beatmap_packs.length) {return new APIError(`No BeatmapPack could be found (type: ${type})`)}
		return correctType(response.beatmap_packs) as BeatmapPack[]
	}


	// CHANGELOG STUFF

	async getChangelogBuild(stream: string, build: string): Promise<ChangelogBuild | APIError> {
		let response = await this.request("get", `changelog/${stream}/${build}`)
		if (!response) {return new APIError(`No Build could be found (stream: ${stream} / build: ${build})`)}
		return correctType(response) as ChangelogBuild
	}

	async getChangelogListing(format: "html" | "markdown", options?: {build_version_range?: {from?: string, to?: string},
	max_id: number, stream: string}): Promise<ChangelogBuild[] | APIError> {
		let message_format = [format]
		let from = options ? options.build_version_range ? options.build_version_range.from ? options.build_version_range.from : "" : "" : ""
		let to = options ? options.build_version_range ? options.build_version_range.from ? options.build_version_range.from : "" : "" : ""
		let stream = options ? options.stream ? options.stream : "" : ""
		let max_id = options ? options.max_id ? options.max_id : "" : ""

		let response = await this.request("get", `changelog`, {message_format, from, to, stream, max_id})
		if (!response || !response.builds) {return new APIError(`No Build could be found...`)}
		return response.builds.map((b: ChangelogBuild) => correctType(b)) as ChangelogBuild[] 
	}

	async getChangelogStreams(): Promise<UpdateStream[] | APIError> {
		let response = await this.request("get", `changelog`, {max_id: 1})
		if (!response || !response.streams) {return new APIError(`No stream could be found...`)}
		return response.streams.map((s: UpdateStream) => correctType(s)) as UpdateStream[] 
	}


	// MULTIPLAYER STUFF

	async getRoom(room: {id: number} | Room): Promise<Room | APIError> {
		let response = await this.request("get", `rooms/${room.id}`)
		if (!response) {return new APIError(`No Room could be found (id: ${room.id})`)}
		return correctType(response) as Room
	}

	async getMatch(id: number): Promise<Match | APIError> {
		let response = await this.request("get", `matches/${id}`)
		if (!response) {return new APIError(`No Match could be found (id: ${id})`)}
		return correctType(response) as Match
	}

	async getMatches(): Promise<MatchInfo[] | APIError> {
		let response = await this.request("get", "matches")
		if (!response || !response.matches || !response.matches.length) {return new APIError(`No Match could be found`)}
		return response.matches.map((m: MatchInfo) => correctType(m)) as MatchInfo[]
	}

	/**
	 * REQUIRES A USER ASSOCIATED TO THE API OBJECT (PUBLIC SCOPE)
	 */
	async getRooms(mode?: "owned" | "participated" | "ended"): Promise<Room[] | APIError> {
		let response = await this.request("get", `rooms/${mode ? mode : ""}`)
		if (!response || !response.length) {
			{return new APIError(`No Room could be found${mode ? ` (mode: ${mode})` : ""}`)}
		}
		return response.map((r: Room) => correctType(r)) as Room[]
	}

	/**
	 * REQUIRES A USER ASSOCIATED TO THE API OBJECT (PUBLIC SCOPE)
	 */
	async getRoomLeaderboard(room: {id: number} | Room): Promise<Leader[] | APIError> {
		let response = await this.request("get", `rooms/${room.id}/leaderboard`)
		if (!response || !response.leaderboard || !response.leaderboard.length) {
			return new APIError(`No Leaderboard could be found (id: ${room.id})`)
		}
		return response.leaderboard.map((l: Leader) => correctType(l)) as Leader[]
	}

	/**
	 * REQUIRES A USER ASSOCIATED TO THE API OBJECT (PUBLIC SCOPE)
	 * @remarks (2023-11-05) Is currently broken on osu!'s side, gotta love the API not being stable!
	 */
	async getPlaylistItemScores(item: {id: number, room_id: number} | PlaylistItem): Promise<MultiplayerScore[] | APIError> {
		let response = await this.request("get", `rooms/${item.room_id}/playlist/${item.id}/scores`)
		if (!response || !response.scores || !response.scores.length) {return new APIError(`No Item could be found (room: ${item.room_id} / item: ${item.id})`)}
		return response.scores.map((s: MultiplayerScore) => correctType(s)) as MultiplayerScore[]
	}


	// RANKING STUFF

	async getRanking(ruleset: Rulesets, type: "charts" | "country" | "performance" | "score", filter: "all" | "friends",
	options?: {country?: number, spotlight?: {id: number} | Spotlight, variant?: "4k" | "7k"}): Promise<Rankings | APIError> {
		let response = await this.request("get", `rankings/${Rulesets[ruleset]}/${type}`, {
			filter,
			country: options?.country,
			spotlight: options?.spotlight,
			variant: options?.variant
		})
		if (!response) {return new APIError(`No Ranking could be found (type: ${type})`)}
		return correctType(response) as Rankings
	}

	async getSpotlights(): Promise<Spotlight[] | APIError> {
		let response = await this.request("get", "spotlights")
		if (!response || !response.spotlights || !response.spotlights.length) {return new APIError(`No Spotlight could be found`)}
		return response.spotlights.map((s: Spotlight) => correctType(s)) as Spotlight[]
	}
}

type Scope = "chat.write" | "delegate" | "forum.write" | "friends.read" | "identify" | "public"
export function generateAuthorizationURL(client_id: number, redirect_uri: string, scopes: Scope[]) {
	let s = String(scopes).replace(/,/g, "%20")
	return `https://osu.ppy.sh/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${s}&response_type=code`
}

/**
 * Some stuff doesn't have the right type to begin with, such as dates, which are being returned as strings, this fixes that
 * @param x Anything, but should be a string, an array that contains a string, or an object which has a string
 * @returns x, but with it (or what it contains) now having the correct type
 */
function correctType(x: any): any {
	if (typeof x === "boolean") {
		return x
	} else if (!isNaN(x)) {
		return x === null ? null : Number(x)
	} else if (/^[+-[0-9][0-9]+-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$/.test(x) ||
	/^[+-[0-9][0-9]+-[0-9]{2}-[0-9]{2}$/g.test(x)) {
		return new Date(x)
	} else if (/^[+-[0-9][0-9]+-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$/.test(x)) {
		x += "Z"
		return new Date(x)
	} else if (/^[+-[0-9][0-9]+-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\+[0-9]{2}:[0-9]{2}$/.test(x)) {
		x = x.substring(0, x.indexOf("+")) + "Z"
		return new Date(x)
	} else if (Array.isArray(x)) {
		return x.map((e) => correctType(e))
	} else if (typeof x === "object" && x !== null) {
		const k = Object.keys(x)
		const v = Object.values(x)
		for (let i = 0; i < k.length; i++) {
			x[k[i]] = correctType(v[i])
		}
	}
	return x
}
