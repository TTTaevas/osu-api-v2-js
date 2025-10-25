import { adaptParametersForGETRequests, correctType } from "./utilities.js"
import { Beatmap } from "./namespaces/Beatmap.js"
import { Beatmapset } from "./namespaces/Beatmapset.js"
import { Changelog } from "./namespaces/Changelog.js"
import { Chat } from "./namespaces/Chat.js"
import { Comment } from "./namespaces/Comment.js"
import { Event } from "./namespaces/Event.js"
import { Forum } from "./namespaces/Forum.js"
import { Home } from "./namespaces/Home.js"
import { Match } from "./namespaces/Match.js"
import { Miscellaneous } from "./namespaces/Miscellaneous.js"
import { Multiplayer } from "./namespaces/Multiplayer.js"
import { NewsPost } from "./namespaces/NewsPost.js"
import { Score } from "./namespaces/Score.js"
import { Spotlight } from "./namespaces/Spotlight.js"
import { User } from "./namespaces/User.js"
import { WikiPage } from "./namespaces/Wiki.js"

export { Beatmap, Beatmapset, Changelog, Chat, Comment, Event, Forum, Home,
	Match, Miscellaneous, Multiplayer, NewsPost, Score, Spotlight, User, WikiPage }

/** The name "Ruleset" is synonymous with "Game mode" or "Gamemode" */
export enum Ruleset {
	osu 	= 0,
	taiko 	= 1,
	/** Better known as "osu!catch" or "Catch the Beat", "fruits" is the name used throughout the API */
	fruits	= 2,
	mania 	= 3,
}

/** Also known as "Game Modifier" https://osu.ppy.sh/wiki/en/Gameplay/Game_modifier */
export type Mod = {
	acronym: string
	/** Lazer allows mods to be customized, applied customizations will appear here */
	settings?: {[k: string]: any}
}

/**
 * Scopes determine what the API instance can do as a user!
 * https://osu.ppy.sh/docs/index.html#scopes
 * @remarks "identify" is always implicity provided, **"public" is implicitly needed for almost everything!!**
 * The need for the "public" scope is only made explicit when the function can't be used unless the application acts as as a user (non-guest)
 */
export type Scope = "chat.read" | "chat.write" | "chat.write_manage" | "delegate" | "forum.write" | "friends.read" | "identify" | "public"

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
export class APIError extends Error {
	/**
	 * @param message The reason why things didn't go as expected
	 * @param server The server to which the request was sent
	 * @param method The method used for this request (like "get", "post", etc...)
	 * @param endpoint The type of resource that was requested from the server
	 * @param parameters The filters that were used to specify what resource was wanted
	 * @param status_code The status code that was returned by the server, if there is one
	 * @param original_error The error that caused the api to throw an {@link APIError} in the first place, if there is one
	 */
	constructor(
		public message: string,
		public server: API["server"],
		public method: Parameters<API["request"]>[0],
		public endpoint: Parameters<API["request"]>[1],
		public parameters: Parameters<API["request"]>[2],
		public status_code?: number,
		public original_error?: Error
	) {
		super()
		if (this.parameters?.client_secret) {this.parameters.client_secret = "<REDACTED>"}
		if (this.parameters?.refresh_token) {this.parameters.refresh_token = "<REDACTED>"}
	}
}

/** An API instance is needed to make requests to the server! */
export class API {
	// CLIENT CREATION & TOKENS

	/** If you have the credentials for a client and do not wish to act on behalf of a user, you might want to use this constructor */
	constructor(client_id: API["client_id"], client_secret: API["client_secret"], settings?: Partial<API>);
	/** If you have the credentials for a client as well as a code that allows to act on behalf of a user, you might want to use this constructor */
	constructor(client_id: API["client_id"], client_secret: API["client_secret"], redirect_uri: string, code: string, settings?: Partial<API>);
	/** If you'd like the freedom to set an {@link API.access_token} that you already have and avoid specifying client credentials, this constructor might be for you */
	constructor(settings: Partial<API>);
	constructor(client_id_or_settings: API["client_id"] | Partial<API>, client_secret?: API["client_secret"],
	redirect_uri_or_settings?: string | Partial<API>, code?: string, settings?: Partial<API>) {
		settings ??= (typeof redirect_uri_or_settings === "string" || !redirect_uri_or_settings) ?
			typeof client_id_or_settings === "number" ? undefined : client_id_or_settings : redirect_uri_or_settings

		if (settings) {
			/** Delete every property that is `undefined` so the class defaults aren't overwritten by `undefined` */
			Object.keys(settings).forEach((key) => {
				settings[key as keyof API] === undefined ? delete settings[key as keyof API] : {}
			})
			Object.assign(this, settings)
		}

		if (typeof client_id_or_settings === "number") this.client_id = client_id_or_settings
		if (client_secret) this.client_secret = client_secret

		/** We want to set a new token instantly if we have client credentials */
		if (this.set_token_on_creation && this.client_id > 0 && this.client_secret.length) {
			typeof redirect_uri_or_settings === "string" && code ?
				this.setNewToken({redirect_uri: redirect_uri_or_settings, code}) :
				this.setNewToken()
		}
	}

