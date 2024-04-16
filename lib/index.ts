import fetch, { AbortError, FetchError } from "node-fetch"
import { WebSocket } from "ws"

import { User } from "./user.js"
import { Beatmap } from "./beatmap.js"
import { Beatmapset } from "./beatmapset.js"

import { Multiplayer } from "./multiplayer.js"
import { Score } from "./score.js"
import { Ranking } from "./ranking.js"
import { Event } from "./event.js"

import { Changelog } from "./changelog.js"
import { Forum } from "./forum.js"
import { WikiPage } from "./wiki.js"
import { NewsPost } from "./news.js"
import { Home } from "./home.js"
import { Scope, Spotlight } from "./misc.js"
import { Chat } from "./chat.js"
import { Comment } from "./comment.js"


export { User } from "./user.js"
export { Beatmap } from "./beatmap.js"
export { Beatmapset } from "./beatmapset.js"

export { Multiplayer } from "./multiplayer.js"
export { Score } from "./score.js"
export { Ranking } from "./ranking.js"
export { Event } from "./event.js"

export { Changelog } from "./changelog.js"
export { Forum } from "./forum.js"
export { WikiPage } from "./wiki.js"
export { NewsPost } from "./news.js"
export { Home } from "./home.js"
export { Ruleset, Mod, Scope, Spotlight } from "./misc.js"
export { Chat } from "./chat.js"
export { WebSocket } from "./websocket.js"
export { Comment } from "./comment.js"
	
/**
 * Some stuff doesn't have the right type to begin with, such as dates, which are being returned as strings, this fixes that
 * @param x Anything, but should be a string, an array that contains a string, or an object which has a string
 * @returns x, but with it (or what it contains) now having the correct type
 */
