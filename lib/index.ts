import fetch, { FetchError } from "node-fetch"
import WebSocket from "ws"
import querystring from "querystring"

import { User } from "./user.js"
import { Beatmap, Beatmapset } from "./beatmap.js"

import { Multiplayer } from "./multiplayer.js"
import { Score, BeatmapUserScore } from "./score.js"
import { Rankings, Spotlight } from "./ranking.js"
import { Event } from "./event.js"

import { Changelog } from "./changelog.js"
import { Forum, PollConfig } from "./forum.js"
import { WikiPage } from "./wiki.js"
import { News } from "./news.js"
import { SearchResult } from "./home.js"
import { Rulesets, Mod, Scope, Genres, Languages } from "./misc.js"
import { Chat } from "./chat.js"
import { Comment, CommentBundle } from "./comment.js"


export { User } from "./user.js"
export { Beatmap, Beatmapset, RankStatus } from "./beatmap.js"

export { Multiplayer } from "./multiplayer.js"
export { Score, BeatmapUserScore } from "./score.js"
export { Rankings, Spotlight } from "./ranking.js"
export { Event } from "./event.js"

export { Changelog } from "./changelog.js"
export { Forum, PollConfig } from "./forum.js"
export { WikiPage } from "./wiki.js"
export { News } from "./news.js"
export { SearchResult } from "./home.js"
export { Rulesets, Mod, Scope, Genres, Languages } from "./misc.js"
export { Chat } from "./chat.js"
export { WebSocket } from "./websocket.js"
export { Comment, CommentBundle } from "./comment.js"

/**
 * Some stuff doesn't have the right type to begin with, such as dates, which are being returned as strings, this fixes that
 * @param x Anything, but should be a string, an array that contains a string, or an object which has a string
 * @returns x, but with it (or what it contains) now having the correct type
 */