	private _access_token: string = ""
	/** The key that allows you to talk with the API */
	get access_token() {return this._access_token}
	set access_token(token) {this._access_token = token}

	private _refresh_token?: string
	/**
	 * Valid for an unknown amount of time, it allows you to get a new token without going through the Authorization Code Grant again!
	 * Use {@link API.setNewToken} to make use of this token
	 * @remarks There is no refresh_token if the Authorization Code Grant hasn't been done, it would be pointless to have one in that case
	 */
	get refresh_token() {return this._refresh_token}
	set refresh_token(token) {
		this._refresh_token = token
		this.updateTokenTimer() // because the refresh token may be specified last
	}

	private _token_type: string = "Bearer"
	/** Should always be "Bearer" */
	get token_type() {return this._token_type}
	set token_type(token) {this._token_type = token}

	private _expires: Date = new Date(new Date().getTime() + 24 * 60 * 60 * 1000) // 24 hours default, is set through setNewToken anyway
	/** The expiration date of your {@link API.access_token} */
	get expires() {return this._expires}
	set expires(date) {
		this._expires = date
		this.updateTokenTimer()
	}


	// CLIENT INFO

	private _client_id: number = 0
	/** The ID of your client, which you can get on https://osu.ppy.sh/home/account/edit#oauth */
	get client_id() {return this._client_id}
	set client_id(client_id) {this._client_id = client_id}

	private _client_secret: string = ""
	/** The Secret of your client, which you can get or reset on https://osu.ppy.sh/home/account/edit#oauth */
	get client_secret() {return this._client_secret}
	set client_secret(client_secret) {this._client_secret = client_secret}

	private _server: string = "https://osu.ppy.sh"
	/** The base url of the server where the requests should land (defaults to **https://osu.ppy.sh**) */
	get server() {return this._server}
	set server(server) {this._server = server}

	private _route_api: Array<string | number> = ["api", "v2"]
	/** Used by practically every method to interact with the {@link API.server} (defaults to **[api, v2]**) */
	get route_api() {return this._route_api}
	set route_api(route_api) {this._route_api = route_api}

	private _route_token: Array<string | number> = ["oauth", "token"]
	/** Used for getting an {@link API.access_token} and using your {@link API.refresh_token} (defaults to **[oauth, token]**) */
	get route_token() {return this._route_token}
	set route_token(route_token) {this._route_token = route_token}

	private _scopes: Scope[] = []
	/** The {@link Scope}s your application has, assuming it acts as a user */
	get scopes() {return this._scopes}
	set scopes(scopes) {this._scopes = scopes}

	private _headers: {[key: string]: any} = {
		"Accept": "application/json",
		"Accept-Encoding": "gzip",
		"Content-Type": "application/json",
		"User-Agent": "osu-api-v2-js (https://github.com/TTTaevas/osu-api-v2-js)",
		"x-api-version": "20251012",
	}
	/** Used in practically all requests, those are all the headers the package uses excluding `Authorization`, the one with the token */
	get headers() {return this._headers}
	set headers(headers) {this._headers = headers}

	private _user?: User["id"]
	/** The osu! user id of the user who went through the Authorization Code Grant */
	get user() {return this._user}
	set user(user) {this._user = user}

	private number_of_requests: number = 0


	// TOKEN HANDLING

	/** Has {@link API.setNewToken} been called and not yet returned anything? */
	private is_setting_token: boolean = false

	/** If {@link API.setNewToken} has been called, you can wait for it to be done through this promise */
	private token_promise: Promise<void> = new Promise(r => r)

