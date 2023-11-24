import fetch, { FetchError } from "node-fetch"
import querystring from "querystring"

import { User, UserWithKudosu, UserWithCountry, UserWithCountryCover, UserWithCountryCoverGroupsStatisticsrulesets, UserWithCountryCoverGroupsStatisticsSupport,
	UserExtended, UserExtendedWithStatisticsrulesets,
	UserStatistics, UserStatisticsWithUser, UserStatisticsWithCountryrank, KudosuHistory, ProfileBanner } from "./user.js"
import { Beatmap, BeatmapExtendedWithFailtimesBeatmapsetextended, BeatmapWithBeatmapset, BeatmapWithBeatmapsetChecksumMaxcombo, BeatmapExtended, BeatmapPlaycount,
	BeatmapDifficultyAttributes, BeatmapDifficultyAttributesOsu, BeatmapDifficultyAttributesTaiko, BeatmapDifficultyAttributesFruits, BeatmapDifficultyAttributesMania,
	Beatmapset, BeatmapsetExtended, BeatmapExtendedWithFailtimes, BeatmapsetExtendedWithBeatmapExtended, BeatmapsetExtendedPlus, BeatmapPack, RankStatus }
	from "./beatmap.js"

import { Room, Leader, PlaylistItem, MultiplayerScore, MultiplayerScores, Match, MatchInfo } from "./multiplayer.js"
import { Score, ScoreWithMatch, ScoreWithUser, ScoreWithUserBeatmap, ScoreWithUserBeatmapBeatmapset, BeatmapUserScore } from "./score.js"
import { Rankings, RankingsCountry, Spotlight, SpotlightWithParticipantcount, RankingsSpotlight } from "./ranking.js"
import { Event, EventUser, EventBeatmap, EventBeatmapset, EventBeatmapPlaycount, EventBeatmapsetDelete, EventAchievement, EventBeatmapsetApprove,
	EventBeatmapsetRevive, EventBeatmapsetUpdate, EventBeatmapsetUpload, EventRank, EventRankLost, EventUserSupportAgain, EventUserSupportFirst,
	EventUserSupportGift, EventUsernameChange } from "./event.js"

import { ChangelogBuildWithUpdatestreams, ChangelogBuildWithUpdatestreamsChangelogentries, ChangelogBuildWithChangelogentriesVersions,
	UpdateStream } from "./changelog.js"
import { ForumPost, ForumTopic, PollConfig } from "./forum.js"
import { WikiPage } from "./wiki.js"
import { NewsPost, NewsPostWithContentNavigation } from "./news.js"
import { SearchResultUser, SearchResultWiki } from "./home.js"
import { Rulesets, Mod, Scope } from "./misc.js"


export { User, UserWithKudosu, UserWithCountry, UserWithCountryCover, UserWithCountryCoverGroupsStatisticsrulesets, UserWithCountryCoverGroupsStatisticsSupport,
	UserExtended, UserExtendedWithStatisticsrulesets,
	UserStatistics, UserStatisticsWithUser, UserStatisticsWithCountryrank, KudosuHistory, ProfileBanner } from "./user.js"
export { Beatmap, BeatmapExtendedWithFailtimesBeatmapsetextended, BeatmapWithBeatmapset, BeatmapWithBeatmapsetChecksumMaxcombo, BeatmapExtended, BeatmapPlaycount,
	BeatmapDifficultyAttributes, BeatmapDifficultyAttributesOsu, BeatmapDifficultyAttributesTaiko, BeatmapDifficultyAttributesFruits, BeatmapDifficultyAttributesMania,
	Beatmapset, BeatmapsetExtended, BeatmapExtendedWithFailtimes, BeatmapsetExtendedWithBeatmapExtended, BeatmapsetExtendedPlus, BeatmapPack, RankStatus }
	from "./beatmap.js"

export { Room, Leader, PlaylistItem, MultiplayerScore, MultiplayerScores, Match, MatchInfo } from "./multiplayer.js"
export { Score, ScoreWithMatch, ScoreWithUser, ScoreWithUserBeatmap, ScoreWithUserBeatmapBeatmapset, BeatmapUserScore } from "./score.js"
export { Rankings, RankingsCountry, Spotlight, SpotlightWithParticipantcount, RankingsSpotlight } from "./ranking.js"
export { Event, EventUser, EventBeatmap, EventBeatmapset, EventBeatmapPlaycount, EventBeatmapsetDelete, EventAchievement, EventBeatmapsetApprove,
	EventBeatmapsetRevive, EventBeatmapsetUpdate, EventBeatmapsetUpload, EventRank, EventRankLost, EventUserSupportAgain, EventUserSupportFirst,
	EventUserSupportGift, EventUsernameChange } from "./event.js"

