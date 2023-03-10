import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios"
import { Beatmap, BeatmapAttributes, BeatmapCompact } from "./beatmap"
import { KudosuHistory, User, UserCompact } from "./user"
import { Leader, Match, MatchInfo, MultiplayerScore, PlaylistItem, Room } from "./multiplayer"
import { GameModes, Mod } from "./misc"
import { BeatmapUserScore, Score } from "./score"

export {Beatmap, BeatmapCompact}
export {User, UserCompact, KudosuHistory}
export {BeatmapUserScore, Score}
export {Room, Leader, PlaylistItem, MultiplayerScore}
export {GameModes}

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
	 * The normal way to create an API instance! Make sure to `await` it
	 * @param client The ID and the secret of your client, can be found on https://osu.ppy.sh/home/account/edit#new-oauth-application
	 * @param user If the instance is supposed to represent a user, use their code and the redirect_uri of your application!
	 * @returns A promise with an API instance (or with null if something goes wrong)
	 */
	public static createAsync = async (client: {id: number, secret: string}, user?: {code: string, redirect_uri: string}) => {
		const me = new API()
		me.client = client
		
		let data: any = {
			client_id: client.id,
			client_secret: client.secret,
			grant_type: user ? "authorization_code" : "client_credentials"
		}
		if (user) {
			data.redirect_uri = user.redirect_uri
			data.code = user.code
		} else {
			data.scope = "public"
		}
		
		let response = await axios.post(`https://osu.ppy.sh/oauth/token`, data, {headers: {
			"Accept": "application/json",
			"Content-Type": "application/json"
		}}).catch((e: AxiosError) => console.log("osu!api v2 ->", `(${e.name}) ${e.message}`))
		
		if (response && response.data && response.data.access_token) {
			let token = response.data.access_token

			let date = new Date()
			date.setSeconds(date.getSeconds() + response.data.expires_in)
			me.token_type = response.data.token_type
			me.expires = date
			me.access_token = token
			if (response.data.refresh_token) {me.refresh_token = response.data.refresh_token}

			let token_payload = JSON.parse(Buffer.from(token.substring(token.indexOf(".") + 1, token.lastIndexOf(".")), "base64").toString('ascii'))
			if (token_payload.sub && token_payload.sub.length) {me.user = Number(token_payload.sub)}
			me.scopes = token_payload.scopes
		} else {
			return null
		}
		return me
	}

	async refreshToken() {
		if (!this.refresh_token) {return false}
		let data = {
			client_id: this.client.id,
			client_secret: this.client.secret,
			grant_type: "refresh_token",
			refresh_token: this.refresh_token	
		}

		let response = await axios.post(`https://osu.ppy.sh/oauth/token`, data, {headers: {
			"Accept": "application/json",
			"Content-Type": "application/json"
		}}).catch((e: AxiosError) => console.log("osu!api v2 ->", `(${e.name}) ${e.message}`))
		
		if (response && response.data && response.data.token_type) {
			let date = new Date()
			date.setSeconds(date.getSeconds() + response.data.expires_in)
			this.token_type = response.data.token_type
			this.expires = date
			this.access_token = response.data.access_token
			if (response.data.refresh_token) {this.refresh_token = response.data.refresh_token}
		} else {
			return false
		}
		return true
	}

	// ^^^ Whole token handling thingie is up there ^^^

	/**
	 * @param endpoint What comes in the URL after `api/`
	 * @param parameters The things to specify in the request, such as the beatmap_id when looking for a beatmap
	 * @param number_try How many attempts there's been to get the data
	 * @returns A Promise with either the API's response or `false` upon failing
	 */
	private async request(method: "get" | "post", endpoint: string,
	parameters?: {[k: string]: any}, number_try?: number): Promise<AxiosResponse["data"] | false> {
		const max_tries = 5
		if (!number_try) {number_try = 1}
		let to_retry = false

		let data: {[k: string]: any} = {}
		let params: {[k: string]: any} = {}

		if (parameters !== undefined) {
			for (let i = 0; i < Object.entries(parameters).length; i++) {
				if (!String(Object.values(parameters)[i]).length || Object.values(parameters)[i] === undefined) {
					i--
					delete parameters[Object.keys(parameters)[i + 1]]
				}
			}

			if (method === "post") {
				data = parameters ?? {}
			} else {
				params = parameters ?? {}
			}
		}

		let request: AxiosRequestConfig = {
			method,
			baseURL: "https://osu.ppy.sh/api/v2/",
			url: endpoint,
			headers: {
				"Accept": "application/json",
				"Accept-Encoding": "gzip",
				"Content-Type": "application/json",
				"User-Agent": "osu-api-v2-js (https://github.com/TTTaevas/osu-api-v2-js)",
				"Authorization": `${this.token_type} ${this.access_token}`
			},
			data,
			params
		}
	
		const resp = await axios(request)
		.catch((error: Error | AxiosError) => {
			if (axios.isAxiosError(error)) {
				if (error.response) {
					console.log("osu!api v2 ->", error.response.statusText, error.response.status, {type: endpoint, parameters})
					if (error.response.status === 401) console.log("osu!api v2 -> Server responded with status code 401, maybe you need to do this action as an user?")
					if (error.response.status === 429) {
						console.log("osu!api v2 -> Server responded with status code 429, you're sending too many requests at once and are getting rate-limited!")
						if (number_try !== undefined && number_try < max_tries) {console.log(`osu!api v2 -> Will request again in a few instants... (Try #${number_try})`)}
						to_retry = true
					}
				} else if (error.request) {
					console.log("osu!api v2 ->", "Request made but server did not respond", `(Try #${number_try})`, {type: endpoint, parameters})
					to_retry = true
				} else { // Something happened in setting up the request that triggered an error, I think
					console.error(error)
				}
			} else {
				console.error(error)
			}
		})
		
		if (resp) {
			console.log("osu!api v2 ->", resp.statusText, resp.status, {type: endpoint, parameters})
			return resp.data
		} else {
			/**
			 * Under specific circumstances, we want to retry our request automatically
			 * However, spamming the server during the same second in any of these circumstances would be pointless
			 * So we wait for 1 to 5 seconds to make our request, 5 times maximum
			 */
			if (to_retry && number_try < max_tries) {
				let to_wait = (Math.floor(Math.random() * (500 - 100 + 1)) + 100) * 10
				await new Promise(res => setTimeout(res, to_wait))
				return await this.request(method, endpoint, parameters, number_try + 1)
			} else {
				return false
			}
		}
	}


	// USER STUFF

	/**
	 * REQUIRES A USER ASSOCIATED TO THE API OBJECT (PUBLIC SCOPE)
	 */
	async getResourceOwner(gamemode?: GameModes): Promise<User | APIError> {
		let response = await this.request("get", "me", {mode: gamemode !== undefined ? GameModes[gamemode] : ""})
		if (!response) {return new APIError(`No User could be found`)}
		return correctType(response) as User
	}

	async getUser(user: {id?: number, username?: string} | UserCompact, gamemode?: GameModes): Promise<User | APIError> {
		if (!user.id && !user.username) {return new APIError("No proper `user` argument was given")}
		let key = user.id !== undefined ? "id" : "username"
		let lookup = user.id !== undefined ? user.id : user.username

		let response = await this.request("get", `users/${lookup}${gamemode !== undefined ? `/${GameModes[gamemode]}` : ""}`, {key})
		if (!response) {return new APIError(`No User could be found (user id: ${user.id} / username: ${user.username})`)}
		return correctType(response) as User
	}

	async getUsers(ids?: number[]): Promise<UserCompact[] | APIError> {
		let response = await this.request("get", "users", {ids})
		if (!response || !response.users || !response.users.length) {return new APIError(`No User could be found (ids: ${ids})`)}
		return response.users.map((u: UserCompact) => correctType(u)) as UserCompact[]
	}

	async getUserScores(limit: number, user: {id: number} | UserCompact, type: "best" | "firsts" | "recent",
	options?: {gamemode?: GameModes, include_fails?: Boolean, offset?: number}): Promise<Score[] | APIError> {
		let mode = options && options.gamemode !== undefined ? GameModes[options.gamemode] : ""
		let offset = options && options.offset !== undefined ? options.offset : ""
		let include_fails = options && options.include_fails !== undefined ? options.include_fails : ""

		let response = await this.request("get", `users/${user.id}/scores/${type}`, {limit, mode, offset, include_fails})
		if (!response || !response.length) {return new APIError(`No Score could be found (id: ${user.id} / type: ${type})`)}
		return response.map((s: Score) => correctType(s)) as Score[]
	}

	async getUserKudosu(user: {id: number} | UserCompact, limit?: number, offset?: number): Promise<KudosuHistory[] | APIError> {
		let response = await this.request("get", `users/${user.id}/kudosu`, {limit, offset})
		if (!response || !response.length) {return new APIError(`No Kudosu could be found (id: ${user.id})`)}
		return response.map((k: KudosuHistory) => correctType(k)) as KudosuHistory[]
	}

	/**
	 * REQUIRES A USER ASSOCIATED TO THE API OBJECT (FRIENDS.READ SCOPE)
	 */
	async getFriends(): Promise<UserCompact[] | APIError> {
		let response = await this.request("get", "friends")
		if (!response || !response.length) {return new APIError(`No Friend could be found`)}
		return response.map((f: UserCompact) => correctType(f)) as UserCompact[]
	}

	
	// BEATMAP STUFF

	async getBeatmap(beatmap: {id: number} | BeatmapCompact): Promise<Beatmap | APIError> {
		let response = await this.request("get", `beatmaps/${beatmap.id}`)
		if (!response) {return new APIError(`No Beatmap could be found (id: ${beatmap.id})`)}
		return correctType(response) as Beatmap
	}

	async getBeatmaps(ids?: number[]): Promise<Beatmap[] | APIError> {
		let response = await this.request("get", "beatmaps", {ids})
		if (!response || !response.beatmaps || !response.beatmaps.length) {return new APIError(`No Beatmap could be found (ids: ${ids})`)}
		return response.beatmaps.map((b: Beatmap) => correctType(b)) as Beatmap[]
	}

	/**
	 * @remarks Will ignore the settings of your mods
	 */
	async getBeatmapAttributes(beatmap: {id: number} | BeatmapCompact, gamemode: GameModes, mods: Mod[]): Promise<BeatmapAttributes | APIError> {
		let response = await this.request("post", `beatmaps/${beatmap.id}/attributes`, {ruleset_id: gamemode, mods})
		if (!response) {return new APIError(`No Beatmap could be found (id: ${beatmap.id})`)}
		return correctType(response) as BeatmapAttributes
	}

	async getBeatmapUserScore(beatmap: {id: number} | BeatmapCompact, user: {id: number} | UserCompact,
	gamemode?: GameModes): Promise<BeatmapUserScore | APIError> {
		let response = await this.request("get", `beatmaps/${beatmap.id}/scores/users/${user.id}`)
		if (!response) {return new APIError(`No Score could be found (beatmap: ${beatmap.id} / user: ${user.id})`)}
		return correctType(response) as BeatmapUserScore
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
	 */
	async getPlaylistItemScores(item: {id: number, room_id: number} | PlaylistItem): Promise<MultiplayerScore[] | APIError> {
		let response = await this.request("get", `rooms/${item.room_id}/playlist/${item.id}/scores`)
		if (!response || !response.scores || !response.scores.length) {return new APIError(`No Item could be found (room: ${item.room_id} / item: ${item.id})`)}
		return response.scores.map((s: MultiplayerScore) => correctType(s)) as MultiplayerScore[]
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