	/**
	 * This creates a new {@link API.access_token}, alongside a new {@link API.refresh_token} if arguments are provided or if a refresh_token already exists
	 * @remarks The API object requires a {@link API.client_id} and a {@link API.client_secret} to successfully get any token
	 * @returns Whether or not the token has changed (**should be true** as otherwise the server would complain and an {@link APIError} would be thrown to give you some details)
	 */
	public async setNewToken(authorization?: {redirect_uri: string, code: string}): Promise<boolean> {
		const old_token = this.access_token
		this.is_setting_token = true

		this.token_promise = new Promise((resolve, reject) => {
			/// Request to the server
			const grant_type = authorization ? "authorization_code" : this.refresh_token ? "refresh_token" : "client_credentials"
			const body = {
				grant_type,
				client_id: this.client_id,
				client_secret: this.client_secret,
				refresh_token: this.refresh_token, // may be undefined, as expected from most grant_types
				scope: grant_type === "client_credentials" ? "public" : undefined,
				redirect_uri: authorization?.redirect_uri,
				code: authorization?.code,
			}

			this.fetch(true, "post", [], body)
			.then((response) => {
				response.json()
				.then((json: any) => {
					if (!json.access_token) {
						const error_message = json.error_description ?? json.message ?? "No token obtained" // Expect "Client authentication failed"
						this.log(true, "Unable to obtain a token! Here's what was received from the API:", json)
						reject(new APIError(error_message, this.server, "post", this.route_token, body, response.status))
					}
					this.token_type = json.token_type
					if (json.refresh_token) {this.refresh_token = json.refresh_token}

					const token = json.access_token
					this.access_token = token

					const token_payload = JSON.parse(Buffer.from(token.substring(token.indexOf(".") + 1, token.lastIndexOf(".")), "base64").toString('ascii'))
					this.scopes = token_payload.scopes
					if (token_payload.sub && token_payload.sub.length) {this.user = Number(token_payload.sub)}

					const expiration_date = new Date()
					expiration_date.setSeconds(expiration_date.getSeconds() + json.expires_in)
					this.expires = expiration_date

					resolve()
				})
			})
			.catch(reject) // reject the promise with the received error instead of throwing (is it even useful?)
		})


		await this.token_promise // Add the following for a no-throw behaviour: .catch(e => {})
		this.is_setting_token = false
		if (old_token !== this.access_token) this.log(false, "A new token has been set!")
		return old_token !== this.access_token
	}

	/**
	 * Revoke your current token! **This will revoke the {@link API.refresh_token} as well if it exists**, so use this with care
	 * @remarks Uses {@link API.route_api} instead of {@link API.route_token}, as normally expected by the server
	 */
	public async revokeToken(): Promise<void> {
		// Note that unlike when getting a token, we actually need to use the normal route to revoke a token for some reason
		return await this.request("delete", ["oauth", "tokens", "current"])
	}

	private _set_token_on_creation: boolean = true
	/** If true, when creating your API object, a call to {@link API.setNewToken} will be automatically made (defaults to **true**) */
	get set_token_on_creation() {return this._set_token_on_creation}
	set set_token_on_creation(bool) {this._set_token_on_creation = bool}

	private _set_token_on_401: boolean = true
	/** If true, upon failing a request due to a 401, it will call {@link API.setNewToken} (defaults to **true**) */
	get set_token_on_401() {return this._set_token_on_401}
	set set_token_on_401(bool) {this._set_token_on_401 = bool}

	private _set_token_on_expires: boolean = false
	/**
	 * If true, the application will silently call {@link API.setNewToken} when the {@link API.access_token} is set to expire,
	 * as determined by {@link API.expires} (defaults to **false**)
	 */
	get set_token_on_expires() {return this._set_token_on_expires}
	set set_token_on_expires(enabled) {
		this._set_token_on_expires = enabled
		this.updateTokenTimer()
	}

	private _token_timer?: NodeJS.Timeout
	get token_timer(): API["_token_timer"] {return this._token_timer}
	set token_timer(timer: NodeJS.Timeout) {
		// if a previous one already exists, clear it
		if (this._token_timer) {
			clearTimeout(this._token_timer)
		}

		this._token_timer = timer
		this._token_timer.unref() // don't prevent exiting the program while this timeout is going on
	}

	/** Add, remove, change the timeout used for setting a new token automatically whenever certain properties change */
	private updateTokenTimer() {
		if (this.expires && this.set_token_on_expires) {
			const now = new Date()
			const ms = this.expires.getTime() - now.getTime()

			/**
			 * Let's say that we used a refresh token *after* the expiration time, our refresh token would naturally get updated
			 * However, if it is updated before the (local) expiration date is updated, then ms should be 0
			 * This should mean that, upon using a refresh token, we would use our new refresh token instantly...
			 * In other words, don't allow timeouts that would mean no timeout; {@link API.setNewToken} exists for that
			 */
			if (ms <= 0) {
				return undefined
			}

			this.token_timer = setTimeout(() => {
				try {
					this.setNewToken()
				} catch {}
			}, ms)
		} else if (this._token_timer) {
			clearTimeout(this._token_timer)
		}
	}


