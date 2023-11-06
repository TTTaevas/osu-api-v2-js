import fetch, { FetchError } from "node-fetch"
import { BeatmapExtended, BeatmapAttributes, Beatmap, BeatmapPack, Beatmapset, BeatmapsetExtended } from "./beatmap.js"
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

	/**
	 * Use this instead of `console.log` to log any information
	 * @param is_error Is the logging happening because of an error?
	 * @param to_log Whatever you would put between the parentheses of `console.log()`
	 */
	private log(is_error: boolean, ...to_log: any[]): void {
		console.log("osu!api v2 ->", ...to_log)
	}

	private async obtainToken(body: any, api: API): Promise<API> {
		const response = await fetch(`https://osu.ppy.sh/oauth/token`, {
			method: "post",
			headers: {
				"Accept": "application/json",
				"Content-Type": "application/json"
			},
			body: JSON.stringify(body)
		})

		const json: any = await response.json()
		if (!json.access_token) {
			this.log(true, "Unable to obtain a token! Here's what was received from the API:", json)
			throw new APIError("No token obtained")
		}
		
		const token = json.access_token
		const token_payload = JSON.parse(Buffer.from(token.substring(token.indexOf(".") + 1, token.lastIndexOf(".")), "base64").toString('ascii'))
		if (token_payload.sub && token_payload.sub.length) {api.user = Number(token_payload.sub)}
		api.scopes = token_payload.scopes
		api.access_token = token
		api.token_type = json.token_type
		if (json.refresh_token) {api.refresh_token = json.refresh_token}

		const expiration_date = new Date()
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
	public static createAsync = async (client: {id: number, secret: string}, user?: {code: string, redirect_uri: string}): Promise<API> => {
		const new_api = new API()
		new_api.client = client
		
		const body = {
			client_id: client.id,
			client_secret: client.secret,
			grant_type: user ? "authorization_code" : "client_credentials",
			redirect_uri: user ? user.redirect_uri : null,
			code: user ? user.code : null,
			scope: user ? null : "public"
		}

		const api = await new_api.obtainToken(body, new_api)
		return api
	}

	async refreshToken() {
		if (!this.refresh_token) {return false}
		const body = {
			client_id: this.client.id,
			client_secret: this.client.secret,
			grant_type: "refresh_token",
			refresh_token: this.refresh_token	
		}

		const response = await this.obtainToken(body, this)
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
	parameters?: {[k: string]: any}, number_try: number = 1): Promise<any> {
		const max_tries = 5
		let err = "none"
		let to_retry = false

		if (parameters !== undefined) {
			for (let i = 0; i < Object.entries(parameters).length; i++) {
				if (!String(Object.values(parameters)[i]).length || Object.values(parameters)[i] === undefined) {
					i--
					delete parameters[Object.keys(parameters)[i + 1]]
				}
			}
		}

		const response = await fetch(`https://osu.ppy.sh/api/v2/${endpoint}?` + (method === "get" && parameters ? new URLSearchParams(parameters) : ""), {
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
			this.log(true, error.message)
			err = `${error.name} (${error.errno})`
		})

		if (!response || !response.ok) {
			if (response) {
				err = response.statusText
				if (response.status === 401) {
					this.log(true, "Server responded with status code 401, maybe you need to do this action as an user?")
				} else if (response.status === 429) {
					this.log(true, "Server responded with status code 429, you're sending too many requests at once and are getting rate-limited!")
					to_retry = true
				} else {
					this.log(true, "Server responded with status:", response.status)
				}
			}

			/**
			 * Under specific circumstances, we want to retry our request automatically
			 * However, spamming the server during the same second in any of these circumstances would be pointless
			 * So we wait for 1 to 5 seconds to make our request, 5 times maximum
			*/
			if (to_retry === true && number_try < max_tries) {
				this.log(true, "Will request again in a few instants...", `(Try #${number_try})`)
				const to_wait = (Math.floor(Math.random() * (500 - 100 + 1)) + 100) * 10
				await new Promise(res => setTimeout(res, to_wait))
				return await this.request(method, endpoint, parameters, number_try + 1)
			}

			throw new APIError(err)
		}

		this.log(false, response.statusText, response.status, {endpoint, parameters})
		return response.json()
	}


	// USER STUFF

	/**
	 * REQUIRES A USER ASSOCIATED TO THE API OBJECT (PUBLIC SCOPE)
	 */
	async getResourceOwner(ruleset?: Rulesets): Promise<UserExtended> {
		const response = await this.request("get", "me", {mode: ruleset})
		return correctType(response) as UserExtended
	}

	async getUser(user: {id?: number, username?: string} | User, ruleset?: Rulesets): Promise<UserExtended> {
		const key = user.id !== undefined ? "id" : "username"
		const lookup = user.id !== undefined ? user.id : user.username
		const mode = ruleset ? `/${Rulesets[ruleset]}` : ""

		const response = await this.request("get", `users/${lookup}${mode}`, {key})
		return correctType(response) as UserExtended
	}

	async getUsers(ids?: number[]): Promise<User[]> {
		const response = await this.request("get", "users", {ids})
		return response.users.map((u: User) => correctType(u)) as User[]
	}

	async getUserScores(limit: number, user: {id: number} | User, type: "best" | "firsts" | "recent",
	options?: {ruleset?: Rulesets, include_fails?: boolean, offset?: number}): Promise<Score[]> {
		const mode = options && options.ruleset !== undefined ? Rulesets[options.ruleset] : ""
		const offset = options && options.offset !== undefined ? options.offset : ""
		const include_fails = options && options.include_fails !== undefined ? options.include_fails : ""

		const response = await this.request("get", `users/${user.id}/scores/${type}`, {limit, mode, offset, include_fails})
		return response.map((s: Score) => correctType(s)) as Score[]
	}

	async getUserKudosu(user: {id: number} | User, limit?: number, offset?: number): Promise<KudosuHistory[]> {
		const response = await this.request("get", `users/${user.id}/kudosu`, {limit, offset})
		return response.map((k: KudosuHistory) => correctType(k)) as KudosuHistory[]
	}

	/**
	 * REQUIRES A USER ASSOCIATED TO THE API OBJECT (FRIENDS.READ SCOPE)
	 */
	async getFriends(): Promise<User[]> {
		const response = await this.request("get", "friends")
		return response.map((f: User) => correctType(f)) as User[]
	}

	
	// BEATMAP STUFF

	async getBeatmap(beatmap: {id: number} | Beatmap): Promise<BeatmapExtended> {
		const response = await this.request("get", `beatmaps/${beatmap.id}`)
		return correctType(response) as BeatmapExtended
	}

	async getBeatmaps(ids?: number[]): Promise<BeatmapExtended[]> {
		const response = await this.request("get", "beatmaps", {ids})
		return response.beatmaps.map((b: BeatmapExtended) => correctType(b)) as BeatmapExtended[]
	}

	/**
	 * @remarks Will ignore the settings of your mods
	 */
	async getBeatmapAttributes(beatmap: {id: number} | Beatmap,
	ruleset: Rulesets, mods: Mod[] | string[] | number): Promise<BeatmapAttributes> {
		const response = await this.request("post", `beatmaps/${beatmap.id}/attributes`, {ruleset_id: ruleset, mods})
		return correctType(response) as BeatmapAttributes
	}

	async getBeatmapset(beatmapset: {id: number} | Beatmapset): Promise<BeatmapsetExtended> {
		const response = await this.request("get", `beatmapsets/${beatmapset.id}`)
		return correctType(response) as BeatmapsetExtended
	}

	/**
	 * @remarks The specified ruleset will currently not affect the returned object
	 */
	async getBeatmapUserScore(beatmap: {id: number} | Beatmap, user: {id: number} | User,
	ruleset?: Rulesets): Promise<BeatmapUserScore> {
		const response = await this.request("get", `beatmaps/${beatmap.id}/scores/users/${user.id}`)
		return correctType(response) as BeatmapUserScore
	}

	async getBeatmapPack(pack: {tag: string} | BeatmapPack): Promise<BeatmapPack> {
		const response = await this.request("get", `beatmaps/packs/${pack.tag}`)
		return correctType(response) as BeatmapPack
	}

	async getBeatmapPacks(type: "standard" | "featured" | "tournament" | "loved" | "chart" | "theme" | "artist" = "standard"): Promise<BeatmapPack[]> {
		const response = await this.request("get", "beatmaps/packs", {type})
		return correctType(response.beatmap_packs) as BeatmapPack[]
	}


	// CHANGELOG STUFF

	async getChangelogBuild(stream: string, build: string): Promise<ChangelogBuild> {
		const response = await this.request("get", `changelog/${stream}/${build}`)
		return correctType(response) as ChangelogBuild
	}

	async getChangelogListing(format: "html" | "markdown", options?: {build_version_range?: {from?: string, to?: string},
	max_id: number, stream: string}): Promise<ChangelogBuild[]> {
		const message_format = [format]
		const from = options ? options.build_version_range ? options.build_version_range.from ? options.build_version_range.from : "" : "" : ""
		const to = options ? options.build_version_range ? options.build_version_range.from ? options.build_version_range.from : "" : "" : ""
		const stream = options ? options.stream ? options.stream : "" : ""
		const max_id = options ? options.max_id ? options.max_id : "" : ""

		const response = await this.request("get", `changelog`, {message_format, from, to, stream, max_id})
		return response.builds.map((b: ChangelogBuild) => correctType(b)) as ChangelogBuild[] 
	}

	async getChangelogStreams(): Promise<UpdateStream[]> {
		const response = await this.request("get", `changelog`, {max_id: 1})
		return response.streams.map((s: UpdateStream) => correctType(s)) as UpdateStream[] 
	}


	// MULTIPLAYER STUFF

	async getRoom(room: {id: number} | Room): Promise<Room> {
		const response = await this.request("get", `rooms/${room.id}`)
		return correctType(response) as Room
	}

	/**
	 * REQUIRES A USER ASSOCIATED TO THE API OBJECT (PUBLIC SCOPE)
	 */
	async getRooms(mode: "active" | "all" | "ended" | "participated" | "owned" = "active"): Promise<Room[]> {
		const response = await this.request("get", "rooms", {mode})
		return response.map((r: Room) => correctType(r)) as Room[]
	}

	/**
	 * REQUIRES A USER ASSOCIATED TO THE API OBJECT (PUBLIC SCOPE)
	 */
	async getRoomLeaderboard(room: {id: number} | Room): Promise<Leader[]> {
		const response = await this.request("get", `rooms/${room.id}/leaderboard`)
		return response.leaderboard.map((l: Leader) => correctType(l)) as Leader[]
	}

	async getMatch(id: number): Promise<Match> {
		const response = await this.request("get", `matches/${id}`)
		return correctType(response) as Match
	}

	async getMatches(): Promise<MatchInfo[]> {
		const response = await this.request("get", "matches")
		return response.matches.map((m: MatchInfo) => correctType(m)) as MatchInfo[]
	}

	/**
	 * REQUIRES A USER ASSOCIATED TO THE API OBJECT (PUBLIC SCOPE)
	 * @remarks (2023-11-05) Is currently broken on osu!'s side, gotta love the API not being stable!
	 */
	async getPlaylistItemScores(item: {id: number, room_id: number} | PlaylistItem): Promise<MultiplayerScore[]> {
		const response = await this.request("get", `rooms/${item.room_id}/playlist/${item.id}/scores`)
		return response.scores.map((s: MultiplayerScore) => correctType(s)) as MultiplayerScore[]
	}


	// RANKING STUFF

	async getRanking(ruleset: Rulesets, type: "charts" | "country" | "performance" | "score", filter: "all" | "friends",
	options?: {country?: number, spotlight?: {id: number} | Spotlight, variant?: "4k" | "7k"}): Promise<Rankings> {
		const response = await this.request("get", `rankings/${Rulesets[ruleset]}/${type}`, {
			filter,
			country: options?.country,
			spotlight: options?.spotlight,
			variant: options?.variant
		})
		return correctType(response) as Rankings
	}

	async getSpotlights(): Promise<Spotlight[]> {
		const response = await this.request("get", "spotlights")
		return response.spotlights.map((s: Spotlight) => correctType(s)) as Spotlight[]
	}
}

type Scope = "chat.read" | "chat.write" | "chat.write_manage" | "delegate" | "forum.write" | "friends.read" | "identify" | "public"
export function generateAuthorizationURL(client_id: number, redirect_uri: string, scopes: Scope[]) {
	const s = String(scopes).replace(/,/g, "%20")
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