export { ChangelogBuildWithUpdatestreams, ChangelogBuildWithUpdatestreamsChangelogentries, ChangelogBuildWithChangelogentriesVersions,
	UpdateStream } from "./changelog.js"
export { ForumPost, ForumTopic, PollConfig } from "./forum.js"
export { WikiPage } from "./wiki.js"
export { NewsPost, NewsPostWithContentNavigation } from "./news.js"
export { SearchResultUser, SearchResultWiki } from "./home.js"
export { Rulesets, Mod, Scope } from "./misc.js"

/**
 * Some stuff doesn't have the right type to begin with, such as dates, which are being returned as strings, this fixes that
 * @param x Anything, but should be a string, an array that contains a string, or an object which has a string
 * @returns x, but with it (or what it contains) now having the correct type
 */
function correctType(x: any): any {
	// raw and bbcode because forum, author and version because changelog
	const bannedProperties = ["name", "version", "author", "raw", "bbcode"]

	if (typeof x === "boolean") {
		return x
	} else if (/^[+-[0-9][0-9]+-[0-9]{2}-[0-9]{2}($|[ T])/.test(x)) {
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

/**
 * If the `API` throws an error, it should always be an `APIError`!
 */
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

/**
 * You can create an API instance using its `createAsync` function!
 */
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

	/**
	 * @returns Whether or not the token has been refreshed
	 */
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

		if (parameters !== undefined && method === "get") {
			// If a parameter is an empty string or is undefined, remove it
			for (let i = 0; i < Object.entries(parameters).length; i++) {
				if (!String(Object.values(parameters)[i]).length || Object.values(parameters)[i] === undefined) {
					i--
					delete parameters[Object.keys(parameters)[i + 1]]
				}
			}
			// If a parameter is an Array, add "[]" to its name, so the server understands the request properly
			for (let i = 0; i < Object.entries(parameters).length; i++) {
				if (Array.isArray(Object.values(parameters)[i]) && !Object.keys(parameters)[i].includes("[]")) {
					i--
					parameters[`${Object.keys(parameters)[i + 1]}[]`] = Object.values(parameters)[i + 1]
					delete parameters[Object.keys(parameters)[i + 1]]
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
				return correctType(await this.request(method, endpoint, parameters, number_try + 1))
			}

			throw new APIError(err, `${this.server}/api/v2`, endpoint, parameters)
		}

		this.log(false, response.statusText, response.status, {endpoint, parameters})
		return correctType(await response.json())
	}


	// USER STUFF

	/**
	 * Get extensive user data about the authorized user
	 * @param ruleset Defaults to the user's default/favourite Ruleset
	 * @scope identify
	 */
	async getResourceOwner(ruleset?: Rulesets): Promise<UserExtendedWithStatisticsrulesets> {
		return await this.request("get", "me", {mode: ruleset})
	}
	
	/**
	 * Get extensive user data about whoever you want!
	 * @param user An object with either the id or the username of the user you're trying to get
	 * @param ruleset Defaults to the user's default/favourite Ruleset
	 */
	async getUser(user: {id?: number, username?: string} | User, ruleset?: Rulesets): Promise<UserExtended> {
		const key = user.id !== undefined ? "id" : "username"
		const lookup = user.id !== undefined ? user.id : user.username
		const mode = ruleset !== undefined ? `/${Rulesets[ruleset]}` : ""

		return await this.request("get", `users/${lookup}${mode}`, {key})
	}

	/**
	 * Get user data for up to 50 users at once!
	 * @param ids An array composed of the ids of the users you want
	 */
	async getUsers(ids: number[]): Promise<UserWithCountryCoverGroupsStatisticsrulesets[]> {
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
	ruleset?: Rulesets, include_fails: boolean = false, offset?: number): Promise<ScoreWithUserBeatmapBeatmapset[]> {
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
	async getUserBeatmaps(user: {id: number} | User, type: "favourite" | "graveyard" | "guest" | "loved" | "nominated" | "pending" | "ranked",
	limit: number = 5, offset?: number): Promise<BeatmapsetExtendedWithBeatmapExtended[]> {
		return await this.request("get", `users/${user.id}/beatmapsets/${type}`, {limit, offset})
	}

	/**
	 * Get the beatmaps most played by a user!
	 * @param user The user who played the beatmaps
	 * @param limit (defaults to 5) The maximum amount of elements returned in the array
	 * @param offset How many elements that would be at the top of the returned array get skipped (while still filling the array up to the limit)
	 */
	async getUserMostPlayed(user: {id: number} | User, limit: number = 5, offset?: number): Promise<BeatmapPlaycount[]> {
		return await this.request("get", `users/${user.id}/beatmapsets/most_played`, {limit, offset})
	}

	/**
	 * Get an array of Events of different `type`s that relate to a user's activity during the last 31 days! (or 100 activities, whatever comes first)
	 * @param user The user in question
	 * @param limit (defaults to 5) The maximum amount of elements returned in the array
	 * @param offset How many elements that would be at the top of the returned array get skipped (while still filling the array up to the limit)
	 */
	async getUserRecentActivity(user: {id: number} | User, limit: number = 5, offset?: number): Promise<Array<EventAchievement | EventBeatmapsetApprove |
	EventBeatmapsetRevive | EventBeatmapsetUpdate | EventBeatmapsetUpload | EventRank | EventRankLost |
	EventUserSupportAgain | EventUserSupportFirst | EventUserSupportGift | EventUsernameChange>> {
		return await this.request("get", `users/${user.id}/recent_activity`, {limit, offset})
	}

	/**
	 * Get data about the activity of a user kudosu-wise!
	 * @param user The user in question
	 * @param limit (defaults to 5) The maximum amount of activities in the returned array
	 * @param offset How many elements that would be at the top of the returned array get skipped (while still filling the array up to the limit)
	 */
	async getUserKudosu(user: {id: number} | User, limit?: number, offset?: number): Promise<KudosuHistory[]> {
		return await this.request("get", `users/${user.id}/kudosu`, {limit, offset})
	}

	/**
	 * Get user data of each friend of the authorized user
	 * @scope friends.read
	 */
	async getFriends(): Promise<UserWithCountryCoverGroupsStatisticsSupport[]> {
		return await this.request("get", "friends")
	}

	
	// BEATMAP STUFF

	/**
	 * Get extensive beatmap data about whichever beatmap you want!
	 * @param beatmap An object with the id of the beatmap you're trying to get
	 */
	async getBeatmap(beatmap: {id: number} | Beatmap): Promise<BeatmapExtendedWithFailtimesBeatmapsetextended> {
		return await this.request("get", `beatmaps/${beatmap.id}`)
	}

	/**
	 * Get extensive beatmap data for up to 50 beatmaps at once!
	 * @param ids An array composed of the ids of the beatmaps you want
	 */
	async getBeatmaps(ids?: number[]): Promise<BeatmapExtended[]> {
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
	Promise<BeatmapDifficultyAttributes | BeatmapDifficultyAttributesOsu |BeatmapDifficultyAttributesTaiko |
	BeatmapDifficultyAttributesFruits | BeatmapDifficultyAttributesMania> {
		const response = await this.request("post", `beatmaps/${beatmap.id}/attributes`, {ruleset_id: ruleset, mods})
		return response.attributes
	}
	/**
	 * Get various data about the difficulty of an osu! beatmap!
	 * @param beatmap The Beatmap in question
	 * @param mods (defaults to No Mod) (will ignore mod settings) Can be a bitset of mods, an array of mod acronyms ("DT" for DoubleTime), or an array of Mods
	 */
	async getBeatmapDifficultyAttributesOsu(beatmap: {id: number} | Beatmap, mods?: Mod[] | string[] | number): Promise<BeatmapDifficultyAttributesOsu> {
		return await this.getBeatmapDifficultyAttributes(beatmap, mods, Rulesets.osu) as BeatmapDifficultyAttributesOsu
	}
	/**
	 * Get various data about the difficulty of a taiko beatmap!
	 * @param beatmap The Beatmap in question
	 * @param mods (defaults to No Mod) (will ignore mod settings) Can be a bitset of mods, an array of mod acronyms ("DT" for DoubleTime), or an array of Mods
	 */
	async getBeatmapDifficultyAttributesTaiko(beatmap: {id: number} | Beatmap, mods?: Mod[] | string[] | number): Promise<BeatmapDifficultyAttributesTaiko> {
		return await this.getBeatmapDifficultyAttributes(beatmap, mods, Rulesets.taiko) as BeatmapDifficultyAttributesTaiko
	}
	/**
	 * Get various data about the difficulty of a ctb beatmap!
	 * @param beatmap The Beatmap in question
	 * @param mods (defaults to No Mod) (will ignore mod settings) Can be a bitset of mods, an array of mod acronyms ("DT" for DoubleTime), or an array of Mods
	 */
	async getBeatmapDifficultyAttributesFruits(beatmap: {id: number} | Beatmap, mods?: Mod[] | string[] | number): Promise<BeatmapDifficultyAttributesFruits> {
		return await this.getBeatmapDifficultyAttributes(beatmap, mods, Rulesets.fruits) as BeatmapDifficultyAttributesFruits
	}
	/**
	 * Get various data about the difficulty of a mania beatmap!
	 * @param beatmap The Beatmap in question
	 * @param mods (defaults to No Mod) (will ignore mod settings) Can be a bitset of mods, an array of mod acronyms ("DT" for DoubleTime), or an array of Mods
	 */
	async getBeatmapDifficultyAttributesMania(beatmap: {id: number} | Beatmap, mods?: Mod[] | string[] | number): Promise<BeatmapDifficultyAttributesMania> {
		return await this.getBeatmapDifficultyAttributes(beatmap, mods, Rulesets.mania) as BeatmapDifficultyAttributesMania
	}

	/**
	 * Get the top scores of a beatmap!
	 * @param beatmap The Beatmap in question
	 * @param ruleset The Ruleset used to make the scores, useful if they were made on a convert
	 * @param mods (2023-11-16) Currently doesn't do anything
	 * @param type (2023-11-16) Currently doesn't do anything
	 */
	async getBeatmapScores(beatmap: {id: number} | Beatmap, ruleset?: Rulesets, mods?: string[], type?: string): Promise<ScoreWithUser[]> {
		const mode = ruleset !== undefined ? Rulesets[ruleset] : undefined
		const response = await this.request("get", `beatmaps/${beatmap.id}/scores`, {mode, mods, type})
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
	async getBeatmapUserScores(beatmap: {id: number} | Beatmap, user: {id: number} | User, ruleset?: Rulesets): Promise<Score[]> {
		const mode = ruleset !== undefined ? Rulesets[ruleset] : undefined
		const response = await this.request("get", `beatmaps/${beatmap.id}/scores/users/${user.id}/all`, {mode})
		return response.scores
	}

	/**
	 * Get extensive beatmapset data about whichever beatmapset you want!
	 * @param beatmapset An object with the id of the beatmapset you're trying to get
	 */
	async getBeatmapset(beatmapset: {id: number} | Beatmapset): Promise<BeatmapsetExtendedPlus> {
		return await this.request("get", `beatmapsets/${beatmapset.id}`)
	}

	/**
	 * Get data about a BeatmapPack using its tag!
	 * @param pack An object with the tag of the beatmappack you're trying to get
	 * @remarks Currently in https://osu.ppy.sh/beatmaps/packs, when hovering a pack, its link with its tag should show up on your browser's bottom left
	 */
	async getBeatmapPack(pack: {tag: string} | BeatmapPack): Promise<BeatmapPack> {
		return await this.request("get", `beatmaps/packs/${pack.tag}`)
	}

	/**
	 * Get an Array of up to 100 BeatmapPacks of a specific type!
	 * @param type The type of the BeatmapPacks, defaults to "standard"
	 */
	async getBeatmapPacks(type: "standard" | "featured" | "tournament" | "loved" | "chart" | "theme" | "artist" = "standard"): Promise<BeatmapPack[]> {
		const response = await this.request("get", "beatmaps/packs", {type})
		return response.beatmap_packs
	}


	// CHANGELOG STUFF

	/**
	 * Get details about the version/update/build of something related to osu!
	 * @param stream The name of the thing related to osu!, like `lazer`, `web`, `cuttingedge`, `beta40`, `stable40`
	 * @param build The name of the version! Usually something like `2023.1026.0` for lazer, or `20230326` for stable
	 */
	async getChangelogBuild(stream: string, build: string): Promise<ChangelogBuildWithChangelogentriesVersions> {
		return await this.request("get", `changelog/${stream}/${build}`)
	}

	/**
	 * Get up to 21 versions/updates/builds!
	 * @param versions Get builds that were released before/after (and including) those versions (use the name of the versions, e.g. `2023.1109.0`)
	 * @param max_id Filter out builds that have an id higher than this (this takes priority over `versions.to`)
	 * @param stream Only get builds from a specific stream
	 * @param message_formats Each element of `changelog_entries` will have a `message` property if `markdown`, `message_html` if `html`, defaults to both
	 */
	async getChangelogBuilds(versions?: {from?: string, to?: string}, max_id?: number,
	stream?: string, message_formats: ("html" | "markdown")[] = ["html", "markdown"]): Promise<ChangelogBuildWithUpdatestreamsChangelogentries[]> {
		const [from, to] = [versions?.from, versions?.to]
		const response = await this.request("get", "changelog", {from, to, max_id, stream, message_formats})
		return response.builds
	}

	/**
	 * An effective way to get all available streams, as well as their latest version!
	 * @example ```ts
	 * const names_of_streams = (await api.getChangelogStreams()).map(s => s.name)
	 * ```
	 */
	async getChangelogStreams(): Promise<UpdateStream[]> {
		const response = await this.request("get", "changelog", {max_id: 0})
		return response.streams
	}


	// MULTIPLAYER STUFF

	/**
	 * Get data about a lazer multiplayer room (realtime or playlists)!
	 * @param room An object with the id of the room, is at the end of its URL (after `/multiplayer/rooms/`)
	 */
	async getRoom(room: {id: number} | Room): Promise<Room> {
		return await this.request("get", `rooms/${room.id}`)
	}

	/**
	 * Get rooms that are active, that have ended, that the user participated in, that the user made, or just simply any room!
	 * @param mode Self-explanatory enough, defaults to `active`
	 * @scope public
	 */
	async getRooms(mode: "active" | "all" | "ended" | "participated" | "owned" = "active"): Promise<Room[]> {
		return await this.request("get", "rooms", {mode})
	}

	/**
	 * Get the room stats of all the users of that room!
	 * @param room An object with the id of the room in question
	 * @scope public
	 */
	async getRoomLeaderboard(room: {id: number} | Room): Promise<Leader[]> {
		const response = await this.request("get", `rooms/${room.id}/leaderboard`)
		return response.leaderboard
	}

	/**
	 * Get the scores on a specific item of a room!
	 * @param item An object with the id of the item in question, as well as the id of the room
	 * @param limit How many scores maximum? Defaults to 50, the maximum the API will return
	 * @param sort Sort by scores, ascending or descending? Defaults to descending
	 * @param cursor_string Use a MultiplayerScores' `params` and `cursor_string` to get the next page (scores 51 to 100 for example)
	 * @remarks (2023-11-10) Items are broken for multiplayer (real-time) rooms, not for playlists (like spotlights), that's an osu! bug
	 * https://github.com/ppy/osu-web/issues/10725
	 */
	async getPlaylistItemScores(item: {id: number, room_id: number} | PlaylistItem, limit: number = 50,
	sort: "score_asc" | "score_desc" = "score_desc", cursor_string?: string): Promise<MultiplayerScores> {
		return await this.request("get", `rooms/${item.room_id}/playlist/${item.id}/scores`, {limit, sort, cursor_string})
	}

	/**
	 * Get data of a multiplayer lobby from the stable (non-lazer) client that have URLs with `community/matches` or `mp`
	 * @param id Can be found at the end of the URL of said match
	 */
	async getMatch(id: number): Promise<Match> {
		const response = await this.request("get", `matches/${id}`) as Match
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
	async getMatches(): Promise<MatchInfo[]> {
		const response = await this.request("get", "matches")
		return response.matches
	}


	// RANKING STUFF

	/**
	 * Get the top 50 players who have the most total kudosu!
	 */
	async getKudosuRanking(): Promise<UserWithKudosu[]> {
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
	async getRanking(ruleset: Rulesets, type: "performance" | "score", page: number = 1, filter: "all" | "friends" = "all",
	country?: string, variant?: "4k" | "7k"): Promise<Rankings> {
		return await this.request("get", `rankings/${Rulesets[ruleset]}/${type}`, {page, filter, country, variant})
	}

	/**
	 * Get the top countries of a specific ruleset!
	 * @param ruleset On which Ruleset should the countries be compared?
	 * @param page (defaults to 1) Imagine `Rankings` as a page, it can only have a maximum of 50 countries, while 50 others may be on the next one
	 */
	async getCountryRanking(ruleset: Rulesets, page: number = 1): Promise<RankingsCountry> {
		return await this.request("get", `rankings/${Rulesets[ruleset]}/country`, {page})
	}

	/**
	 * Get the rankings of a spotlight from 2009 to 2020 on a specific ruleset!
	 * @param ruleset Each spotlight has a different ranking (and often maps) depending on the ruleset
	 * @param spotlight The spotlight in question
	 * @param filter What kind of players do you want to see? Defaults to `all`, `friends` has no effect if no authorized user
	 */
	async getSpotlightRanking(ruleset: Rulesets, spotlight: {id: number} | Spotlight, filter: "all" | "friends" = "all"): Promise<RankingsSpotlight> {
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
	async searchUser(query: string, page: number = 1): Promise<SearchResultUser> {
		const response = await this.request("get", "search", {mode: "user", query, page})
		return response.user
	}

	/**
	 * Look for a wiki page like you would on the website!
	 * @param query What you would put in the searchbar
	 * @param page (defaults to 1) You normally get the first 50 results, but if page is 2, you'd get results 51 to 100 instead for example!
	 */
	async searchWiki(query: string, page: number = 1): Promise<SearchResultWiki> {
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
	async getNewsPosts(year?: number): Promise<NewsPost[]> {
		const response = await this.request("get", "news", {year, limit: 1})
		return response.news_sidebar.news_posts
	}

	/**
	 * Get a NewsPost, its content, and the NewsPosts right before and right after it!
	 * @param post An object with the id or the slug of a NewsPost (the slug being the filename minus the extension, used in its URL)
	 */
	async getNewsPost(post: {id?: number, slug?: string} | NewsPost): Promise<NewsPostWithContentNavigation> {
		const key = post.id !== undefined ? "id" : undefined
		const lookup = post.id !== undefined ? post.id : post.slug
		return await this.request("get", `news/${lookup}`, {key})
	}


	// FORUM STUFF

	/**
	 * Make and send a ForumPost in a ForumTopic!
	 * @param topic An object with the id of the topic you're making your reply in
	 * @param text Your reply! Your message!
	 * @returns The reply you've made!
	 * @scope forum.write
	 */
	async replyForumTopic(topic: {id: number} | ForumTopic, text: string): Promise<ForumPost> {
		return await this.request("post", `forums/topics/${topic.id}/reply`, {body: text})
	}

	/**
	 * Create a new ForumTopic in the forum of your choice!
	 * @remarks Some users may not be allowed to do that, such as newly registered users, so this can 403 even with the right scopes
	 * @param forum_id The id of the forum you're creating your topic in
	 * @param title The topic's title
	 * @param text The first post's content/message
	 * @param poll If you want to make a poll, specify the parameters of that poll!
	 * @returns An object with the topic you've made, and its first initial post (which uses your `text`)
	 * @scope forum.write
	 */
	async createForumTopic(forum_id: number, title: string, text: string, poll?: PollConfig): Promise<{topic: ForumTopic, post: ForumPost}> {
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
	async getForumTopicAndPosts(topic: {id: number} | ForumTopic, limit: number = 20, sort: "id_asc" | "id_desc" = "id_asc", first_post?: {id: number} | ForumPost,
	cursor_string?: string): Promise<{posts: ForumPost[], topic: ForumTopic, cursor_string: string}> {
		const start = sort === "id_asc" && first_post ? first_post.id : undefined
		const end = sort === "id_desc" && first_post ? first_post.id : undefined
		return await this.request("get", `forums/topics/${topic.id}`, {sort, limit, start, end, cursor_string})
	}

	/**
	 * Edit the title of a ForumTopic!
	 * @remarks Use `editForumPost` if you wanna edit the post at the top of the topic
	 * @param topic An object with the id of the topic in question
	 * @param new_title The new title of the topic
	 * @returns The edited ForumTopic
	 * @scope forum.write
	 */
	async editForumTopicTitle(topic: {id: number} | ForumTopic, new_title: string): Promise<ForumTopic> {
		return await this.request("put", `forums/topics/${topic.id}`, {forum_topic: {topic_title:  new_title}})
	}

	/**
	 * Edit a ForumPost! Note that it can be the initial one of a ForumTopic!
	 * @param post An object with the id of the post in question
	 * @param new_text The new content of the post (replaces the old content)
	 * @returns The edited ForumPost
	 * @scope forum.write
	 */
	async editForumPost(post: {id: number} | ForumPost, new_text: string): Promise<ForumPost> {
		return await this.request("put", `forums/posts/${post.id}`, {body: new_text})
	}
}