	// CLIENT CONFIGURATION

	private _verbose?: "none" | "errors" | "all" = "none"
	/** Which events should be logged (defaults to **none**) */
	get verbose() {return this._verbose}
	set verbose(verbose) {this._verbose = verbose}

	private _timeout: number = 20
	/**
	 * The maximum **amount of seconds** requests should take before returning an answer (defaults to **20**)
	 * @remarks 0 means no maximum, no timeout
	 */
	get timeout() {return this._timeout}
	set timeout(timeout) {this._timeout = timeout}

	private _signal?: AbortSignal
	/** The `AbortSignal` used in every request */
	get signal() {return this._signal}
	set signal(signal) {this._signal = signal}


	// RETRIES

	private _retry_maximum_amount: number = 4
	/**
	 * How many retries maximum before throwing an {@link APIError} (defaults to **4**)
	 * @remarks Pro tip: Set that to 0 to **completely** disable retries!
	 */
	get retry_maximum_amount() {return this._retry_maximum_amount}
	set retry_maximum_amount(retry_maximum_amount) {this._retry_maximum_amount = retry_maximum_amount}

	private _retry_delay: number = 2
	/** In seconds, how long should it wait after a request failed before retrying? (defaults to **2**) */
	get retry_delay() {return this._retry_delay}
	set retry_delay(retry_delay) {this._retry_delay = retry_delay}

	private _retry_on_new_token: boolean = true
	/** Should it retry a request upon successfully setting a new token due to {@link API.set_token_on_401} being `true`? (defaults to **true**) */
	get retry_on_new_token() {return this._retry_on_new_token}
	set retry_on_new_token(retry_on_new_token) {this._retry_on_new_token = retry_on_new_token}

	private _retry_on_status_codes: number[] = [429]
	/** Upon failing a request and receiving a response, because of which received status code should the request be retried? (defaults to **[429]**) */
	get retry_on_status_codes() {return this._retry_on_status_codes}
	set retry_on_status_codes(retry_on_status_codes) {this._retry_on_status_codes = retry_on_status_codes}

	private _retry_on_timeout: boolean = false
	/** Should it retry a request if that request failed because it has been aborted by the {@link API.timeout}? (defaults to **false**) */
	get retry_on_timeout() {return this._retry_on_timeout}
	set retry_on_timeout(retry_on_timeout) {this._retry_on_timeout = retry_on_timeout}


	// OTHER METHODS

	/**
	 * Use this instead of `console.log` to log any information
	 * @param is_error Is the logging happening because of an error?
	 * @param to_log Whatever you would put between the parentheses of `console.log()`
	 */
	private log(is_error: boolean, ...to_log: any[]): void {
		if (this.verbose !== "none" && is_error === true) {
			console.error("osu!api v2 ->", ...to_log)
		} else if (this.verbose === "all") {
			console.log("osu!api v2 ->", ...to_log)
		}
	}

