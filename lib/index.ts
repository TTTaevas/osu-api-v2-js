import axios, { AxiosError, AxiosResponse } from "axios"
import { Beatmap, BeatmapCompact } from "./beatmap"
import { KudosuHistory, User, UserCompact } from "./user"
import { Leader, MultiplayerScore, PlaylistItem, Room } from "./multiplayer"
import { GameModes } from "./misc"
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

	private constructor() {
		this.client = {id: 0, secret: ""}
		this.token_type = ""
		this.expires = new Date()
		this.access_token = ""
		this.scopes = []
	}
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
	 * @param type Basically the endpoint, what comes in the URL after `api/`
	 * @param params The things to specify in the request, such as the beatmap_id when looking for a beatmap
	 * @param number_try How many attempts there's been to get the data
	 * @returns A Promise with either the API's response or `false` upon failing
	 */
	private async request(type: string, params?: string, number_try?: number): Promise<AxiosResponse["data"] | false> {
		if (!params) {params = ""}
		const max_tries = 5
		if (!number_try) {number_try = 1}
		let to_retry = false
	
		const resp = await axios({
			method: "get",
			baseURL: "https://osu.ppy.sh/api/v2/",
			url: `/${type}?${params}`,
			headers: {
				"Accept": "application/json",
				"Accept-Encoding": "gzip",
				"Content-Type": "application/json",
				"User-Agent": "osu-api-v2-js (https://github.com/TTTaevas/osu-api-v2-js)",
				"Authorization": `${this.token_type} ${this.access_token}`
			}
		})
		.catch((error: Error | AxiosError) => {
			if (axios.isAxiosError(error)) {
				if (error.response) {
					console.log("osu!api v2 ->", error.response.statusText, error.response.status, {type, params})
					if (error.response.status === 401) console.log("osu!api v2 -> Server responded with status code 401, are you sure you're using a valid API key?")
					if (error.response.status === 429) {
						console.log("osu!api v2 -> Server responded with status code 429, you're sending too many requests at once and are getting rate-limited!")
						if (number_try !== undefined && number_try < max_tries) {console.log(`osu!api v2 -> Will request again in a few instants... (Try #${number_try})`)}
						to_retry = true
					}
				} else if (error.request) {
					console.log("osu!api v2 ->", "Request made but server did not respond", `(Try #${number_try})`, {type, params})
					to_retry = true
				} else { // Something happened in setting up the request that triggered an error, I think
					console.error(error)
				}
			} else {
				console.error(error)
			}
		})
		
		if (resp) {
			console.log("osu!api v2 ->", resp.statusText, resp.status, {type, params})
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
				return await this.request(type, params, number_try + 1)
			} else {
				return false
			}
		}
	}


	// USER STUFF

	/**
	 * REQUIRES A USER ASSOCIATED TO THE API OBJECT
	 */
	async getResourceOwner(gamemode?: GameModes): Promise<User | APIError> {
		let response = await this.request("me", gamemode !== undefined ? GameModes[gamemode] : "")
		if (!response) {return new APIError(`No User could be found`)}
		return correctType(response) as User
	}

	async getUser(user: {id?: number, username?: string} | UserCompact, gamemode?: GameModes): Promise<User | APIError> {
		if (!user.id && !user.username) {return new APIError("No proper `user` argument was given")}
		let key = user.id !== undefined ? "id" : "username"
		let lookup = user.id !== undefined ? user.id : user.username

		let response = await this.request(`users/${lookup}${gamemode !== undefined ? `/${GameModes[gamemode]}` : ""}`, key)
		if (!response) {return new APIError(`No User could be found (user id: ${user.id} / username: ${user.username})`)}
		return correctType(response) as User
	}

	async getUsers(ids?: number[]): Promise<UserCompact[] | APIError> {
		let lookup = ""
		ids?.forEach((id) => lookup += `&ids[]=${id}`)
		let response = await this.request("users", lookup.substring(1))
		if (!response || !response.users || !response.users.length) {return new APIError(`No User could be found (ids: ${ids})`)}
		return response.users.map((u: UserCompact) => correctType(u)) as UserCompact[]
	}

	async getUserScores(limit: number, user: {id: number} | UserCompact, type: "best" | "firsts" | "recent",
	options?: {gamemode?: GameModes, include_fails?: Boolean, offset?: number}): Promise<Score[] | APIError> {
		let parameters = `limit=${limit}`
		if (options) {
			if (options.gamemode !== undefined) {parameters += `&mode=${GameModes[options.gamemode]}`}
			if (options.include_fails !== undefined) {parameters += `&include_fails=${Number(options.include_fails)}`}
			if (options.offset !== undefined) {parameters += `&offset=${options.offset}`}
		}
		let response = await this.request(`users/${user.id}/scores/${type}`, parameters)
		if (!response || !response.length) {return new APIError(`No Score could be found (id: ${user.id} / type: ${type})`)}
		return response.map((s: Score) => correctType(s)) as Score[]
	}

	async getUserKudosu(user: {id: number} | UserCompact, limit?: number, offset?: number): Promise<KudosuHistory[] | APIError> {
		let query = limit ? `limit=${limit}` : ""
		query += offset ? `${query.length ? "&" : ""}offset=${offset}` : ""
		let response = await this.request(`users/${user.id}/kudosu`, query)
		if (!response || !response.length) {return new APIError(`No Kudosu could be found (id: ${user.id})`)}
		return response.map((k: KudosuHistory) => correctType(k)) as KudosuHistory[]
	}

	
	// BEATMAP STUFF

	async getBeatmap(beatmap: {id: number} | BeatmapCompact): Promise<Beatmap | APIError> {
		let response = await this.request(`beatmaps/${beatmap.id}`)
		if (!response) {return new APIError(`No Beatmap could be found (id: ${beatmap.id})`)}
		return correctType(response) as Beatmap
	}

	async getBeatmaps(ids?: number[]): Promise<Beatmap[] | APIError> {
		let lookup = ""
		ids?.forEach((id) => lookup += `&ids[]=${id}`)
		let response = await this.request("beatmaps", lookup.substring(1))
		if (!response || !response.beatmaps || !response.beatmaps.length) {return new APIError(`No Beatmap could be found (ids: ${ids})`)}
		return response.beatmaps.map((b: Beatmap) => correctType(b)) as Beatmap[]
	}

	async getBeatmapUserScore(beatmap: {id: number} | BeatmapCompact, user: {id: number} | UserCompact,
	gamemode?: GameModes): Promise<BeatmapUserScore | APIError> {
		let response = await this.request(`beatmaps/${beatmap.id}/scores/users/${user.id}`)
		if (!response) {return new APIError(`No Score could be found (beatmap: ${beatmap.id} / user: ${user.id})`)}
		return correctType(response) as BeatmapUserScore
	}


	// MULTIPLAYER STUFF

	async getRoom(room: {id: number} | Room): Promise<Room | APIError> {
		let response = await this.request(`rooms/${room.id}`)
		if (!response) {return new APIError(`No Room could be found (id: ${room.id})`)}
		return correctType(response) as Room
	}

	/**
	 * REQUIRES A USER ASSOCIATED TO THE API OBJECT
	 */
	async getRooms(mode?: "owned" | "participated" | "ended"): Promise<Room[] | APIError> {
		let response = await this.request(`rooms/${mode ? mode : ""}`)
		if (!response || !response.length) {
			{return new APIError(`No Room could be found${mode ? ` (mode: ${mode})` : ""}`)}
		}
		return response.map((r: Room) => correctType(r)) as Room[]
	}

	/**
	 * REQUIRES A USER ASSOCIATED TO THE API OBJECT
	 */
	async getRoomLeaderboard(room: {id: number} | Room): Promise<Leader[] | APIError> {
		let response = await this.request(`rooms/${room.id}/leaderboard`)
		if (!response || !response.leaderboard || !response.leaderboard.length) {
			return new APIError(`No Leaderboard could be found (id: ${room.id})`)
		}
		return response.leaderboard.map((l: Leader) => correctType(l)) as Leader[]
	}

	/**
	 * REQUIRES A USER ASSOCIATED TO THE API OBJECT
	 */
	async getPlaylistItemScores(item: PlaylistItem): Promise<MultiplayerScore[] | APIError> {
		let response = await this.request(`rooms/${item.room_id}/playlist/${item.id}/scores`)
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