function correctType(x: any): any {
	const bannedProperties = [
		"name", "artist", "title", "location", "interests", "occupation", "twitter",
		"discord", "version", "author", "raw", "bbcode", "title", "message"
	]

	if (typeof x === "boolean") {
		return x
	} else if (/^[+-[0-9][0-9]+-[0-9]{2}-[0-9]{2}($|[ T].*)/.test(x)) {
		if (/[0-9]{2}:[0-9]{2}:[0-9]{2}$/.test(x)) x += "Z"
		if (/[0-9]{2}:[0-9]{2}:[0-9]{2}\+[0-9]{2}:[0-9]{2}$/.test(x)) x = x.substring(0, x.indexOf("+")) + "Z"
		return new Date(x)
	} else if (Array.isArray(x)) {
		return x.map((e) => correctType(e))
	} else if (!isNaN(x) && x !== "") {
		return x === null ? null : Number(x)
	} else if (typeof x === "object" && x !== null) {
		const k = Object.keys(x)
		const v = Object.values(x)
		for (let i = 0; i < k.length; i++) {
			if (typeof v[i] === "string" && bannedProperties.some((p) => k[i].includes(p))) continue // don't turn names made of numbers into integers
			x[k[i]] = correctType(v[i])
		}
	}
	return x
}


/**
 * Generates a link for users to click on in order to use your application!
 * @param client_id The Client ID, find it at https://osu.ppy.sh/home/account/edit#new-oauth-application
 * @param redirect_uri The specified Application Callback URL, aka where the user will be redirected upon clicking the button to authorize
 * @param scopes What you want to do with/as the user
 * @param server (defaults to https://osu.ppy.sh) The API server
 * @returns The link people should click on
 */
export function generateAuthorizationURL(client_id: number, redirect_uri: string, scopes: Scope[], server: string = "https://osu.ppy.sh"): string {
	const s = String(scopes).replace(/,/g, "%20")
	return `${server}/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${s}&response_type=code`
}

/** If the `API` throws an error, it should always be an `APIError`! */
export class APIError {
	message: string
	server: string
	endpoint: string
	parameters?: object
	/**
	 * @param message The reason why things didn't go as expected
	 * @param server The server to which the request was sent
	 * @param endpoint The type of resource that was requested from the server
	 * @param parameters The filters that were used to specify what resource was wanted
	 */
	constructor(message: string, server: string, endpoint: string, parameters?: object) {
		this.message = message
		this.server = server
		this.endpoint = endpoint
		this.parameters = parameters
	}
}

/** You can create an API instance using its `createAsync` function! {@link API.createAsync} */
export class API {
	client: {
		id: number
		secret: string
	}
	/**
	 * Should always be "Bearer"
	 */
	token_type: string
	expires: Date
	access_token: string
	/**
	 * Valid for an unknown amount of time, allows you to get a new token without going through the Authorization Code Grant!
	 * Use the API's `refreshToken` function to do that
	 */
	refresh_token?: string
	/**
	 * The osu! user id of the user who went through the Authorization Code Grant
	 */
	user?: number
	scopes: Scope[]
	/**
	 * (default `none`) Which events should be logged
	 */
	verbose: "none" | "errors" | "all"
	/**
	 * (default `https://osu.ppy.sh`) The base url of the server where the requests should land
	 * @remarks For tokens, requests will be sent to the `oauth/token` route, other requests will be sent to the `api/v2` route
	 */
	server: string

	/**
	 * Use the API's `createAsync` instead of the default constructor if you don't have at least an access_token!
	 * `createAsync` should always be your way of creating API instances!!
	 */
	constructor(client?: {id: number, secret: string}, token_type?: string, expires?: Date,
	access_token?: string, scopes?: Scope[], refresh_token?: string, user?: number,
	verbose: "none" | "errors" | "all" = "all", server: string = "https://osu.ppy.sh") {
		this.client = client ?? {id: 0, secret: ""}
		this.token_type = token_type ?? ""
		this.expires = expires ?? new Date()
		this.access_token = access_token ?? ""
		this.scopes = scopes ?? []
		this.refresh_token = refresh_token
		this.user = user
		this.verbose = verbose
		this.server = server
	}

	/**
	 * Use this instead of `console.log` to log any information
	 * @param is_error Is the logging happening because of an error?
	 * @param to_log Whatever you would put between the parentheses of `console.log()`
	 */
	private log(is_error: boolean, ...to_log: any[]) {
		if (this.verbose === "all" || (this.verbose === "errors" && is_error === true)) {
			console.log("osu!api v2 ->", ...to_log)
		}
	}

	/**
	 * Set most of an `api`'s properties, like tokens, token_type, scopes, expiration_date  
	 * @param body An Object with the client id & secret, grant_type, and stuff that depends of the grant_type
	 * @param api The `api` which will see its properties change
	 * @returns `api`, just in case, because in theory it should modify the original object
	 */
	private async obtainToken(body: object, api: API): Promise<API> {
		const response = await fetch(`${this.server}/oauth/token`, {
			method: "post",
			headers: {
				"Accept": "application/json",
				"Content-Type": "application/json",
				"User-Agent": "osu-api-v2-js (https://github.com/TTTaevas/osu-api-v2-js)"
			},
			body: JSON.stringify(body)
		})

		const json: any = await response.json()
		if (!json.access_token) {
			this.log(true, "Unable to obtain a token! Here's what was received from the API:", json)
			throw new APIError("No token obtained", this.server, "oauth/token", body)
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
	 * @param user If the instance is supposed to represent a user, use their Authorization Code and the Application Callback URL of your application!
	 * @returns A promise with an API instance
	 */
	public static async createAsync(
		client: {
			id: number,
			secret: string
		},
		user?: {
			code: string,
			redirect_uri: string
		},
		verbose: "none" | "errors" | "all" = "none",
		server: string = "https://osu.ppy.sh"
	): Promise<API> {
		const new_api = new API()
		new_api.client = client
		new_api.verbose = verbose
		new_api.server = server
		
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

	/** @returns Whether or not the token has been refreshed */
	public async refreshToken(): Promise<boolean> {
		if (!this.refresh_token) {
			this.log(true, "Attempted to get a new access token despite not having a refresh token!")
			return false
		}

		const old_token = this.access_token
		const body = {
			client_id: this.client.id,
			client_secret: this.client.secret,
			grant_type: "refresh_token",
			refresh_token: this.refresh_token	
		}

		try {
			await this.obtainToken(body, this)
			if (old_token !== this.access_token) this.log(false, "The token has been refreshed!")
			return old_token !== this.access_token
		} catch {
			this.log(true, "Failed to refresh the token :(")
			return false
		}
	}

	public generateWebSocket(): WebSocket {
		return new WebSocket(`${this.server.replace(/https{0,1}:\/\/\w*/g, "wss://notify")}`, [], {
			headers: {
				"User-Agent": "osu-api-v2-js (https://github.com/TTTaevas/osu-api-v2-js)",
				"Authorization": `${this.token_type} ${this.access_token}`
			}
		})
	}

	/**
	 * @param method The type of request, each endpoint uses a specific one (if it uses multiple, the intent and parameters become different)
	 * @param endpoint What comes in the URL after `api/`
	 * @param parameters The things to specify in the request, such as the beatmap_id when looking for a beatmap
	 * @param number_try Attempt number for doing this specific request
	 * @returns A Promise with the API's response
	 */
	private async request(method: "get" | "post" | "put" | "delete", endpoint: string,
	parameters?: {[k: string]: any}, number_try: number = 1): Promise<any> {
		const max_tries = 5
		let err = "none"
		let to_retry = false

		// For GET requests specifically, requests need to be shaped in very particular ways
		if (parameters !== undefined && method === "get") {
			// If a parameter is an empty string or is undefined, remove it
			for (let i = 0; i < Object.entries(parameters).length; i++) {
				if (!String(Object.values(parameters)[i]).length || Object.values(parameters)[i] === undefined) {
					delete parameters[Object.keys(parameters)[i]]
					i--
				}
			}
			
			// If a parameter is an Array, add "[]" to its name, so the server understands the request properly
			for (let i = 0; i < Object.entries(parameters).length; i++) {	
				if (Array.isArray(Object.values(parameters)[i]) && !Object.keys(parameters)[i].includes("[]")) {
					parameters[`${Object.keys(parameters)[i]}[]`] = Object.values(parameters)[i]
					delete parameters[Object.keys(parameters)[i]]
					i--
				}
			}

			// If a parameter is an object, add its properties in "[]" such as "cursor[id]=5&cursor[score]=36.234"
			let parameters_to_add: {[k: string]: any} = {}
			for (let i = 0; i < Object.entries(parameters).length; i++) {
				const value = Object.values(parameters)[i]
				if (typeof value === "object" && !Array.isArray(value) && value !== null) { 
					const main_name = Object.keys(parameters)[i]
					for (let e = 0; e < Object.entries(value).length; e++) {
						parameters_to_add[`${main_name}[${Object.keys(value)[e]}]`] = Object.values(value)[e]
					}
					delete parameters[Object.keys(parameters)[i]]
					i--
				}
			}
			for (let i = 0; i < Object.entries(parameters_to_add).length; i++) {
				parameters[Object.keys(parameters_to_add)[i]] = Object.values(parameters_to_add)[i]
			}

			// If a parameter is a date, make it a string
			for (let i = 0; i < Object.entries(parameters).length; i++) {
				if (Object.values(parameters)[i] instanceof Date) {
					parameters[Object.keys(parameters)[i]] = (Object.values(parameters)[i] as Date).toISOString()
				}
			}
		}

		const response = await fetch(`${this.server}/api/v2/${endpoint}?` + (method === "get" && parameters ? querystring.stringify(parameters) : ""), {
			method,
			headers: {
				"Accept": "application/json",
				"Accept-Encoding": "gzip",
				"Content-Type": "application/json",
				"User-Agent": "osu-api-v2-js (https://github.com/TTTaevas/osu-api-v2-js)",
				"Authorization": `${this.token_type} ${this.access_token}`
			},
			body: method !== "get" ? JSON.stringify(parameters) : null,
			
		})
		.catch((error: FetchError) => {
			this.log(true, error.message)
			err = `${error.name} (${error.errno})`
		})

		if (!response || !response.ok) {
			if (response) {
				err = response.statusText

				if (response.status === 401) {
					if (this.refresh_token && new Date() > this.expires) {
						this.log(true, "Server responded with status code 401, your token might have expired, I will attempt to refresh your token...")
						let refreshed = await this.refreshToken()

						if (refreshed) {
							to_retry = true
						}
					} else {
						this.log(true, "Server responded with status code 401, maybe you need to do this action as a user?")
					}
				} else if (response.status === 403) {
					this.log(true, "Server responded with status code 403, you may lack the necessary scope for this action!")
				} else if (response.status === 422) {
					this.log(true, "Server responded with status code 422, you may be unable to use those parameters together!")
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

			throw new APIError(err, `${this.server}/api/v2`, endpoint, parameters)
		}

		this.log(false, response.statusText, response.status, {endpoint, parameters})
		// 204 means the request worked as intended and did not give us anything, so we can't `.json()` the response
		if (response.status === 204) return undefined

		const arrBuff = await response.arrayBuffer()
		const buff = Buffer.from(arrBuff)
		try { // Assume the response is in JSON format as it often is, it'll fail into the catch block if it isn't anyway
			// My thorough testing leads me to believe nothing would change if the encoding was also "binary" here btw
			return correctType(JSON.parse(buff.toString("utf-8")))
		} catch { // Assume the response is supposed to not be in JSON format so return it as simple text
			return buff.toString("binary")
		}
	}


	// USER STUFF

	/**
	 * Get extensive user data about the authorized user
	 * @scope {@link Scope"identify"}
	 * @param ruleset Defaults to the user's default/favourite Ruleset
	 */
	async getResourceOwner(ruleset?: Rulesets): Promise<User.Extended.WithStatisticsrulesets> {
		return await this.request("get", "me", {mode: ruleset})
	}
	
	/**
	 * Get extensive user data about whoever you want!
	 * @param user An object with either the id or the username of the user you're trying to get
	 * @param ruleset Defaults to the user's default/favourite Ruleset
	 */
	async getUser(user: {id?: number, username?: string} | User, ruleset?: Rulesets): Promise<User.Extended> {
		const key = user.id !== undefined ? "id" : "username"
		const lookup = user.id !== undefined ? user.id : user.username
		const mode = ruleset !== undefined ? `/${Rulesets[ruleset]}` : ""

		return await this.request("get", `users/${lookup}${mode}`, {key})
	}

	/**
	 * Get user data for up to 50 users at once!
	 * @param users An array of users or of objects that have the id of the users you're trying to get
	 */
	async getUsers(users: Array<{id: number} | User>): Promise<User.WithCountryCoverGroupsStatisticsrulesets[]> {
		const ids = users.map((user) => user.id)
		const response = await this.request("get", "users", {ids})
		return response.users
	}

	/**
	 * Get "notable" scores from a user
	 * @param user The user who set the scores
	 * @param type Do you want scores: in the user's top 100, that are top 1 on a beatmap, that have been recently set?
	 * @param limit The maximum amount of scores to be returned
	 * @param ruleset The Ruleset the scores were made in, defaults to the user's default/favourite Ruleset
	 * @param include_fails (defaults to false) Do you want scores where the user didn't survive or quit the map?
	 * @param offset How many elements that would be at the top of the returned array get skipped (while still filling the array up to the limit)
	 */
	async getUserScores(user: {id: number} | User, type: "best" | "firsts" | "recent", limit?: number,
	ruleset?: Rulesets, include_fails: boolean = false, offset?: number): Promise<Score.WithUserBeatmapBeatmapset[]> {
		const mode = ruleset !== undefined ? Rulesets[ruleset] : undefined
		return await this.request("get", `users/${user.id}/scores/${type}`, {mode, limit, offset, include_fails: String(Number(include_fails))})
	}

	/**
	 * Get beatmaps favourited or made by a user!
	 * @param user The user in question
	 * @param type The relation between the user and the beatmaps
	 * @param limit (defaults to 5) The maximum amount of elements returned in the array
	 * @param offset How many elements that would be at the top of the returned array get skipped (while still filling the array up to the limit)
	 */
	async getUserBeatmaps(user: {id: number} | User, type: "favourite" | "graveyard" | "guest" | "loved" | "nominated" | "pending" | "ranked",
	limit: number = 5, offset?: number): Promise<Beatmapset.Extended.WithBeatmapExtended[]> {
		return await this.request("get", `users/${user.id}/beatmapsets/${type}`, {limit, offset})
	}

	/**
	 * Get the beatmaps most played by a user!
	 * @param user The user who played the beatmaps
	 * @param limit (defaults to 5) The maximum amount of elements returned in the array
	 * @param offset How many elements that would be at the top of the returned array get skipped (while still filling the array up to the limit)
	 */
	async getUserMostPlayed(user: {id: number} | User, limit: number = 5, offset?: number): Promise<Beatmap.Playcount[]> {
		return await this.request("get", `users/${user.id}/beatmapsets/most_played`, {limit, offset})
	}

	/**
	 * Get an array of Events of different `type`s that relate to a user's activity during the last 31 days! (or 100 activities, whatever comes first)
	 * @param user The user in question
	 * @param limit (defaults to 5) The maximum amount of elements returned in the array
	 * @param offset How many elements that would be at the top of the returned array get skipped (while still filling the array up to the limit)
	 */
	async getUserRecentActivity(user: {id: number} | User, limit: number = 5, offset?: number): Promise<Array<Event.AnyRecentActivity>> {
		return await this.request("get", `users/${user.id}/recent_activity`, {limit, offset})
	}

	/**
	 * Get data about the activity of a user kudosu-wise!
	 * @param user The user in question
	 * @param limit (defaults to 5) The maximum amount of activities in the returned array
	 * @param offset How many elements that would be at the top of the returned array get skipped (while still filling the array up to the limit)
	 */
	async getUserKudosu(user: {id: number} | User, limit?: number, offset?: number): Promise<User.KudosuHistory[]> {
		return await this.request("get", `users/${user.id}/kudosu`, {limit, offset})
	}

	/**
	 * Get user data of each friend of the authorized user
	 * @scope {@link Scope"friends.read"}
	 */
	async getFriends(): Promise<User.WithCountryCoverGroupsStatisticsSupport[]> {
		return await this.request("get", "friends")
	}

	
	// BEATMAP STUFF

	/** Get extensive beatmap data about whichever beatmap you want! */
	async lookupBeatmap(query: {checksum?: string, filename?: string, id?: number | string}): Promise<Beatmap.Extended.WithFailtimesBeatmapsetextended> {
		if (query.id !== undefined) query.id = String(query.id)
		return await this.request("get", `beatmaps/lookup`, {...query})
	}

	/**
	 * Get extensive beatmap data about whichever beatmap you want!
	 * @param beatmap An object with the id of the beatmap you're trying to get
	 */
	async getBeatmap(beatmap: {id: number} | Beatmap): Promise<Beatmap.Extended.WithFailtimesBeatmapsetextended> {
		return await this.request("get", `beatmaps/${beatmap.id}`)
	}

	/**
	 * Get extensive beatmap data for up to 50 beatmaps at once!
	 * @param beatmaps An array of beatmaps or of objects that have the id of the beatmaps you're trying to get
	 */
	async getBeatmaps(beatmaps: Array<{id: number} | Beatmap>): Promise<Beatmap.Extended.WithFailtimesMaxcombo[]> {
		const ids = beatmaps.map((beatmap) => beatmap.id)
		const response = await this.request("get", "beatmaps", {ids})
		return response.beatmaps
	}

	/**
	 * Get various data about the difficulty of a beatmap!
	 * @remarks You may want to use getBeatmapDifficultyAttributesOsu (or Taiko or whatever) instead for better type safety
	 * @param beatmap The Beatmap in question
	 * @param mods (defaults to No Mod) (will ignore mod settings) Can be a bitset of mods, an array of mod acronyms ("DT" for DoubleTime), or an array of Mods
	 * @param ruleset (defaults to the ruleset the beatmap was intended for) Useful to specify if the beatmap is a convert
	 */
	async getBeatmapDifficultyAttributes(beatmap: {id: number} | Beatmap, mods?: Mod[] | string[] | number, ruleset?: Rulesets):
	Promise<Beatmap.DifficultyAttributes | Beatmap.DifficultyAttributes.Any> {
		const response = await this.request("post", `beatmaps/${beatmap.id}/attributes`, {ruleset_id: ruleset, mods})
		return response.attributes
	}
	/**
	 * Get various data about the difficulty of an osu! beatmap!
	 * @param beatmap The Beatmap in question
	 * @param mods (defaults to No Mod) (will ignore mod settings) Can be a bitset of mods, an array of mod acronyms ("DT" for DoubleTime), or an array of Mods
	 */
	async getBeatmapDifficultyAttributesOsu(beatmap: {id: number} | Beatmap, mods?: Mod[] | string[] | number): Promise<Beatmap.DifficultyAttributes.Osu> {
		return await this.getBeatmapDifficultyAttributes(beatmap, mods, Rulesets.osu) as Beatmap.DifficultyAttributes.Osu
	}
	/**
	 * Get various data about the difficulty of a taiko beatmap!
	 * @param beatmap The Beatmap in question
	 * @param mods (defaults to No Mod) (will ignore mod settings) Can be a bitset of mods, an array of mod acronyms ("DT" for DoubleTime), or an array of Mods
	 */
	async getBeatmapDifficultyAttributesTaiko(beatmap: {id: number} | Beatmap, mods?: Mod[] | string[] | number): Promise<Beatmap.DifficultyAttributes.Taiko> {
		return await this.getBeatmapDifficultyAttributes(beatmap, mods, Rulesets.taiko) as Beatmap.DifficultyAttributes.Taiko
	}
	/**
	 * Get various data about the difficulty of a ctb beatmap!
	 * @param beatmap The Beatmap in question
	 * @param mods (defaults to No Mod) (will ignore mod settings) Can be a bitset of mods, an array of mod acronyms ("DT" for DoubleTime), or an array of Mods
	 */
	async getBeatmapDifficultyAttributesFruits(beatmap: {id: number} | Beatmap, mods?: Mod[] | string[] | number): Promise<Beatmap.DifficultyAttributes.Fruits> {
		return await this.getBeatmapDifficultyAttributes(beatmap, mods, Rulesets.fruits) as Beatmap.DifficultyAttributes.Fruits
	}
	/**
	 * Get various data about the difficulty of a mania beatmap!
	 * @param beatmap The Beatmap in question
	 * @param mods (defaults to No Mod) (will ignore mod settings) Can be a bitset of mods, an array of mod acronyms ("DT" for DoubleTime), or an array of Mods
	 */
	async getBeatmapDifficultyAttributesMania(beatmap: {id: number} | Beatmap, mods?: Mod[] | string[] | number): Promise<Beatmap.DifficultyAttributes.Mania> {
		return await this.getBeatmapDifficultyAttributes(beatmap, mods, Rulesets.mania) as Beatmap.DifficultyAttributes.Mania
	}

	/**
	 * Get the top scores of a beatmap!
	 * @param beatmap The Beatmap in question
	 * @param include_lazer_scores Whether or not lazer scores should be included, defaults to true
	 * @param ruleset The Ruleset used to make the scores, useful if they were made on a convert
	 * @param mods (2023-11-16) Currently doesn't do anything
	 * @param type (2023-11-16) Currently doesn't do anything
	 */
	async getBeatmapScores(beatmap: {id: number} | Beatmap, include_lazer_scores: boolean = true,
		ruleset?: Rulesets, mods?: string[], type?: string): Promise<Score.WithUser[]> {
		const mode = ruleset !== undefined ? Rulesets[ruleset] : undefined
		const response = await this.request("get", `beatmaps/${beatmap.id}/scores`, {mode, mods, legacy_only: Number(!include_lazer_scores), type})
		return response.scores
	}

	/**
	 * Get the top scores of a beatmap, in the "solo score" format lazer brought with it!
	 * More info on GitHub if needed https://github.com/ppy/osu-infrastructure/blob/master/score-submission.md
	 * @param beatmap The Beatmap in question
	 * @param ruleset The Ruleset used to make the scores, useful if they were made on a convert
	 * @param mods (2023-11-16) Currently doesn't do anything
	 * @param type (2023-11-16) Currently doesn't do anything
	 */
	async getBeatmapSoloScores(beatmap: {id: number} | Beatmap, ruleset?: Rulesets, mods?: string[], type?: string): Promise<Score.Solo[]> {
		const mode = ruleset !== undefined ? Rulesets[ruleset] : undefined
		const response = await this.request("get", `beatmaps/${beatmap.id}/solo-scores`, {mode, mods, type})
		return response.scores
	}

	/**
	 * Get the score on a beatmap made by a specific user (with specific mods and on a specific ruleset if needed)
	 * @param beatmap The Beatmap the score was made on
	 * @param user The User who made the score
	 * @param mods The Mods used to make the score, defaults to any, you can use `["NM"]` to filter out scores with mods
	 * @param ruleset The Ruleset used to make the score, useful if it was made on a convert
	 * @returns An Object with the position of the score according to the specified Mods and Ruleset, and with the score itself
	 */
	async getBeatmapUserScore(beatmap: {id: number} | Beatmap, user: {id: number} | User,
		mods?: string[], ruleset?: Rulesets): Promise<BeatmapUserScore> {
		const mode = ruleset !== undefined ? Rulesets[ruleset] : undefined
		return await this.request("get", `beatmaps/${beatmap.id}/scores/users/${user.id}`, {mods, mode})
	}

	/**
	 * Get the score on a beatmap made by a specific user (with the possibility to specify if the scores are on a convert)
	 * @param beatmap The Beatmap the scores were made on
	 * @param user The User who made the scores
	 * @param ruleset The Ruleset used to make the scores, defaults to the Ruleset the Beatmap was made for
	 */
	async getBeatmapUserScores(beatmap: {id: number} | Beatmap, user: {id: number} | User, ruleset?: Rulesets): Promise<Score.Legacy[]> {
		const mode = ruleset !== undefined ? Rulesets[ruleset] : undefined
		const response = await this.request("get", `beatmaps/${beatmap.id}/scores/users/${user.id}/all`, {mode})
		return response.scores
	}

	/**
	 * Search for beatmapsets as if you were on the website or on lazer!
	 * @param query All the filters and sorting options that you'd normally find on the website or on lazer 
	 * @returns Relevant Beatmapsets that contain Beatmaps, and a cursor_string to allow you to look for more of the same!
	 * @remarks This does not bypass the current osu!supporter requirement for certain filters
	 */
	async searchBeatmapsets(query?: {
	/** What you'd put in the searchbar, like the name of a beatmapset or a mapper! */
	keywords?: string
	/** Sort by what, in ascending/descending order */
	sort?: {by: "title" | "artist" | "difficulty" | "ranked" | "rating" | "plays" | "favourites" | "updated", in: "asc" | "desc"},
	/** Various filters to activate */
	general?: ("Recommended difficulty" | "Include converted beatmaps" | "Subscribed mappers" | "Spotlighted beatmaps" | "Featured Artists")[],
	/** Only get sets that have maps that you can play in the ruleset of your choice */
	mode?: Rulesets,
	/** (defaults to all that have leaderboard) Filter in sets depending on their status or on their relation with the authorized user */
	categories?: "Any" | "Ranked" | "Qualified" | "Loved" | "Favourites" | "Pending" | "WIP" | "Graveyard" | "My Maps",
	/** Use this to hide all sets that are marked as explicit */
	hide_explicit_content?: true,
	/** Specify the musical genre of the music of the beatmapsets you're searching for */
	genre?: Exclude<Genres, 0>,
	/** Specify the spoken language of the music of the beatmapsets you're searching for */
	language?: Exclude<Languages, 0>,
	/** Should all sets have a video, a storyboard, maybe both at once? */
	extra?: ("must_have_video" | "must_have_storyboard")[],
	/** Does the authorized user with osu!supporter have already achieved certain ranks on those sets? */
	rank_achieved?: ("Silver SS" | "SS" | "Silver S" | "S" | "A" | "B" | "C" | "D")[],
	/** Does the authorized user with osu!supporter have already played those sets, or have they not played them yet? */
	played?: "Played" | "Unplayed",
	/** The thing you've got from a previous request to get another page of results! */
	cursor_string?: string}):
	Promise<{beatmapsets: Beatmapset.Extended.WithBeatmapExtendedPacktags[], recommended_difficulty: number | null, total: number, error: any | null,
	cursor_string: string | null}> {
		const sort = query?.sort ? (query.sort.by + "_" + query.sort.in) : undefined
		const c = query?.general ? query.general.map((general_value) => {
			if (general_value === "Recommended difficulty") return "recommended"
			if (general_value === "Include converted beatmaps") return "converts"
			if (general_value === "Subscribed mappers") return "follows"
			if (general_value === "Spotlighted beatmaps") return "spotlights"
			if (general_value === "Featured Artists") return "featured_artists"
		}).join(".") : undefined
		const s = query?.categories ? query.categories === "My Maps" ? "mine" : query.categories.toLowerCase() : undefined
		const nsfw = query?.hide_explicit_content ? false : undefined
		const e = query?.extra ? query.extra.map((extra_value) => {
			if (extra_value === "must_have_video") return "video"
			if (extra_value === "must_have_storyboard") return "storyboard"
		}).join(".") : undefined
		const r = query?.rank_achieved ? query.rank_achieved.map((rank_achieved_value) => {
			if (rank_achieved_value === "Silver SS") return "XH"
			if (rank_achieved_value === "SS") return "X"
			if (rank_achieved_value === "Silver S") return "SH"
			return rank_achieved_value
		}).join("x") : undefined
		const played = query?.played ? query.played.toLowerCase() : undefined

		return await this.request("get", `beatmapsets/search`,
		{q: query?.keywords, sort, c, m: query?.mode, s, nsfw, g: query?.genre, l: query?.language, e, r, played, cursor_string: query?.cursor_string})
	}

	/**
	 * Get extensive data about a beatmapset by using a beatmap!
	 * @param beatmap A beatmap from the beatmapset you're looking for
	 */
	async lookupBeatmapset(beatmap: {id: number} | Beatmap): Promise<Beatmapset.Extended.Plus> {
		return await this.request("get", `beatmapsets/lookup`, {beatmap_id: beatmap.id})
	}

	/**
	 * Get extensive beatmapset data about whichever beatmapset you want!
	 * @param beatmapset An object with the id of the beatmapset you're trying to get
	 */
	async getBeatmapset(beatmapset: {id: number} | Beatmapset): Promise<Beatmapset.Extended.Plus> {
		return await this.request("get", `beatmapsets/${beatmapset.id}`)
	}

	/**
	 * Get data about a BeatmapPack using its tag!
	 * @param pack An object with the tag of the beatmappack you're trying to get
	 * @remarks Currently in https://osu.ppy.sh/beatmaps/packs, when hovering a pack, its link with its tag should show up on your browser's bottom left
	 */
	async getBeatmapPack(pack: {tag: string} | Beatmap.Pack): Promise<Beatmap.Pack> {
		return await this.request("get", `beatmaps/packs/${pack.tag}`)
	}

	/**
	 * Get an Array of up to 100 BeatmapPacks of a specific type!
	 * @param type The type of the BeatmapPacks, defaults to "standard"
	 */
	async getBeatmapPacks(type: "standard" | "featured" | "tournament" | "loved" | "chart" | "theme" | "artist" = "standard"): Promise<Beatmap.Pack[]> {
		const response = await this.request("get", "beatmaps/packs", {type})
		return response.beatmap_packs
	}

	/**
	 * Get complex data about the discussion page of any beatmapet that you want!
	 * @param from From where/who are the discussions coming from? Maybe only qualified sets?
	 * @param filter Should those discussions only be unresolved problems, for example?
	 * @param cursor_stuff How many results maximum to get, which page of those results, a cursor_string if you have that...
	 * @param sort (defaults to "id_desc") "id_asc" to have the oldest recent discussion first, "id_desc" to have the newest instead
	 * @returns Relevant discussions and info about them
	 * @remarks (2024-03-11) For months now, the API's documentation says the response is likely to change, so beware
	 * @privateRemarks I don't allow setting `beatmap_id` because my testing has led me to believe it does nothing (and is therefore misleading)
	 */
	async getBeatmapsetDiscussions(from?: {beatmapset?: Beatmapset | {id: number}, user?: User | {id: number},
	status?: "all" | "ranked" | "qualified" | "disqualified" | "never_qualified"}, filter?: {types?: Beatmapset.Discussion["message_type"][],
	only_unresolved?: boolean}, cursor_stuff?: {page?: number, limit?: number, cursor_string?: string}, sort: "id_desc" | "id_asc" = "id_desc"):
	Promise<{beatmaps: Beatmap.Extended[], beatmapsets: Beatmapset.Extended[], discussions: Beatmapset.Discussion.WithStartingpost[]
	included_discussions: Beatmapset.Discussion.WithStartingpost[], reviews_config: {max_blocks: number}, users: User.WithGroups[], cursor_string: string}> {
		return await this.request("get", "beatmapsets/discussions", {beatmapset_id: from?.beatmapset?.id, beatmapset_status: from?.status,
		limit: cursor_stuff?.limit, message_types: filter?.types, only_unresolved: filter?.only_unresolved, page: cursor_stuff?.page, sort,
		user: from?.user?.id, cursor_string: cursor_stuff?.cursor_string})
	}

	/**
	 * Get complex data about the posts of a beatmapset's discussion or of a user!
	 * @param from From where/who are the posts coming from? A specific discussion, a specific user?
	 * @param types What kind of posts?
	 * @param cursor_stuff How many results maximum to get, which page of those results, a cursor_string if you have that...
	 * @param sort (defaults to "id_desc") "id_asc" to have the oldest recent post first, "id_desc" to have the newest instead
	 * @returns Relevant posts and info about them
	 * @remarks (2024-03-11) For months now, the API's documentation says the response is likely to change, so beware
	 */
	async getBeatmapsetDiscussionPosts(from?: {discussion?: Beatmapset.Discussion | {id: number}, user?: User | {id: number}},
	types?: ("first" | "reply" | "system")[], cursor_stuff?: {page?: number, limit?: number, cursor_string?: string}, sort: "id_desc" | "id_asc" = "id_desc"):
	Promise<{beatmapsets: Beatmapset.WithHype[], posts: Beatmapset.Discussion.Post[], users: User[], cursor_string: string}> {
		return await this.request("get", "beatmapsets/discussions/posts", {beatmapset_discussion_id: from?.discussion?.id, limit: cursor_stuff?.limit,
		page: cursor_stuff?.page, sort, types, user: from?.user?.id, cursor_string: cursor_stuff?.cursor_string})
	}

	/**
	 * Get complex data about the votes of a beatmapset's discussions or/and received/given by a specific user!
	 * @param from The discussion with the votes, the user who voted, the user who's gotten the votes...
	 * @param score An upvote (1) or a downvote (-1)
	 * @param cursor_stuff How many results maximum to get, which page of those results, a cursor_string if you have that...
	 * @param sort (defaults to "id_desc") "id_asc" to have the oldest recent vote first, "id_desc" to have the newest instead
	 * @returns Relevant votes and info about them
	 * @remarks (2024-03-11) For months now, the API's documentation says the response is likely to change, so beware
	 */
	async getBeatmapsetDiscussionVotes(from?: {discussion?: Beatmapset.Discussion | {id: number}, vote_giver?: User | {id: number},
	vote_receiver?: User | {id: number}}, score?: 1 | -1, cursor_stuff?: {page?: number, limit?: number, cursor_string?: string},
	sort: "id_desc" | "id_asc" = "id_desc"): Promise<{votes: Beatmapset.Discussion.Vote[], discussions: Beatmapset.Discussion[], users: User.WithGroups[],
	cursor_string: string}> {
		return await this.request("get", "beatmapsets/discussions/votes", {beatmapset_discussion_id: from?.discussion?.id, limit: cursor_stuff?.limit,
		page: cursor_stuff?.page, receiver: from?.vote_receiver?.id, score, sort, user: from?.vote_giver?.id, cursor_string: cursor_stuff?.cursor_string})
	}

	/**
	 * Get complex data about the events of a beatmapset and the users involved with them!
	 * @param from Which beatmapset, or caused by which user? When?
	 * @param types What kinds of events?
	 * @param cursor_stuff How many results maximum to get, which page of those results, a cursor_string if you have that...
	 * @param sort (defaults to "id_desc") "id_asc" to have the oldest recent event first, "id_desc" to have the newest instead
	 * @returns Relevant events and users
	 * @remarks (2024-03-11) For months now, the API's documentation says the response is likely to change, so beware,
	 * and also there's no documentation for this route in the API, so this is only the result of my interpretation of the website's code lol
	 */
	async getBeatmapsetEvents(from?: {beatmapset?: Beatmapset | {id: number}, user?: User | {id: number}, min_date?: Date, max_date?: Date},
	types?: Beatmapset.Event["type"][], cursor_stuff?: {page?: number, limit?: number, cursor_string?: string}, sort: "id_desc" | "id_asc" = "id_desc"):
	Promise<{events: Beatmapset.Event[], users: User.WithGroups[]}> {
		return await this.request("get", "beatmapsets/events", {beatmapset_id: from?.beatmapset?.id, user: from?.user?.id, min_date: from?.min_date?.toISOString(),
		max_date: from?.max_date?.toISOString(), types, sort, page: cursor_stuff?.page, limit: cursor_stuff?.page, cursor_string: cursor_stuff?.cursor_string})
	}


	// CHANGELOG STUFF

	/**
	 * Get details about the version/update/build of something related to osu!
	 * @param changelog A build version like `2023.1026.0`, a stream name like `lazer` or the id of a build
	 * @param is_id Whether or not `changelog` is the id of a build, defaults to false
	 * @param message_formats Elements of `changelog_entries` will have a `message` property if `markdown`, `message_html` property if `html`, defaults to both
	 */
	async lookupChangelogBuild(changelog: string, is_id: boolean = false, message_formats: ("html" | "markdown")[] = ["html", "markdown"]):
	Promise<Changelog.Build.WithChangelogentriesVersions> {
		return await this.request("get", `changelog/${changelog}`, {key: is_id ? "id" : undefined, message_formats})
	}

	/**
	 * Get details about the version/update/build of something related to osu!
	 * @param stream The name of the thing related to osu!, like `lazer`, `web`, `cuttingedge`, `beta40`, `stable40`
	 * @param build The name of the version! Usually something like `2023.1026.0` for lazer, or `20230326` for stable
	 */
	async getChangelogBuild(stream: string, build: string): Promise<Changelog.Build.WithChangelogentriesVersions> {
		return await this.request("get", `changelog/${stream}/${build}`)
	}

	/**
	 * Get up to 21 versions/updates/builds!
	 * @param versions Get builds that were released before/after (and including) those versions (use the name of the versions, e.g. `2023.1109.0`)
	 * @param max_id Filter out builds that have an id higher than this (this takes priority over `versions.to`)
	 * @param stream Only get builds from a specific stream
	 * @param message_formats Elements of `changelog_entries` will have a `message` property if `markdown`, `message_html` property if `html`, defaults to both
	 */
	async getChangelogBuilds(versions?: {from?: string, to?: string}, max_id?: number,
	stream?: string, message_formats: ("html" | "markdown")[] = ["html", "markdown"]): Promise<Changelog.Build.WithUpdatestreamsChangelogentries[]> {
		const [from, to] = [versions?.from, versions?.to]
		const response = await this.request("get", "changelog", {from, to, max_id, stream, message_formats})
		return response.builds
	}

	/**
	 * An effective way to get all available streams, as well as their latest version!
	 * @example
	 * ```ts
	 * const names_of_streams = (await api.getChangelogStreams()).map(s => s.name)
	 * ```
	 */
	async getChangelogStreams(): Promise<Changelog.UpdateStream.WithLatestbuildUsercount[]> {
		const response = await this.request("get", "changelog", {max_id: 0})
		return response.streams
	}


	// MULTIPLAYER STUFF

	/**
	 * Get data about a lazer multiplayer room (realtime or playlists)!
	 * @param room An object with the id of the room, is at the end of its URL (after `/multiplayer/rooms/`)
	 */
	async getRoom(room: {id: number} | Multiplayer.Room): Promise<Multiplayer.Room> {
		return await this.request("get", `rooms/${room.id}`)
	}

	/**
	 * Get playlists/realtime rooms that are active, that have ended, that the user participated in, that the user made, or just simply any room!
	 * @scope {@link Scope"public"}
	 * @param type Whether the multiplayer rooms are in playlist format (like current spotlights) or realtime
	 * @param mode The state of the room, or the relation of the authorized user with the room
	 * @param limit The maximum amount of rooms to return, defaults to 10
	 * @param sort Sort (where most recent is first) by creation date or end date, defaults to the creation date
	 */
	async getRooms(type: "playlists" | "realtime", mode: "active" | "all" | "ended" | "participated" | "owned",
	limit: number = 10, sort: "ended" | "created" = "created"): Promise<Multiplayer.Room[]> {
		return await this.request("get", "rooms", {type_group: type, mode, limit, sort})
	}

	/**
	 * Get the room stats of all the users of that room!
	 * @scope {@link Scope"public"}
	 * @param room An object with the id of the room in question
	 */
	async getRoomLeaderboard(room: {id: number} | Multiplayer.Room): Promise<Multiplayer.Leader[]> {
		const response = await this.request("get", `rooms/${room.id}/leaderboard`)
		return response.leaderboard
	}

	/**
	 * Get the scores on a specific item of a room!
	 * @param item An object with the id of the item in question, as well as the id of the room
	 * @param limit How many scores maximum? Defaults to 50, the maximum the API will return
	 * @param sort Sort by scores, ascending or descending? Defaults to descending
	 * @param cursor_string Use a Multiplayer.Scores' `params` and `cursor_string` to get the next page (scores 51 to 100 for example)
	 * @remarks (2024-03-04) This may not work for rooms from before March 5th, use at your own risk
	 * https://github.com/ppy/osu-web/issues/10725
	 */
	async getPlaylistItemScores(item: {id: number, room_id: number} | Multiplayer.PlaylistItem, limit: number = 50,
	sort: "score_asc" | "score_desc" = "score_desc", cursor_string?: string): Promise<Multiplayer.Scores> {
		return await this.request("get", `rooms/${item.room_id}/playlist/${item.id}/scores`, {limit, sort, cursor_string})
	}

	/**
	 * Get data of a multiplayer lobby from the stable (non-lazer) client that have URLs with `community/matches` or `mp`
	 * @param id Can be found at the end of the URL of said match
	 */
	async getMatch(id: number): Promise<Multiplayer.Match> {
		const response = await this.request("get", `matches/${id}`) as Multiplayer.Match
		// I know `events[i].game.scores[e].perfect` can at least be 0 instead of being false; fix that
		for (let i = 0; i < response.events.length; i++) {
			for (let e = 0; e < Number(response.events[i].game?.scores.length); e++) {
				response.events[i].game!.scores[e].perfect = Boolean(response.events[i].game!.scores[e].perfect)
			}
		}
		return response
	}

	/**
	 * Gets the info of the 50 most recently created stable (non-lazer) matches, descending order (most recent is at index 0)
	 */
	async getMatches(): Promise<Multiplayer.MatchInfo[]> {
		const response = await this.request("get", "matches")
		return response.matches
	}


	// RANKING STUFF

	/**
	 * Get the top 50 players who have the most total kudosu!
	 */
	async getKudosuRanking(): Promise<User.WithKudosu[]> {
		const response = await this.request("get", "rankings/kudosu")
		return response.ranking
	}

	/**
	 * Get the top players of the game, with some filters!
	 * @param ruleset Self-explanatory, is also known as "Gamemode"
	 * @param type Rank players by their performance points or by their ranked score?
	 * @param page (defaults to 1) Imagine `Rankings` as a page, it can only have a maximum of 50 players, while 50 others may be on the next one
	 * @param filter What kind of players do you want to see? Defaults to `all`, `friends` has no effect if no authorized user
	 * @param country Only get players from a specific country, using its ISO 3166-1 alpha-2 country code! (France would be `FR`, United States `US`)
	 * @param variant If `type` is `performance` and `ruleset` is mania, choose between 4k and 7k!
	 */
	async getUserRanking(ruleset: Rulesets, type: "performance" | "score", page: number = 1, filter: "all" | "friends" = "all",
	country?: string, variant?: "4k" | "7k"): Promise<Rankings.User> {
		return await this.request("get", `rankings/${Rulesets[ruleset]}/${type}`, {page, filter, country, variant})
	}

	/**
	 * Get the top countries of a specific ruleset!
	 * @param ruleset On which Ruleset should the countries be compared?
	 * @param page (defaults to 1) Imagine `Rankings` as a page, it can only have a maximum of 50 countries, while 50 others may be on the next one
	 */
	async getCountryRanking(ruleset: Rulesets, page: number = 1): Promise<Rankings.Country> {
		return await this.request("get", `rankings/${Rulesets[ruleset]}/country`, {page})
	}

	/**
	 * Get the rankings of a spotlight from 2009 to 2020 on a specific ruleset!
	 * @param ruleset Each spotlight has a different ranking (and often maps) depending on the ruleset
	 * @param spotlight The spotlight in question
	 * @param filter What kind of players do you want to see? Defaults to `all`, `friends` has no effect if no authorized user
	 */
	async getSpotlightRanking(ruleset: Rulesets, spotlight: {id: number} | Spotlight, filter: "all" | "friends" = "all"): Promise<Rankings.Spotlight> {
		return await this.request("get", `rankings/${Rulesets[ruleset]}/charts`, {spotlight: spotlight.id, filter})
	}

	/**
	 * Get ALL legacy spotlights! (2009-2020, somewhat known as charts/ranking charts, available @ https://osu.ppy.sh/rankings/osu/charts)
	 * @remarks The data for newer spotlights (2020-, somewhat known as seasons) can be obtained through `getRoom()`
	 * but you can't really get their id without going through the website's URLs (https://osu.ppy.sh/seasons/latest) as far as I know :(
	 */
	async getSpotlights(): Promise<Spotlight[]> {
		const response = await this.request("get", "spotlights")
		return response.spotlights
	}


	// HOME STUFF & WIKI STUFF

	/**
	 * Look for a user like you would on the website!
	 * @param query What you would put in the searchbar
	 * @param page (defaults to 1) You normally get the first 20 results, but if page is 2, you'd get results 21 to 40 instead for example!
	 */
	async searchUser(query: string, page: number = 1): Promise<SearchResult.User> {
		const response = await this.request("get", "search", {mode: "user", query, page})
		return response.user
	}

	/**
	 * Look for a wiki page like you would on the website!
	 * @param query What you would put in the searchbar
	 * @param page (defaults to 1) You normally get the first 50 results, but if page is 2, you'd get results 51 to 100 instead for example!
	 */
	async searchWiki(query: string, page: number = 1): Promise<SearchResult.Wiki> {
		const response = await this.request("get", "search", {mode: "wiki_page", query, page})
		return response.wiki_page
	}

	/**
	 * Get a wiki page!
	 * @param path What's in the page's URL after `https://osu.ppy.sh/wiki/` (so the title, after the subtitle if there is a subtitle)
	 * (An example for `https://osu.ppy.sh/wiki/en/Game_mode/osu!` would be `Game_mode/osu!`)
	 * @param locale (defaults to "en") The BCP 47 language (sub)tag, lowercase (for example, for the article in french, use "fr")
	 */
	async getWikiPage(path: string, locale: string = "en"): Promise<WikiPage> {
		return await this.request("get", `wiki/${locale}/${path}`)
	}


	// NEWS STUFF

	/**
	 * Get all the NewsPosts of a specific year!
	 * @remarks If the specified year is invalid/has no news, it fallbacks to the default year
	 * @param year (defaults to current year) The year the posts were made
	 */
	async getNewsPosts(year?: number): Promise<News.Post[]> {
		const response = await this.request("get", "news", {year, limit: 1})
		return response.news_sidebar.news_posts
	}

	/**
	 * Get a NewsPost, its content, and the NewsPosts right before and right after it!
	 * @param post An object with the id or the slug of a NewsPost (the slug being the filename minus the extension, used in its URL)
	 */
	async getNewsPost(post: {id?: number, slug?: string} | News.Post): Promise<News.PostWithContentNavigation> {
		const key = post.id !== undefined ? "id" : undefined
		const lookup = post.id !== undefined ? post.id : post.slug
		return await this.request("get", `news/${lookup}`, {key})
	}


	// FORUM STUFF

	/**
	 * Make and send a ForumPost in a ForumTopic!
	 * @scope {@link Scope"forum.write"}
	 * @param topic An object with the id of the topic you're making your reply in
	 * @param text Your reply! Your message!
	 * @returns The reply you've made!
	 */
	async replyForumTopic(topic: {id: number} | Forum.Topic, text: string): Promise<Forum.Post> {
		return await this.request("post", `forums/topics/${topic.id}/reply`, {body: text})
	}

	/**
	 * Create a new ForumTopic in the forum of your choice!
	 * @scope {@link Scope"forum.write"}
	 * @remarks Some users may not be allowed to do that, such as newly registered users, so this can 403 even with the right scopes
	 * @param forum_id The id of the forum you're creating your topic in
	 * @param title The topic's title
	 * @param text The first post's content/message
	 * @param poll If you want to make a poll, specify the parameters of that poll!
	 * @returns An object with the topic you've made, and its first initial post (which uses your `text`)
	 */
	async createForumTopic(forum_id: number, title: string, text: string, poll?: PollConfig): Promise<{topic: Forum.Topic, post: Forum.Post}> {
		const with_poll = poll !== undefined
		const options = poll?.options !== undefined ? poll.options.toString().replace(/,/g, "\n") : undefined

		return await this.request("post", "forums/topics", {forum_id, title, body: text, with_poll, forum_topic_poll: poll ? {
			title: poll.title,
			options: options,
			length_days: poll.length_days,
			max_options: poll.max_options || 1,
			vote_change: poll.vote_change || false,
			hide_results: poll.hide_results || false,
		} : undefined})
	}

	/**
	 * Get a forum topic, as well as its main post (content) and the posts that were sent in it!
	 * @remarks The oldest post of a topic is the text of a topic
	 * @param topic An object with the id of the topic in question
	 * @param limit (defaults to 20, max 50) How many `posts` maximum?
	 * @param sort (defaults to "id_asc") "id_asc" to have the oldest post at the beginning of the `posts` array, "id_desc" to have the newest instead
	 * @param first_post (ignored if `cursor_string`) An Object with the id of the first post to be returned in `posts`
	 * @param cursor_string Use a response's `cursor_string` with the same parameters to get the next "page" of results, so `posts` in this instance!
	 */
	async getForumTopicAndPosts(topic: {id: number} | Forum.Topic, limit: number = 20, sort: "id_asc" | "id_desc" = "id_asc",
	first_post?: {id: number} | Forum.Post, cursor_string?: string): Promise<{posts: Forum.Post[], topic: Forum.Topic, cursor_string: string}> {
		const start = sort === "id_asc" && first_post ? first_post.id : undefined
		const end = sort === "id_desc" && first_post ? first_post.id : undefined
		return await this.request("get", `forums/topics/${topic.id}`, {sort, limit, start, end, cursor_string})
	}

	/**
	 * Edit the title of a ForumTopic!
	 * @scope {@link Scope"forum.write"}
	 * @remarks Use `editForumPost` if you wanna edit the post at the top of the topic
	 * @param topic An object with the id of the topic in question
	 * @param new_title The new title of the topic
	 * @returns The edited ForumTopic
	 */
	async editForumTopicTitle(topic: {id: number} | Forum.Topic, new_title: string): Promise<Forum.Topic> {
		return await this.request("put", `forums/topics/${topic.id}`, {forum_topic: {topic_title:  new_title}})
	}

	/**
	 * Edit a ForumPost! Note that it can be the initial one of a ForumTopic!
	 * @scope {@link Scope"forum.write"}
	 * @param post An object with the id of the post in question
	 * @param new_text The new content of the post (replaces the old content)
	 * @returns The edited ForumPost
	 */
	async editForumPost(post: {id: number} | Forum.Post, new_text: string): Promise<Forum.Post> {
		return await this.request("put", `forums/posts/${post.id}`, {body: new_text})
	}


	// CHAT STUFF

	/**
	 * Needs to be done periodically to reset chat activity timeout
	 * @scope {@link Scope"chat.read"}
	 * @remarks Every 30 seconds is a good idea
	 * @param since UserSilences that are before that will not be returned!
	 * @returns A list of recent silences
	 */
	async keepChatAlive(since?: {user_silence?: {id: number} | Chat.UserSilence, message?: {message_id: number} | Chat.Message}): Promise<Chat.UserSilence[]> {
		return await this.request("post", "chat/ack", {history_since: since?.user_silence?.id, since: since?.message?.message_id})
	}

	/**
	 * Send a private message to someone!
	 * @scope {@link Scope"chat.write"}
	 * @remarks You don't need to use `createChatPrivateChannel` before sending a message
	 * @param user_target The User you wanna send your message to!
	 * @param message The message you wanna send
	 * @param is_action (defaults to false) Is it a command? Like `/me dances`
	 * @param uuid A client-side message identifier
	 * @returns The message you sent
	 */
	async sendChatPrivateMessage(user_target: {id: number} | User, message: string, is_action: boolean = false, uuid?: string):
	Promise<{channel: Chat.Channel, message: Chat.Message}> {
		return await this.request("post", "chat/new", {target_id: user_target.id, message, is_action, uuid})
	}

	/**
	 * Get the recent messages of a specific ChatChannel!
	 * @scope {@link Scope"chat.read"}
	 * @param channel The Channel you wanna get the messages from
	 * @param limit (defaults to 20, max 50) The maximum amount of messages you want to get!
	 * @param since Get the messages sent after this message
	 * @param until Get the messages sent up to but not including this message
	 */
	async getChatMessages(channel: {channel_id: number} | Chat.Channel, limit: number = 20,
	since?: {message_id: number} | Chat.Message, until?: {message_id: number} | Chat.Message): Promise<Chat.Message[]> {
		return await this.request("get", `chat/channels/${channel.channel_id}/messages`, {limit, since: since?.message_id, until: until?.message_id})
	}

	/**
	 * Send a message in a ChatChannel!
	 * @scope {@link Scope"chat.write"}
	 * @param channel The channel in which you want to send your message
	 * @param message The message you wanna send
	 * @param is_action (defaults to false) Is it a command? Like `/me dances`
	 * @returns The newly sent ChatMessage!
	 */
	async sendChatMessage(channel: {channel_id: number} | Chat.Channel, message: string, is_action: boolean = false): Promise<Chat.Message> {
		return await this.request("post", `chat/channels/${channel.channel_id}/messages`, {message, is_action})
	}

	/**
	 * Join a public or multiplayer ChatChannel, allowing you to interact with it!
	 * @scope {@link Scope"chat.write_manage"}
	 * @param channel The channel you wanna join
	 * @param user (defaults to the presumed authorized user) The user joining the channel
	 */
	async joinChatChannel(channel: {channel_id: number} | Chat.Channel, user?: {id: number} | User): Promise<Chat.Channel.WithDetails> {
		return await this.request("put", `chat/channels/${channel.channel_id}/users/${user?.id || this.user}`)
	}

	/**
	 * Leave/Close a public ChatChannel!
	 * @scope {@link Scope"chat.write_manage"}
	 * @param channel The channel you wanna join
	 * @param user (defaults to the presumed authorized user) The user joining the channel
	 */
	async leaveChatChannel(channel: {channel_id: number} | Chat.Channel, user?: {id: number} | User): Promise<void> {
		return await this.request("delete", `chat/channels/${channel.channel_id}/users/${user?.id || this.user}`)
	}

	/**
	 * Mark a certain channel as read up to a given message!
	 * @scope {@link Scope"chat.read"}
	 * @param channel The channel in question
	 * @param message You're marking this and all the messages before it as read!
	 */
	async markChatChannelAsRead(channel: {channel_id: number} | Chat.Channel, message: {message_id: number} | Chat.Message): Promise<void> {
		return await this.request("put",
		`chat/channels/${channel.channel_id}/mark-as-read/${message.message_id}`, {channel_id: channel.channel_id, message: message.message_id})
	}

	/**
	 * Get a list of all publicly joinable channels!
	 * @scope {@link Scope"chat.read"}
	 */
	async getChatChannels(): Promise<Chat.Channel[]> {
		return await this.request("get", "chat/channels")
	}

	/**
	 * Create/Open/Join a private messages chat channel!
	 * @scope {@link Scope"chat.read"}
	 * @param user_target The other user able to read and send messages in this channel
	 * @returns The newly created channel!
	 */
	async createChatPrivateChannel(user_target: {id: number} | User): Promise<Chat.Channel> {
		return await this.request("post", "chat/channels", {type: "PM", target_id: user_target.id})
	}

	/**
	 * Create a new announcement!
	 * @scope {@link Scope"chat.write_manage"}
	 * @remarks From my understanding, this WILL 403 unless the user is kinda special
	 * @param channel Details of the channel you're creating
	 * @param user_targets The people that will receive your message
	 * @param message The message to send with the announcement
	 * @returns The newly created channel!
	 */
	async createChatAnnouncementChannel(channel: {name: string, description: string}, user_targets: Array<{id: number} | User>, message: string):
	Promise<Chat.Channel> {
		const target_ids = user_targets.map((u) => u.id)
		return await this.request("post", "chat/channels", {type: "ANNOUNCE", channel, target_ids, message})
	}

	/**
	 * Get a ChatChannel, and the users in it if it is a private channel!
	 * @scope {@link Scope"chat.read"}
	 * @remarks Will 404 if the user has not joined the channel (use `joinChatChannel` for that)
	 * @param channel The channel in question
	 */
	async getChatChannel(channel: {channel_id: number} | Chat.Channel): Promise<Chat.Channel.WithDetails> {
		const response = await this.request("get", `chat/channels/${channel.channel_id}`)
		return response.channel
	}

	
	// OTHER STUFF

	/**
	 * Get the backgrounds made and selected for this season or for last season!
	 * @returns When the season ended, and for each background, its URL and its artist
	 */
	async getSeasonalBackgrounds(): Promise<{ends_at: Date, backgrounds: {url: string, user: User}[]}> {
		return await this.request("get", "seasonal-backgrounds")
	}

	/**
	 * Get the replay for a score!
	 * @scope {@link Scope"public"}
	 * @param score The score that has created the replay
	 * @returns The correctly encoded content of what would be a replay file (you can just fs.writeFileSync with it!)
	 */
	async getReplay(score: {id: number} | Score): Promise<string> {
		return await this.request("get", `scores/${score.id}/download`)
	}

	/**
	 * Get everything note-worthy that happened on osu! recently!
	 * @param sort (defaults to "id_desc") "id_asc" to have the oldest recent event first, "id_desc" to have the newest instead
	 * @param cursor_string Use a response's `cursor_string` with the same parameters to get the next "page" of results, so `posts` in this instance!
	 */
	async getEvents(sort: "id_desc" | "id_asc" = "id_desc", cursor_string?: string): Promise<{events: Event.Any[], cursor_string: string}> {
		return await this.request("get", "events", {sort, cursor_string})
	}

	/**
	 * Get comments that meet any of your requirements!
	 * @param from From where are the comments coming from? Maybe a beatmapset, but then, which beatmapset?
	 * @param parent The comments are replying to which comment? Make the id 0 to filter out replies (and only get top level comments)
	 * @param sort Should the comments be sorted by votes? Should they be from after a certain date? Maybe you can give a cursor?
	 */
	async getComments(from?: {type: Comment["commentable_type"], id: number}, parent?: Comment | {id: number | 0},
	sort?: {type?: CommentBundle["sort"], after?: Comment | {id: number}, cursor?: CommentBundle["cursor"]}): Promise<CommentBundle.WithTotalToplevelcount> {
		const after = sort?.after?.id ? String(sort.after.id) : undefined
		const parent_id = parent?.id ? String(parent.id) : undefined

		let bundle = await this.request("get", "comments", {
			after, commentable_type: from?.type, commentable_id: from?.id,
			cursor: sort?.cursor, parent_id, sort: sort?.type
		})
		const commentable_meta = bundle.commentable_meta.filter((c: any) => c.id)
		bundle.deleted_commentable_meta = bundle.commentable_meta.length - commentable_meta.length
		bundle.commentable_meta = commentable_meta
		
		return bundle
	}

	/**
	 * Get a specific comment by using its id!
	 * @param comment The comment in question
	 */
	async getComment(comment: Comment | {id: number}): Promise<CommentBundle> {
		let bundle = await this.request("get", `comments/${comment.id}`)
		const commentable_meta = bundle.commentable_meta.filter((c: any) => c.id)
		bundle.deleted_commentable_meta = bundle.commentable_meta.length - commentable_meta.length
		bundle.commentable_meta = commentable_meta
		
		return bundle
	}
}