	/**
	 * Use this instead of a straight `fetch` to connect to the server
	 * @param is_token_related Is the request related to getting a token? If so, uses `route_token` and bypasses `token_promise`
	 * @param method The HTTP method https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods
	 * @param endpoint The endpoint, may or may not be listed on https://osu.ppy.sh/docs/
	 * @param parameters GET query in object form, or the request body if the method is not GET
	 * @param info Relevant only when `fetch` calls itself, avoid setting it
	 * @remarks Consider using the higher-level method called {@link API.request}
	 */
	private async fetch(is_token_related: boolean, method: "get" | "post" | "put" | "delete", endpoint: Array<string | number>,
	parameters: {[k: string]: any} = {}, info: {number_try: number, has_new_token: boolean} = {number_try: 1, has_new_token: false}): Promise<Response> {
		let to_retry = false
		let error_object: Error | undefined
		let error_code: number | undefined
		let error_message = "no error message available"

		const route = is_token_related ? this.route_token : this.route_api
		if (!is_token_related) await this.token_promise.catch(() => this.token_promise = new Promise(r => r))

		let url = `${this.server}/${route.join("/")}`
		if (route.length) url += "/" // if the server **is** the route, don't have `//` between the server and the endpoint
		url += endpoint.join("/")
		if (method === "get" && parameters) { // for GET requests specifically, requests need to be shaped in very particular ways
			url += "?" + (Object.entries(adaptParametersForGETRequests(parameters)).map((param) => {
				if (!Array.isArray(param[1])) {return `${param[0]}=${param[1]}`}
				return param[1].map((array_element) => `${param[0]}=${array_element}`).join("&")
			}).join("&"))
		}

		const signals: AbortSignal[] = []
		if (this.timeout > 0) signals.push(AbortSignal.timeout(this.timeout * 1000))
		if (this.signal && !is_token_related) signals.push(this.signal)

		const response = await fetch(url, {
			method,
			headers: {
				"Authorization": is_token_related ? undefined : `${this.token_type} ${this.access_token}`,
				...this.headers
			},
			body: method !== "get" ? JSON.stringify(parameters) : undefined, // parameters are here if method is NOT GET
			signal: AbortSignal.any(signals)
		})
		.catch((error) => {
			if (error.name === "TimeoutError" && this.retry_on_timeout) to_retry = true
			this.log(true, error.message)
			error_object = error
			error_message = `${error.name} (${error.message ?? error.errno ?? error.type})`
		})
		.finally(() => this.number_of_requests += 1)

		const request_id = `(${String(this.number_of_requests).padStart(8, "0")})`
		if (response) {
			if (parameters.client_secret) parameters.client_secret = "<REDACTED>"
			if (parameters.refresh_token) parameters.refresh_token = "<REDACTED>"
			this.log(this.verbose !== "none" && !response.ok, response.statusText, response.status, {method, endpoint, parameters}, request_id)

			if (!response.ok) {
				error_code = response.status
				error_message = response.statusText
				if (this.retry_on_status_codes.includes(response.status)) to_retry = true

				if (!is_token_related) {
					if (response.status === 401) {
						if (this.set_token_on_401 && !info.has_new_token) {
							if (!this.is_setting_token) {
								this.log(true, "Your token might have expired, I will attempt to get a new token...", request_id)
								if (await this.setNewToken() && this.retry_on_new_token) {
									to_retry = true
									info.has_new_token = true
								}
							} else {
								this.log(true, "A new token is currently being obtained!", request_id)
								if (this.retry_on_new_token) {
									to_retry = true
									info.has_new_token = true
								}
							}
						} else {
							this.log(true, "Maybe you need to do this action as a user?", request_id)
						}
					} else if (response.status === 403) {
						this.log(true, "You may lack the necessary scope for this action!", request_id)
					} else if (response.status === 422) {
						this.log(true, "You may be unable to use those parameters together!", request_id)
					} else if (response.status === 429) {
						this.log(true, "You're sending too many requests at once and are getting rate-limited!", request_id)
					}
				}
			}
		}

		if (to_retry === true && info.number_try <= this.retry_maximum_amount) {
			this.log(true, `Will request again in ${this.retry_delay} seconds...`, `(retry #${info.number_try}/${this.retry_maximum_amount})`, request_id)
			await new Promise(res => setTimeout(res, this.retry_delay * 1000))
			return await this.fetch(is_token_related, method, endpoint, parameters, {number_try: info.number_try + 1, has_new_token: info.has_new_token})
		}

		if (!response || !response.ok) {
			throw new APIError(error_message, `${this.server}/${route.join("/")}`, method, endpoint, parameters, error_code, error_object)
		}
		return response
	}

	/**
	 * The function that directly communicates with the API! Almost all functions of the API object uses this function!
	 * @param method The type of request, each endpoint uses a specific one (if it uses multiple, the intent and parameters become different)
	 * @param endpoint What comes in the URL after `api/`, **DO NOT USE TEMPLATE LITERALS (\`) OR THE ADDITION OPERATOR (+), put everything separately for type safety**
	 * @param parameters The things to specify in the request, such as the beatmap_id when looking for a beatmap
	 * @returns A Promise with the API's response
	 */
	public async request(method: "get" | "post" | "put" | "delete", endpoint: Array<string | number>, parameters: {[k: string]: any} = {}): Promise<any> {
		try {
			const response = await this.fetch(false, method, endpoint, parameters)
			if (response.status === 204) return undefined // 204 means the request worked as intended and did not give us anything, so just return nothing

			const arrBuff = await response.arrayBuffer()
			const buff = Buffer.from(arrBuff)

			try { // Assume the response is in JSON format as it often is, it'll fail into the catch block if it isn't anyway
				// My thorough testing leads me to believe nothing would change if the encoding was also "binary" here btw
				return correctType(JSON.parse(buff.toString("utf-8")))
			} catch { // Assume the response is supposed to not be in JSON format so return it as simple text
				return buff.toString("binary")
			}
		} catch(e: any) {
			if (e instanceof APIError) throw e
			// Manual testing leads me to believe a TimeoutError is possible after the request ended (while arrayBuffer() is going on, presumably)
			// Still no matter the Error, we want an APIError
			throw new APIError(`${e?.name} (${e?.message ?? e?.errno ?? e?.type})`, `${this.server}/${this.route_api.join("/")}`, method, endpoint, parameters, undefined, e)
		}
	}

	
	// BEATMAP STUFF