function correctType(x: any): any {
	const bannedProperties = [
		"name", "artist", "title", "location", "interests", "occupation", "twitter",
		"discord", "version", "author", "raw", "bbcode", "title", "message", "creator", "source"
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
 * @param server The API server (defaults to **https://osu.ppy.sh**, leave as is if you don't know exactly what you're doing)
 * @returns The link people should click on
 */
export function generateAuthorizationURL(client_id: number, redirect_uri: string, scopes: Scope[], server: string = "https://osu.ppy.sh"): string {
	const s = String(scopes).replace(/,/g, "%20")
	return `${server}/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${s}&response_type=code`
}

/** If the {@link API} throws an error, it should always be an {@link APIError}! */
export class APIError {
	/** The reason why things didn't go as expected */
	message: string
	/** The server to which the request was sent */
	server: string
	/** The type of resource that was requested from the server */
	endpoint: string
	/** The filters that were used to specify what resource was wanted */
	parameters: object
	/** The status code that was returned by the server, if there is one */
	status_code?: number
	/** The error that caused the api to throw an {@link APIError} in the first place, if there is one */
	original_error?: Error

	constructor(message: string, server: string, endpoint: string, parameters: object, status_code?: number, original_error?: Error) {
		this.message = message
		this.server = server
		this.endpoint = endpoint
		this.parameters = parameters
		this.status_code = status_code
		this.original_error = original_error
	}
}

/** You can create an API instance without directly providing an access_token by using {@link API.createAsync}! */
export class API {
	// ACCESS TOKEN STUFF

	access_token: string = ""

	/** Should always be "Bearer" */
	token_type: string = "Bearer"

	private _expires: Date = new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
	/** The expiration date of your access_token */
	get expires(): Date {
		return this._expires
	}
	set expires(date: Date) {
		this._expires = date
		this.updateRefreshTimeout()
	}


	// REFRESH TOKEN STUFF

	private _refresh_token?: string
	/**
	 * Valid for an unknown amount of time, allows you to get a new token without going through the Authorization Code Grant again!
	 * Use {@link API.refreshToken} to do that
	 */
	get refresh_token(): string | undefined {
		return this._refresh_token
	}
	set refresh_token(token: string | undefined) {
		this._refresh_token = token
		this.updateRefreshTimeout() // because the refresh token may be specified last
	}

	/** If true, upon failing a request due to a 401, it will use the `refresh_token` if it exists (defaults to **true**) */
	refresh_on_401: boolean = true
	
	private _refresh_on_expires: boolean = true
	/** If true, the application will silently use the `refresh_token` right before the `access_token` expires, as determined by `expires` (defaults to **true**) */
	get refresh_on_expires(): boolean {
		return this._refresh_on_expires
	}
	set refresh_on_expires(enabled: boolean) {
		this._refresh_on_expires = enabled
		this.updateRefreshTimeout()
	}

	private _refresh_timeout?: NodeJS.Timeout
	get refresh_timeout(): NodeJS.Timeout | undefined {
		return this._refresh_timeout
	}
	set refresh_timeout(timeout: NodeJS.Timeout) {
		// if a previous refresh_timeout already exists, clear it
		if (this._refresh_timeout) {
			clearTimeout(this._refresh_timeout)
		}

		this._refresh_timeout = timeout
		this._refresh_timeout.unref() // don't prevent exiting the program while this timeout is going on
	}


	// CLIENT INFO

	client: {
		id: number
		secret: string
	} = {id: 0, secret: ""}
	/**
	 * The base url of the server where the requests should land (defaults to **https://osu.ppy.sh**)
	 * @remarks For tokens, requests will be sent to the `oauth/token` route, other requests will be sent to the `api/v2` route
	 */
	server: string = "https://osu.ppy.sh"
	/** The osu! user id of the user who went through the Authorization Code Grant */
	user?: User["id"]
	/** The scopes your application have, assuming it acts as a user */
	scopes?: Scope[]


	// CLIENT CONFIGURATION

	/** Which events should be logged (defaults to **none**) */
	verbose: "none" | "errors" | "all" = "none"
	
	/**
	 * The maximum **amount of seconds** requests should take before returning an answer (defaults to **20**)
	 * @remarks 0 means no maximum, no timeout
	 */
	timeout: number = 20

	/** Configure how this instance should behave when it comes to automatically retrying a request */
	retry: {
		/** If true, doesn't retry under any circumstances (defaults to **false**) */
		disabled: boolean
		/** In seconds, how long should it wait until retrying? (defaults to **2**) */
		delay: number
		/** How many retries maximum before throwing an {@link APIError} (defaults to **5**) */
		maximum_amount: number
		/** Should it retry a request upon successfully refreshing the token due to `refresh_on_401` being `true`? (defaults to **true**) */
		on_automatic_refresh: boolean
		/** Should it retry a request if that request failed because it has been aborted by the `timeout`? (defaults to **false**) */
		on_timeout: boolean
		/** Upon failing a request and receiving a response, because of which received status code should the request be retried? (defaults to **[429]**) */
		on_status_codes: number[]
	} = {
		disabled: false,
		delay: 2,
		maximum_amount: 5,
		on_automatic_refresh: true,
		on_timeout: false,
		on_status_codes: [429]
	}
	

	/**
	 * **Please use {@link API.createAsync} instead of the default constructor** if you don't have at least an `access_token`!
	 * An API object without an `access_token` is pretty much useless!
	 */
	constructor(properties: Partial<API>) {
		// delete every property that is `undefined` so the class defaults aren't overwritten by `undefined`
		// for example, someone using `createAsync()` is extremely likely to leave `server` as `undefined`, which would call the constructor with that
		Object.keys(properties).forEach(key => (properties as {[index: string]: any})[key] === undefined ? delete (properties as {[index: string]: any})[key] : {})
		Object.assign(this, properties)
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
			/** The Application Callback URL; Where the User has been redirected to after saying "okay" to your application doing stuff */
			redirect_uri: string,
			/** The code that appeared as a GET argument when they got redirected to the Application Callback URl (`redirect_url`) */
			code: string
		},
		verbose?: "none" | "errors" | "all",
		server?: string,
		/** @remarks In **seconds** */
		timeout?: number
	): Promise<API> {
		const new_api = new API({
			client,
			verbose,
			server,
			timeout
		})

		return user ?
		await new_api.getAndSetToken({client_id: client.id, client_secret: client.secret, grant_type: "authorization_code",
		redirect_uri: user.redirect_uri, code: user.code}, new_api) :
		await new_api.getAndSetToken({client_id: client.id, client_secret: client.secret, grant_type: "client_credentials", scope: "public"}, new_api)
	}

	/** 
	 * Get a websocket to get WebSocket events from!
	 * @param server Where the "notification websocket/server" is
	 * (defaults to **the api's `server`'s protocol and a maximum of 1 subdomain being replaced by "wss://notify."** (so usually `wss://notify.ppy.sh`))
	*/
	public generateWebSocket(server: string = `${this.server.replace(/^\w*:\/\/(?:[A-Za-z0-9]+[.](?=[A-Za-z0-9]+[.]([A-Za-z0-9]+)$))?/g, "wss://notify.")}`):
	WebSocket {
		return new WebSocket(server, [], {
			headers: {
				"User-Agent": "osu-api-v2-js (https://github.com/TTTaevas/osu-api-v2-js)",
				"Authorization": `${this.token_type} ${this.access_token}`
			}
		})
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

	/** Add, remove, change the timeout used for refreshing the token automatically whenever certain properties change */
	private updateRefreshTimeout() {
		if (this.refresh_token && this.expires && this.refresh_on_expires) {
			const now = new Date()
			const ms = this.expires.getTime() - now.getTime()

			// Let's say that we used a refresh token *after* the expiration time, our refresh token would naturally get updated
			// However, if it is updated before the (local) expiration date is updated, then ms should be 0
			// This should mean that, upon using a refresh token, we would use our new refresh token instantly...
			// In other words, don't allow timeouts that would mean no timeout; refreshToken() exists for that
			if (ms <= 0) {
				return undefined
			}

			this.refresh_timeout = setTimeout(() => {
				try {
					this.refreshToken()
				} catch {}
			}, ms)
		} else if (this._refresh_timeout) {
			clearTimeout(this._refresh_timeout)
		}
	}

	/**
	 * Set most of an `api`'s properties, like tokens, token_type, scopes, expiration_date  
	 * @param body An Object with the client id & secret, grant_type, and stuff that depends of the grant_type
	 * @param api The `api` which will see its properties change
	 * @returns `api`, just in case, because in theory it should modify the original object
	 */
	private async getAndSetToken(body: {client_id: number, client_secret: string, grant_type: "authorization_code", redirect_uri: string, code: string}, api: API):
	Promise<API>;
	private async getAndSetToken(body: {client_id: number, client_secret: string, grant_type: "client_credentials", scope: "public"}, api: API): Promise<API>;
	private async getAndSetToken(body: {client_id: number, client_secret: string, grant_type: "refresh_token", refresh_token: string}, api: API): Promise<API>;
	private async getAndSetToken(body: {
		client_id: number,
		client_secret: string,
		grant_type: "authorization_code" | "client_credentials" | "refresh_token",
		redirect_uri?: string,
		code?: string
		refresh_token?: string	
	}, api: API): Promise<API> {
		const controller = new AbortController()
		const timer = this.timeout > 0 ? setTimeout(() => {
			controller.abort()
		}, this.timeout * 1000) : false

		const response = await fetch(`${this.server}/oauth/token`, {
			method: "post",
			headers: {
				"Accept": "application/json",
				"Content-Type": "application/json",
				"User-Agent": "osu-api-v2-js (https://github.com/TTTaevas/osu-api-v2-js)"
			},
			body: JSON.stringify(body),
			signal: controller.signal
		})
		.catch((e) => {
			throw new APIError("Failed to fetch a token", this.server, "oauth/token", body, undefined, e)
		})
		.finally(() => {
			if (timer) {
				clearTimeout(timer)
			}
		})

		const json: any = await response.json()
		if (!json.access_token) {
			this.log(true, "Unable to obtain a token! Here's what was received from the API:", json)
			throw new APIError("No token obtained", this.server, "oauth/token", body, response.status)
		}
		api.token_type = json.token_type
		if (json.refresh_token) {api.refresh_token = json.refresh_token}

		const token = json.access_token
		api.access_token = token

		const token_payload = JSON.parse(Buffer.from(token.substring(token.indexOf(".") + 1, token.lastIndexOf(".")), "base64").toString('ascii'))
		api.scopes = token_payload.scopes
		if (token_payload.sub && token_payload.sub.length) {api.user = Number(token_payload.sub)}
	
		const expiration_date = new Date()
		expiration_date.setSeconds(expiration_date.getSeconds() + json.expires_in)
		api.expires = expiration_date

		return api
	}

	/** @returns Whether or not the token has been refreshed */
	public async refreshToken(): Promise<boolean> {
		if (!this.refresh_token) {
			this.log(true, "Ignored an attempt at refreshing the access token despite not having a refresh token!")
			return false
		}

		const old_token = this.access_token
		try {
			await this.getAndSetToken(
			{client_id: this.client.id, client_secret: this.client.secret, grant_type: "refresh_token", refresh_token: this.refresh_token}, this)
			if (old_token !== this.access_token) {this.log(false, "The token has been refreshed!")}
		} catch(e) {
			this.log(true, "Failed to refresh the token :(", e)
		}

		return old_token !== this.access_token
	}

	/** Revoke your current token! Revokes the refresh token as well */
	public async revokeToken(): Promise<true> {
		await this.request("delete", "oauth/tokens/current")
		return true
	}

	/**
	 * The function that directly communicates with the API! Almost every functions of the API object uses this function!
	 * @param method The type of request, each endpoint uses a specific one (if it uses multiple, the intent and parameters become different)
	 * @param endpoint What comes in the URL after `api/`
	 * @param parameters The things to specify in the request, such as the beatmap_id when looking for a beatmap
	 * @param info Context given by a prior request
	 * @returns A Promise with the API's response
	 */
	public async request(method: "get" | "post" | "put" | "delete", endpoint: string,
	parameters: {[k: string]: any} = {}, info: {number_try: number, just_refreshed: boolean} = {number_try: 1, just_refreshed: false}): Promise<any> {
		let to_retry = false
		let error_object: Error | undefined
		let error_code: number | undefined
		let error_string = "none"

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

		// parameters are here if request is GET
		const url = `${this.server}/api/v2/${endpoint}` + (method === "get" ? "?" + (Object.entries(parameters).map((param) => {
			if (!Array.isArray(param[1])) {return `${param[0]}=${param[1]}`}
			return param[1].map((array_element) => `${param[0]}=${array_element}`).join("&")
		}).join("&")) : "")

		const controller = new AbortController()
		const timer = this.timeout > 0 ? setTimeout(() => {
			if (this.retry.on_timeout) {
				to_retry = true
			}
			controller.abort()
		}, this.timeout * 1000) : false

		const response = await fetch(url, {
			method,
			headers: {
				"Accept": "application/json",
				"Accept-Encoding": "gzip",
				"Content-Type": "application/json",
				"User-Agent": "osu-api-v2-js (https://github.com/TTTaevas/osu-api-v2-js)",
				"Authorization": `${this.token_type} ${this.access_token}`
			},
			body: method !== "get" ? JSON.stringify(parameters) : undefined, // parameters are here if request is NOT GET
			signal: controller.signal
		})
		.catch((error: AbortError | FetchError) => {
			this.log(true, error.message)
			error_object = error
			error_string = `${error.name} (${error.name === "FetchError" ? error.errno : error.type})`
		})
		.finally(() => {
			if (timer) {
				clearTimeout(timer)
			}
		})

		if (!response || !response.ok) {
			if (response) {
				error_code = response.status
				error_string = response.statusText

				if (this.retry.on_status_codes.includes(response.status)) {
					to_retry = true
				}

				if (response.status === 401) {
					if (this.refresh_on_401 && this.refresh_token && !info.just_refreshed) {
						this.log(true, "Server responded with status code 401, your token might have expired, I will attempt to refresh your token...")
						
						if (await this.refreshToken() && this.retry.on_automatic_refresh) {
							to_retry = true
							info.just_refreshed = true
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
				} else {
					this.log(true, "Server responded with status:", response.status, response.statusText)
				}
			}

			/**
			 * Under specific circumstances, we want to retry our request automatically
			 * However, spamming the server during the same second in any of these circumstances would be pointless
			 * So we wait for 1 to 5 seconds to make our request, 5 times maximum
			*/
			if (to_retry === true && this.retry.disabled === false && info.number_try < this.retry.maximum_amount) {
				this.log(true, `Will request again in ${this.retry.delay} seconds...`, `(Try #${info.number_try})`)
				await new Promise(res => setTimeout(res, this.retry.delay))
				return await this.request(method, endpoint, parameters, {number_try: info.number_try + 1, just_refreshed: info.just_refreshed})
			}

			throw new APIError(error_string, `${this.server}/api/v2`, endpoint, parameters, error_code, error_object)
		}

		this.log(false, response.statusText, response.status, {endpoint, parameters})
		// 204 means the request worked as intended and did not give us anything, so just return nothing
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


	// COMMENT STUFF

	/** {@inheritDoc Comment.getOne} @group Comment Functions */
	readonly getComment = Comment.getOne

	/** {@inheritDoc Comment.getMultiple} @group Comment Functions */
	readonly getComments = Comment.getMultiple


	// EVENT STUFF

	/** {@inheritDoc Event.getMultiple} @group Event Functions */
	readonly getEvents = Event.getMultiple


	// FORUM STUFF

	/** {@inheritDoc Forum.Topic.create} @group Forum Functions */
	readonly createForumTopic = Forum.Topic.create

	/** {@inheritDoc Forum.Topic.reply} @group Forum Functions */
	readonly replyForumTopic = Forum.Topic.reply

	/** {@inheritDoc Forum.Topic.editTitle} @group Forum Functions */
	readonly editForumTopicTitle = Forum.Topic.editTitle

	/** {@inheritDoc Forum.Post.edit} @group Forum Functions */
	readonly editForumPost = Forum.Post.edit

	/** {@inheritDoc Forum.getTopicAndPosts} @group Forum Functions */
	readonly getForumTopicAndPosts = Forum.getTopicAndPosts


	// HOME STUFF

	/** {@inheritDoc Home.Search.getUsers} @group Home Functions */
	readonly searchUser = Home.Search.getUsers

	/** {@inheritDoc Home.Search.getWikiPages} @group Home Functions */
	readonly searchWiki = Home.Search.getWikiPages


	// MULTIPLAYER STUFF

	/** {@inheritDoc Multiplayer.Room.getOne} @group Multiplayer Functions */
	readonly getRoom = Multiplayer.Room.getOne

	/** {@inheritDoc Multiplayer.Room.getOne} @group Multiplayer Functions */
	readonly getRooms = Multiplayer.Room.getMultiple

	/** {@inheritDoc Multiplayer.Room.getOne} @group Multiplayer Functions */
	readonly getRoomLeaderboard = Multiplayer.Room.Leader.getMultiple

	/** {@inheritDoc Multiplayer.Room.getOne} @group Multiplayer Functions */
	readonly getPlaylistItemScores = Multiplayer.Room.PlaylistItem.getScores

	/** {@inheritDoc Multiplayer.Room.getOne} @group Multiplayer Functions */
	readonly getMatch = Multiplayer.Match.getOne

	/** {@inheritDoc Multiplayer.Room.getOne} @group Multiplayer Functions */
	readonly getMatches = Multiplayer.Match.getMultiple


	// NEWS STUFF

	/** {@inheritDoc NewsPost.getOne} @group NewsPost Functions */
	readonly getNewsPost = NewsPost.getOne

	/** {@inheritDoc NewsPost.getMultiple} @group NewsPost Functions */
	readonly getNewsPosts = NewsPost.getMultiple


	// RANKING STUFF

	/** {@inheritDoc Ranking.getUser} @group Ranking Functions */
	readonly getUserRanking = Ranking.getUser

	/** {@inheritDoc Ranking.getCountry} @group Ranking Functions */
	readonly getCountryRanking = Ranking.getCountry

	/** {@inheritDoc Ranking.getKudosu} @group Ranking Functions */
	readonly getKudosuRanking = Ranking.getKudosu

	/** {@inheritDoc Ranking.getSpotlight} @group Ranking Functions */
	readonly getSpotlightRanking = Ranking.getSpotlight


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


	// WIKI STUFF

	/** {@inheritDoc WikiPage.getOne} @group WikiPage Functions */
	readonly getWikiPage = WikiPage.getOne

	
	// OTHER STUFF

	/** {@inheritDoc Spotlight.getAll} @group Other Functions */
	readonly getSpotlights = Spotlight.getAll

	/** {@inheritDoc Score.getReplay} @group Other Functions */
	readonly getReplay = Score.getReplay

	/**
	 * Get the backgrounds made and selected for this season or for last season!
	 * @returns When the season ended, and for each background, its URL and its artist
	 * @group Other Functions
	 */
	async getSeasonalBackgrounds(): Promise<{ends_at: Date, backgrounds: {url: string, user: User}[]}> {
		return await this.request("get", "seasonal-backgrounds")
	}
}
