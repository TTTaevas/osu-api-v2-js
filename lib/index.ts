import fetch, { FetchError } from "node-fetch"
import { WebSocket } from "ws"
import { User } from "./user.js"
import { Beatmap } from "./beatmap.js"
import { Beatmapset } from "./beatmapset.js"

import { Multiplayer } from "./multiplayer.js"
import { Score } from "./score.js"
import { Rankings, Spotlight } from "./ranking.js"
import { Event } from "./event.js"

import { Changelog } from "./changelog.js"
import { Forum, PollConfig } from "./forum.js"
import { WikiPage } from "./wiki.js"
import { NewsPost } from "./news.js"
import { SearchResult } from "./home.js"
import { Rulesets, Mod, Scope, Genres, Languages } from "./misc.js"
import { Chat } from "./chat.js"
import { Comment, CommentBundle } from "./comment.js"


export { User } from "./user.js"
export { Beatmap } from "./beatmap.js"
export { Beatmapset } from "./beatmapset.js"

export { Multiplayer } from "./multiplayer.js"
export { Score } from "./score.js"
export { Rankings, Spotlight } from "./ranking.js"
export { Event } from "./event.js"

export { Changelog } from "./changelog.js"
export { Forum, PollConfig } from "./forum.js"
export { WikiPage } from "./wiki.js"
export { NewsPost } from "./news.js"
export { SearchResult } from "./home.js"
export { Rulesets, Mod, Scope, Genres, Languages, RankStatus } from "./misc.js"
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
	public async request(method: "get" | "post" | "put" | "delete", endpoint: string,
	parameters: {[k: string]: any} = {}, number_try: number = 1): Promise<any> {
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

		const url = `${this.server}/api/v2/${endpoint}` + (method === "get" ? "?" + (Object.entries(parameters).map((param) => {
			if (!Array.isArray(param[1])) return `${param[0]}=${param[1]}`
			return param[1].map((array_element) => `${param[0]}=${array_element}`).join("&")
		}).join("&")) : "")

		const response = await fetch(url, {
			method,
			headers: {
				"Accept": "application/json",
				"Accept-Encoding": "gzip",
				"Content-Type": "application/json",
				"User-Agent": "osu-api-v2-js (https://github.com/TTTaevas/osu-api-v2-js)",
				"Authorization": `${this.token_type} ${this.access_token}`
			},
			body: method !== "get" ? JSON.stringify(parameters) : undefined,
			
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

	/** {@inheritDoc User.getResourceOwner} @group User Functions */
	readonly getResourceOwner = User.getResourceOwner

	/** {@inheritDoc User.getOne} @group User Functions */
	readonly getUser = User.getOne

	/** {@inheritDoc User.getMultiple} @group User Functions */
	readonly getUsers = User.getMultiple

	/** {@inheritDoc User.getScores} @group User Functions */
	readonly getUserScores = User.getScores

	/** {@inheritDoc User.getBeatmaps} @group User Functions */
	readonly getUserBeatmaps = User.getBeatmaps

	/** {@inheritDoc User.getMostPlayed} @group User Functions */
	readonly getUserMostPlayed = User.getMostPlayed

	/** {@inheritDoc User.getRecentActivity} @group User Functions */
	readonly getUserRecentActivity = User.getRecentActivity

	/** {@inheritDoc User.getKudosu} @group User Functions */
	readonly getUserKudosu = User.getKudosu

	/** {@inheritDoc User.getFriends} @group User Functions */
	readonly getFriends = User.getFriends

	
	// BEATMAP STUFF

	/** {@inheritDoc Beatmap.lookup} @group Beatmap Functions */
	readonly lookupBeatmap = Beatmap.lookup

	/** {@inheritDoc Beatmap.getOne} @group Beatmap Functions */
	readonly getBeatmap = Beatmap.getOne

	/** {@inheritDoc Beatmap.getMultiple} @group Beatmap Functions */
	readonly getBeatmaps = Beatmap.getMultiple

	/** {@inheritDoc Beatmap.DifficultyAttributes.get} @group Beatmap Functions */
	readonly getBeatmapDifficultyAttributes = Beatmap.DifficultyAttributes.get

	/** {@inheritDoc Beatmap.DifficultyAttributes.getOsu} @group Beatmap Functions */
	readonly getBeatmapDifficultyAttributesOsu = Beatmap.DifficultyAttributes.getOsu

	/** {@inheritDoc Beatmap.DifficultyAttributes.getTaiko} @group Beatmap Functions */
	readonly getBeatmapDifficultyAttributesTaiko = Beatmap.DifficultyAttributes.getTaiko

	/** {@inheritDoc Beatmap.DifficultyAttributes.getFruits} @group Beatmap Functions */
	readonly getBeatmapDifficultyAttributesFruits = Beatmap.DifficultyAttributes.getFruits

	/** {@inheritDoc Beatmap.DifficultyAttributes.getMania} @group Beatmap Functions */
	readonly getBeatmapDifficultyAttributesMania = Beatmap.DifficultyAttributes.getMania

	/** {@inheritDoc Beatmap.Pack.getOne} @group Beatmap Functions */
	readonly getBeatmapPack = Beatmap.Pack.getOne

	/** {@inheritDoc Beatmap.Pack.getMultiple} @group Beatmap Functions */
	readonly getBeatmapPacks = Beatmap.Pack.getMultiple

	/** {@inheritDoc Beatmap.getScores} @group Beatmap Functions */
	readonly getBeatmapScores = Beatmap.getScores

	/** {@inheritDoc Beatmap.getSoloScores} @group Beatmap Functions */
	readonly getBeatmapSoloScores = Beatmap.getSoloScores

	/** {@inheritDoc Beatmap.UserScore.getOne} @group Beatmap Functions */
	readonly getBeatmapUserScore = Beatmap.UserScore.getOne

	/** {@inheritDoc Beatmap.UserScore.getMultiple} @group Beatmap Functions */
	readonly getBeatmapUserScores = Beatmap.UserScore.getMultiple


	// BEATMAPSET STUFF

	/** {@inheritDoc Beatmapset.search} @group Beatmapset Functions */
	readonly searchBeatmapsets = Beatmapset.search

	/** {@inheritDoc Beatmapset.lookup} @group Beatmapset Functions */
	readonly lookupBeatmapset = Beatmapset.lookup

	/** {@inheritDoc Beatmapset.getOne} @group Beatmapset Functions */
	readonly getBeatmapset = Beatmapset.getOne

	/** {@inheritDoc Beatmapset.Discussion.getMultiple} @group Beatmapset Functions */
	readonly getBeatmapsetDiscussions = Beatmapset.Discussion.getMultiple

	/** {@inheritDoc Beatmapset.Discussion.Post.getMultiple} @group Beatmapset Functions */
	readonly getBeatmapsetDiscussionPosts = Beatmapset.Discussion.Post.getMultiple

	/** {@inheritDoc Beatmapset.Discussion.Vote.getMultiple} @group Beatmapset Functions */
	readonly getBeatmapsetDiscussionVotes = Beatmapset.Discussion.Vote.getMultiple

	/** {@inheritDoc Beatmapset.Event.getMultiple} @group Beatmapset Functions */
	readonly getBeatmapsetEvents = Beatmapset.Event.getMultiple


	// CHANGELOG STUFF
	
	/** {@inheritDoc Changelog.Build.lookup} @group Changelog Functions */
	readonly lookupChangelogBuild = Changelog.Build.lookup

	/** {@inheritDoc Changelog.Build.getOne} @group Changelog Functions */
	readonly getChangelogBuild = Changelog.Build.getOne

	/** {@inheritDoc Changelog.Build.getMultiple} @group Changelog Functions */
	readonly getChangelogBuilds = Changelog.Build.getMultiple

	/** {@inheritDoc Changelog.UpdateStream.getAll} @group Changelog Functions */
	readonly getChangelogStreams = Changelog.UpdateStream.getAll


	// CHAT STUFF

	/** {@inheritDoc Chat.keepAlive} @group Chat Functions */
	readonly keepChatAlive = Chat.keepAlive

	/** {@inheritDoc Chat.Message.getMultiple} @group Chat Functions */
	readonly getChatMessages = Chat.Message.getMultiple

	/** {@inheritDoc Chat.Message.send} @group Chat Functions */
	readonly sendChatMessage = Chat.Message.send

	/** {@inheritDoc Chat.Message.sendPrivate} @group Chat Functions */
	readonly sendChatPrivateMessage = Chat.Message.sendPrivate

	/** {@inheritDoc Chat.Channel.getOne} @group Chat Functions */
	readonly getChatChannel = Chat.Channel.getOne

	/** {@inheritDoc Chat.Channel.getAll} @group Chat Functions */
	readonly getChatChannels = Chat.Channel.getAll

	/** {@inheritDoc Chat.Channel.markAsRead} @group Chat Functions */
	readonly markChatChannelAsRead = Chat.Channel.markAsRead

	/** {@inheritDoc Chat.Channel.createPrivate} @group Chat Functions */
	readonly createChatPrivateChannel = Chat.Channel.createPrivate

	/** {@inheritDoc Chat.Channel.createAnnouncement} @group Chat Functions */
	readonly createChatAnnouncementChannel = Chat.Channel.createAnnouncement

	/** {@inheritDoc Chat.Channel.joinOne} @group Chat Functions */
	readonly joinChatChannel = Chat.Channel.joinOne

	/** {@inheritDoc Chat.Channel.leaveOne} @group Chat Functions */
	readonly leaveChatChannel = Chat.Channel.leaveOne


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
	async getRooms(type: "playlists" | "realtime", mode: "active" | "all" | "ended" | "participated" | "owned",
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

	/** {@inheritDoc NewsPost.getOne} @group NewsPost Functions */
	readonly getNewsPost = NewsPost.getOne

	/** {@inheritDoc NewsPost.getMultiple} @group NewsPost Functions */
	readonly getNewsPosts = NewsPost.getMultiple


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