	/** {@inheritDoc Beatmap.lookup} @group Beatmap Methods */
	readonly lookupBeatmap = Beatmap.lookup

	/** {@inheritDoc Beatmap.getOne} @group Beatmap Methods */
	readonly getBeatmap = Beatmap.getOne

	/** {@inheritDoc Beatmap.getMultiple} @group Beatmap Methods */
	readonly getBeatmaps = Beatmap.getMultiple

	/** {@inheritDoc Beatmap.DifficultyAttributes.get} @group Beatmap Methods */
	readonly getBeatmapDifficultyAttributes = Beatmap.DifficultyAttributes.get

	/** {@inheritDoc Beatmap.DifficultyAttributes.getOsu} @group Beatmap Methods */
	readonly getBeatmapDifficultyAttributesOsu = Beatmap.DifficultyAttributes.getOsu

	/** {@inheritDoc Beatmap.DifficultyAttributes.getTaiko} @group Beatmap Methods */
	readonly getBeatmapDifficultyAttributesTaiko = Beatmap.DifficultyAttributes.getTaiko

	/** {@inheritDoc Beatmap.DifficultyAttributes.getFruits} @group Beatmap Methods */
	readonly getBeatmapDifficultyAttributesFruits = Beatmap.DifficultyAttributes.getFruits

	/** {@inheritDoc Beatmap.DifficultyAttributes.getMania} @group Beatmap Methods */
	readonly getBeatmapDifficultyAttributesMania = Beatmap.DifficultyAttributes.getMania

	/** {@inheritDoc Beatmap.getScores} @group Beatmap Methods */
	readonly getBeatmapScores = Beatmap.getScores

	/** {@inheritDoc Beatmap.getUserScore} @group Beatmap Methods */
	readonly getBeatmapUserScore = Beatmap.getUserScore

	/** {@inheritDoc Beatmap.getUserScores} @group Beatmap Methods */
	readonly getBeatmapUserScores = Beatmap.getUserScores

	/** {@inheritDoc Beatmap.UserTag.getAll} @group Beatmap Methods */
	readonly getBeatmapUserTags = Beatmap.UserTag.getAll

	/** {@inheritDoc Beatmap.Pack.getOne} @group Beatmap Methods */
	readonly getBeatmapPack = Beatmap.Pack.getOne

	/** {@inheritDoc Beatmap.Pack.getMultiple} @group Beatmap Methods */
	readonly getBeatmapPacks = Beatmap.Pack.getMultiple


	// BEATMAPSET STUFF

	/** {@inheritDoc Beatmapset.search} @group Beatmapset Methods */
	readonly searchBeatmapsets = Beatmapset.search

	/** {@inheritDoc Beatmapset.lookup} @group Beatmapset Methods */
	readonly lookupBeatmapset = Beatmapset.lookup

	/** {@inheritDoc Beatmapset.getOne} @group Beatmapset Methods */
	readonly getBeatmapset = Beatmapset.getOne

	/** {@inheritDoc Beatmapset.Discussion.getMultiple} @group Beatmapset Methods */
	readonly getBeatmapsetDiscussions = Beatmapset.Discussion.getMultiple

	/** {@inheritDoc Beatmapset.Discussion.Post.getMultiple} @group Beatmapset Methods */
	readonly getBeatmapsetDiscussionPosts = Beatmapset.Discussion.Post.getMultiple

	/** {@inheritDoc Beatmapset.Discussion.Vote.getMultiple} @group Beatmapset Methods */
	readonly getBeatmapsetDiscussionVotes = Beatmapset.Discussion.Vote.getMultiple

	/** {@inheritDoc Beatmapset.Event.getMultiple} @group Beatmapset Methods */
	readonly getBeatmapsetEvents = Beatmapset.Event.getMultiple


	// CHANGELOG STUFF
	
	/** {@inheritDoc Changelog.Build.lookup} @group Changelog Methods */
	readonly lookupChangelogBuild = Changelog.Build.lookup

	/** {@inheritDoc Changelog.Build.getOne} @group Changelog Methods */
	readonly getChangelogBuild = Changelog.Build.getOne

	/** {@inheritDoc Changelog.Build.getMultiple} @group Changelog Methods */
	readonly getChangelogBuilds = Changelog.Build.getMultiple

	/** {@inheritDoc Changelog.UpdateStream.getAll} @group Changelog Methods */
	readonly getChangelogStreams = Changelog.UpdateStream.getAll


	// CHAT STUFF

	/** {@inheritDoc Chat.keepAlive} @group Chat Methods */
	readonly keepChatAlive = Chat.keepAlive

	/** {@inheritDoc Chat.Message.getMultiple} @group Chat Methods */
	readonly getChatMessages = Chat.Message.getMultiple

	/** {@inheritDoc Chat.Message.send} @group Chat Methods */
	readonly sendChatMessage = Chat.Message.send

	/** {@inheritDoc Chat.Message.sendPrivate} @group Chat Methods */
	readonly sendChatPrivateMessage = Chat.Message.sendPrivate

	/** {@inheritDoc Chat.Channel.getOne} @group Chat Methods */
	readonly getChatChannel = Chat.Channel.getOne

	/** {@inheritDoc Chat.Channel.getAll} @group Chat Methods */
	readonly getChatChannels = Chat.Channel.getAll

	/** {@inheritDoc Chat.Channel.markAsRead} @group Chat Methods */
	readonly markChatChannelAsRead = Chat.Channel.markAsRead

	/** {@inheritDoc Chat.Channel.createPrivate} @group Chat Methods */
	readonly createChatPrivateChannel = Chat.Channel.createPrivate

	/** {@inheritDoc Chat.Channel.createAnnouncement} @group Chat Methods */
	readonly createChatAnnouncementChannel = Chat.Channel.createAnnouncement

	/** {@inheritDoc Chat.Channel.joinOne} @group Chat Methods */
	readonly joinChatChannel = Chat.Channel.joinOne

	/** {@inheritDoc Chat.Channel.leaveOne} @group Chat Methods */
	readonly leaveChatChannel = Chat.Channel.leaveOne

	/** {@inheritDoc Chat.Websocket.getHeaders} @group Chat Methods */
	readonly getChatWebsocketHeaders = Chat.Websocket.getHeaders

	/** {@inheritDoc Chat.Websocket.generate} @group Chat Methods */
	readonly generateChatWebsocket = Chat.Websocket.generate


	// COMMENT STUFF

	/** {@inheritDoc Comment.getOne} @group Comment Methods */
	readonly getComment = Comment.getOne

	/** {@inheritDoc Comment.getMultiple} @group Comment Methods */
	readonly getComments = Comment.getMultiple


	// EVENT STUFF

	/** {@inheritDoc Event.getMultiple} @group Event Methods */
	readonly getEvents = Event.getMultiple


	// FORUM STUFF

	/** {@inheritDoc Forum.getOne} @group Forum Methods */
	readonly getForum = Forum.getOne

	/** {@inheritDoc Forum.getMultiple} @group Forum Methods */
	readonly getForums = Forum.getMultiple

	/** {@inheritDoc Forum.Topic.getOne} @group Forum Methods */
	readonly getForumTopic = Forum.Topic.getOne

	/** {@inheritDoc Forum.Topic.getMultiple} @group Forum Methods */
	readonly getForumTopics = Forum.Topic.getMultiple

	/** {@inheritDoc Forum.Topic.create} @group Forum Methods */
	readonly createForumTopic = Forum.Topic.create

	/** {@inheritDoc Forum.Topic.reply} @group Forum Methods */
	readonly replyForumTopic = Forum.Topic.reply

	/** {@inheritDoc Forum.Topic.editTitle} @group Forum Methods */
	readonly editForumTopicTitle = Forum.Topic.editTitle

	/** {@inheritDoc Forum.Post.edit} @group Forum Methods */
	readonly editForumPost = Forum.Post.edit


	// HOME STUFF

	/** {@inheritDoc Home.Search.getUsers} @group Home Methods */
	readonly searchUser = Home.Search.getUsers

	/** {@inheritDoc Home.Search.getWikiPages} @group Home Methods */
	readonly searchWiki = Home.Search.getWikiPages


	// MATCH STUFF

	/** {@inheritDoc Match.getOne} @group Match Methods */
	readonly getMatch = Match.getOne

	/** {@inheritDoc Match.getMultiple} @group Match Methods */
	readonly getMatches = Match.getMultiple


	// MISCELLANEOUS STUFF

	/** {@inheritDoc Miscellaneous.Country.getRanking} @group Miscellaneous Methods */
	readonly getCountryRanking = Miscellaneous.Country.getRanking

	/** {@inheritDoc Miscellaneous.getSeasonalBackgrounds} @group Miscellaneous Methods */
	readonly getSeasonalBackgrounds = Miscellaneous.getSeasonalBackgrounds


	// MULTIPLAYER STUFF

	/** {@inheritDoc Multiplayer.Room.getOne} @group Multiplayer Methods */
	readonly getRoom = Multiplayer.Room.getOne

	/** {@inheritDoc Multiplayer.Room.getMultiple} @group Multiplayer Methods */
	readonly getRooms = Multiplayer.Room.getMultiple

	/** {@inheritDoc Multiplayer.Room.Leader.getMultiple} @group Multiplayer Methods */
	readonly getRoomLeaderboard = Multiplayer.Room.Leader.getMultiple

	/** {@inheritDoc Multiplayer.Room.PlaylistItem.getScores} @group Multiplayer Methods */
	readonly getPlaylistItemScores = Multiplayer.Room.PlaylistItem.getScores

	/** {@inheritDoc Multiplayer.Room.Event.getAll} @group Multiplayer Methods */
	readonly getRoomEvents = Multiplayer.Room.Event.getAll


	// NEWS STUFF

	/** {@inheritDoc NewsPost.getOne} @group NewsPost Methods */
	readonly getNewsPost = NewsPost.getOne

	/** {@inheritDoc NewsPost.getMultiple} @group NewsPost Methods */
	readonly getNewsPosts = NewsPost.getMultiple


	// SCORE STUFF

	/** {@inheritDoc Score.getOne} @group Score Methods */
	readonly getScore = Score.getOne

	/** {@inheritDoc Score.getSome} @group Score Methods */
	readonly getScores = Score.getSome

	/** {@inheritDoc Score.getReplay} @group Score Methods */
	readonly getReplay = Score.getReplay


	// SPOTLIGHT STUFF

	/** {@inheritDoc Spotlight.getAll} @group Spotlight Methods */
	readonly getSpotlights = Spotlight.getAll

	/** {@inheritDoc Spotlight.getRanking} @group Spotlight Methods */
	readonly getSpotlightRanking = Spotlight.getRanking


	// USER STUFF

	/** {@inheritDoc User.getResourceOwner} @group User Methods */
	readonly getResourceOwner = User.getResourceOwner

	/** {@inheritDoc User.getOne} @group User Methods */
	readonly getUser = User.getOne

	/** {@inheritDoc User.getMultiple} @group User Methods */
	readonly getUsers = User.getMultiple

	/** {@inheritDoc User.lookupMultiple} @group User Methods */
	readonly lookupUsers = User.lookupMultiple

	/** {@inheritDoc User.getScores} @group User Methods */
	readonly getUserScores = User.getScores

	/** {@inheritDoc User.getBeatmaps} @group User Methods */
	readonly getUserBeatmaps = User.getBeatmaps

	/** {@inheritDoc User.getPassedBeatmaps} @group User Methods */
	readonly getUserPassedBeatmaps = User.getPassedBeatmaps

	/** {@inheritDoc User.getMostPlayed} @group User Methods */
	readonly getUserMostPlayed = User.getMostPlayed

	/** {@inheritDoc User.getRecentActivity} @group User Methods */
	readonly getUserRecentActivity = User.getRecentActivity

	/** {@inheritDoc User.getRanking} @group User Methods */
	readonly getUserRanking = User.getRanking

	/** {@inheritDoc User.getFriends} @group User Methods */
	readonly getFriends = User.getFriends

	/** {@inheritDoc User.getFavouriteBeatmapsetsIds} @group User Methods */
	readonly getFavouriteBeatmapsetsIds = User.getFavouriteBeatmapsetsIds

	/** {@inheritDoc User.Kudosu.getHistory} @group User Methods */
	readonly getUserKudosuHistory = User.Kudosu.getHistory

	/** {@inheritDoc User.Kudosu.getRanking} @group User Methods */
	readonly getKudosuRanking = User.Kudosu.getRanking


	// WIKI STUFF

	/** {@inheritDoc WikiPage.getOne} @group WikiPage Methods */
	readonly getWikiPage = WikiPage.getOne
}
