import { adaptParametersForGETRequests, correctType } from "./misc.js"
import { Beatmap } from "./Beatmap.js"
import { Beatmapset } from "./Beatmapset.js"
import { Changelog } from "./Changelog.js"
import { Chat } from "./Chat.js"
import { Comment } from "./Comment.js"
import { Event } from "./Event.js"
import { Forum } from "./Forum.js"
import { Home } from "./Home.js"
import { Multiplayer } from "./Multiplayer.js"
import { NewsPost } from "./NewsPost.js"
import { Ranking } from "./Ranking.js"
import { Score } from "./Score.js"
import { Spotlight } from "./Spotlight.js"
import { User } from "./User.js"
import { WikiPage } from "./WikiPage.js"

export { Beatmap, Beatmapset, Changelog, Chat, Comment, Event, Forum, Home,
	Multiplayer, NewsPost, Ranking, Score, Spotlight, User, WikiPage }

export enum Ruleset {
	osu 	= 0,
	taiko 	= 1,
	fruits	= 2,
	mania 	= 3,
}

export type Mod = {
	acronym: string
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
export class APIError {
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
	) {}
}

/** You can create an API instance without directly providing an access_token by using {@link API.createAsync}! */
export class API {
	// CLIENT CREATION

	/**
	 * **Please use {@link API.createAsync} instead of the default constructor** if you don't have at least an {@link API.access_token}!
	 * An API object without an `access_token` is pretty much useless!
	 */
	constructor(properties: Partial<API>) {
		// delete every property that is `undefined` so the class defaults aren't overwritten by `undefined`
		// for example, someone using `createAsync()` is extremely likely to leave `server` as `undefined`, which would call the constructor with that
		Object.keys(properties)
			.forEach(key => properties[key as keyof API] === undefined ? delete properties[key as keyof API] : {})
		Object.assign(this, properties)
	}

	/**
	 * The normal way to create an API instance! Make sure to `await` it
	 * @param client_id The ID of your client, which you can get on https://osu.ppy.sh/home/account/edit#oauth
	 * @param client_secret The Secret of your client, which you can get or reset on https://osu.ppy.sh/home/account/edit#oauth
	 * @param user If the instance is supposed to represent a user, use their Authorization Code and the Application Callback URL of your application!
	 * @param settings Additional settings you'd like to specify now rather than later, check out the Accessors at https://osu-v2.taevas.xyz/classes/API.html
	 * @returns A promise with an API instance
	 */
	public static async createAsync(
		client_id: API["client_id"],
		client_secret: API["client_secret"],
		user?: {
			/** The Application Callback URL; Where the User has been redirected to after saying "okay" to your application doing stuff */
			redirect_uri: string,
			/** The code that appeared as a GET argument when they got redirected to the Application Callback URL (`redirect_uri`) */
			code: string
		},
		settings?: Partial<API>
	): Promise<API> {
		const new_api = new API({
			client_id,
			client_secret,
			...settings
		})

		return user ?
		await new_api.getAndSetToken({client_id, client_secret, grant_type: "authorization_code", redirect_uri: user.redirect_uri, code: user.code}, new_api) :
		await new_api.getAndSetToken({client_id, client_secret, grant_type: "client_credentials", scope: "public"}, new_api)
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
	/** Used by practically every method to interact with the {@link API.server} (defaults to **api/v2**) */
	get route_api() {return this._route_api}
	set route_api(route_api) {this._route_api = route_api}

	private _route_token: Array<string | number> = ["oauth", "token"]
	/** Used for getting an {@link API.access_token} and using your {@link API.refresh_token} (defaults to **oauth/token**) */
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
		"x-api-version": "20250316",
	}
	get headers() {return this._headers}
	set headers(headers) {this._headers = headers}

	private _user?: User["id"]
	/** The osu! user id of the user who went through the Authorization Code Grant */
	get user() {return this._user}
	set user(user) {this._user = user}


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

	private _retry_delay: number = 2
	/** In seconds, how long should it wait after a request failed before retrying? (defaults to **2**) */
	get retry_delay() {return this._retry_delay}
	set retry_delay(retry_delay) {this._retry_delay = retry_delay}

	private _retry_maximum_amount: number = 4
	/** 
	 * How many retries maximum before throwing an {@link APIError} (defaults to **4**)
	 * @remarks Pro tip: Set that to 0 to **completely** disable retries!
	 */
	get retry_maximum_amount() {return this._retry_maximum_amount}
	set retry_maximum_amount(retry_maximum_amount) {this._retry_maximum_amount = retry_maximum_amount}

	private _retry_on_automatic_token_refresh: boolean = true
	/** Should it retry a request upon successfully refreshing the token due to {@link API.refresh_token_on_401} being `true`? (defaults to **true**) */
	get retry_on_automatic_token_refresh() {return this._retry_on_automatic_token_refresh}
	set retry_on_automatic_token_refresh(retry_on_automatic_token_refresh) {this._retry_on_automatic_token_refresh = retry_on_automatic_token_refresh}

	private _retry_on_status_codes: number[] = [429]
	/** Upon failing a request and receiving a response, because of which received status code should the request be retried? (defaults to **[429]**) */
	get retry_on_status_codes() {return this._retry_on_status_codes}
	set retry_on_status_codes(retry_on_status_codes) {this._retry_on_status_codes = retry_on_status_codes}

	private _retry_on_timeout: boolean = false
	/** Should it retry a request if that request failed because it has been aborted by the {@link API.timeout}? (defaults to **false**) */
	get retry_on_timeout() {return this._retry_on_timeout}
	set retry_on_timeout(retry_on_timeout) {this._retry_on_timeout = retry_on_timeout}


	// ACCESS TOKEN STUFF

	private _access_token: string = ""
	/** The key that allows you to talk with the API */
	get access_token() {return this._access_token}
	set access_token(token) {this._access_token = token}

	private _token_type: string = "Bearer"
	/** Should always be "Bearer" */
	get token_type() {return this._token_type}
	set token_type(token) {this._token_type = token}

	private _expires: Date = new Date(new Date().getTime() + 24 * 60 * 60 * 1000) // in 24 hours
	/** The expiration date of your access_token */
	get expires() {return this._expires}
	set expires(date) {
		this._expires = date
		this.updateRefreshTokenTimer()
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
		const response = await fetch(`${this.server}/${this.route_token.join("/")}`, {
			method: "post",
			headers: this.headers,
			body: JSON.stringify(body),
			signal: this.timeout > 0 ? AbortSignal.timeout(this.timeout * 1000) : undefined
		})
		.catch((e) => {
			throw new APIError("Failed to fetch a token", this.server, "post", this.route_token, body, undefined, e)
		})

		const json: any = await response.json()
		if (!json.access_token) {
			this.log(true, "Unable to obtain a token! Here's what was received from the API:", json)
			throw new APIError("No token obtained", this.server, "post", this.route_token, body, response.status)
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

	/** 
	 * Revoke your current token! This revokes the refresh token as well
	 * @remarks Uses {@link API.route_api} instead of {@link API.route_token}, as normally expected by the server
	 */
	public async revokeToken(): Promise<void> {
		// Note that unlike when getting a token, we actually need to use the normal route to revoke a token for some reason
		return await this.request("delete", ["oauth", "tokens", "current"])
	}


	// REFRESH TOKEN STUFF

	private _refresh_token?: string
	/**
	 * Valid for an unknown amount of time, it allows you to get a new token without going through the Authorization Code Grant again!
	 * Use {@link API.refreshToken} to do that
	 */
	get refresh_token() {return this._refresh_token}
	set refresh_token(token) {
		this._refresh_token = token
		this.updateRefreshTokenTimer() // because the refresh token may be specified last
	}
	
	private _refresh_token_on_401: boolean = true
	/** If true, upon failing a request due to a 401, it will use the {@link API.refresh_token} if it exists (defaults to **true**) */
	get refresh_token_on_401() {return this._refresh_token_on_401}
	set refresh_token_on_401(refresh) {this._refresh_token_on_401 = refresh}
	
	private _refresh_token_on_expires: boolean = true
	/**
	 * If true, the application will silently use the {@link API.refresh_token} right before the {@link API.access_token} expires,
	 * as determined by {@link API.expires} (defaults to **true**)
	 */
	get refresh_token_on_expires() {return this._refresh_token_on_expires}
	set refresh_token_on_expires(enabled) {
		this._refresh_token_on_expires = enabled
		this.updateRefreshTokenTimer()
	}

	private _refresh_token_timer?: NodeJS.Timeout
	get refresh_token_timer(): API["_refresh_token_timer"] {return this._refresh_token_timer}
	set refresh_token_timer(timer: NodeJS.Timeout) {
		// if a previous one already exists, clear it
		if (this._refresh_token_timer) {
			clearTimeout(this._refresh_token_timer)
		}

		this._refresh_token_timer = timer
		this._refresh_token_timer.unref() // don't prevent exiting the program while this timeout is going on
	}

	/** Add, remove, change the timeout used for refreshing the token automatically whenever certain properties change */
	private updateRefreshTokenTimer() {
		if (this.refresh_token && this.expires && this.refresh_token_on_expires) {
			const now = new Date()
			const ms = this.expires.getTime() - now.getTime()

			// Let's say that we used a refresh token *after* the expiration time, our refresh token would naturally get updated
			// However, if it is updated before the (local) expiration date is updated, then ms should be 0
			// This should mean that, upon using a refresh token, we would use our new refresh token instantly...
			// In other words, don't allow timeouts that would mean no timeout; refreshToken() exists for that
			if (ms <= 0) {
				return undefined
			}

			this.refresh_token_timer = setTimeout(() => {
				try {
					this.refreshToken()
				} catch {}
			}, ms)
		} else if (this._refresh_token_timer) {
			clearTimeout(this._refresh_token_timer)
		}
	}

	/** @returns Whether or not the token has been refreshed */
	public async refreshToken(): Promise<boolean> {
		if (!this.refresh_token) {
			this.log(true, "Ignored an attempt at refreshing the access token despite not having a refresh token!")
			return false
		}

		const old_token = this.access_token
		try {
			await this.getAndSetToken({
				client_id: this.client_id, client_secret: this.client_secret, grant_type: "refresh_token", refresh_token: this.refresh_token
			}, this)
			if (old_token !== this.access_token) {this.log(false, "The token has been refreshed!")}
		} catch(e) {
			this.log(true, "Failed to refresh the token :(", e)
		}

		return old_token !== this.access_token
	}


	// OTHER METHODS

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
	 * You can use this to specify additional settings for the method you're going to call, such as `headers`, an `AbortSignal`, and more advanced things!
	 * @example
	 * ```ts
	 * const controller = new AbortController() // this controller can be used to abort any request that uses its signal!
	 * const user = await api.withSettings({signal: controller.signal}).getUser(7276846)
	 * ```
	 * @param additional_fetch_settings You may get more info at https://developer.mozilla.org/en-US/docs/Web/API/RequestInit#instance_properties
	 * @returns A special version of the `API` that changes how requests are done
	 */
	public withSettings(additional_fetch_settings: ChildAPI["additional_fetch_settings"]): ChildAPI {
		return new ChildAPI(this, additional_fetch_settings)
	}

	/**
	 * The function that directly communicates with the API! Almost every functions of the API object uses this function!
	 * @param method The type of request, each endpoint uses a specific one (if it uses multiple, the intent and parameters become different)
	 * @param endpoint What comes in the URL after `api/`, **DO NOT USE TEMPLATE LITERALS (`) OR THE ADDITION OPERATOR (+), put everything separately for type safety**
	 * @param parameters The things to specify in the request, such as the beatmap_id when looking for a beatmap
	 * @param settings Additional settings **to add** to the current settings of the `fetch()` request
	 * @param info Context given by a prior request
	 * @returns A Promise with the API's response
	 */
	public async request(method: "get" | "post" | "put" | "delete", endpoint: Array<string | number>, parameters: {[k: string]: any} = {},
	settings?: ChildAPI["additional_fetch_settings"], info: {number_try: number, just_refreshed: boolean} = {number_try: 1, just_refreshed: false}):
	Promise<any> {
		let to_retry = false
		let error_object: Error | undefined
		let error_code: number | undefined
		let error_message = "no error message available"

		const signals: AbortSignal[] = []
		if (settings?.signal) signals.push(settings.signal)
		if (this.timeout > 0) signals.push(AbortSignal.timeout(this.timeout * 1000))

		const second_slash = this.route_api.length ? "/" : "" // if the server **is** the route, don't have `//` between the server and the endpoint
		let url = `${this.server}/${this.route_api.join("/")}${second_slash}${endpoint.join("/")}`

		if (method === "get" && parameters) {
			// For GET requests specifically, requests need to be shaped in very particular ways
			// adaptParametersForGETRequests feels actually too long to fit in here
			const get_parameters = adaptParametersForGETRequests(parameters)

			// Let's add the parameters into the URL
			url += "?" + (Object.entries(get_parameters).map((param) => {
				if (!Array.isArray(param[1])) {return `${param[0]}=${param[1]}`}
				return param[1].map((array_element) => `${param[0]}=${array_element}`).join("&")
			}).join("&"))
		}

		const response = await fetch(url, {
			method,
			...settings, // has priority over what's above, but not over what's lower
			headers: {
				"Authorization": `${this.token_type} ${this.access_token}`,
				...this.headers,
				...settings?.headers // written that way, custom headers with (for example) only a user-agent would only overwrite the default user-agent
			},
			body: method !== "get" ? JSON.stringify(parameters) : undefined, // parameters are here if request is NOT GET
			signal: AbortSignal.any(signals)
		})
		.catch((error) => {
			if (error.name === "TimeoutError" && this.retry_on_timeout) to_retry = true
			this.log(true, error.message)
			error_object = error
			error_message = `${error.name} (${error.message ?? error.errno ?? error.type})`
		})

		if (!response || !response.ok) {
			if (response) {
				error_code = response.status
				error_message = response.statusText
				if (this.retry_on_status_codes.includes(response.status)) to_retry = true
				
				if (response.status === 401) {
					if (this.refresh_token_on_401 && this.refresh_token && !info.just_refreshed) {
						this.log(true, "Server responded with status code 401, your token might have expired, I will attempt to refresh your token...")
						
						if (await this.refreshToken() && this.retry_on_automatic_token_refresh) {
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
			 * However, instantly trying the request again even though it failed (or was made to failed) is usually not desirable
			 * So we wait a bit to make our request, repeat the process a few times if needed
			*/
			if (to_retry === true && info.number_try <= this.retry_maximum_amount) {
				this.log(true, `Will request again in ${this.retry_delay} seconds...`, `(going for retry #${info.number_try}/${this.retry_maximum_amount})`)
				await new Promise(res => setTimeout(res, this.retry_delay * 1000))
				return await this.request(method, endpoint, parameters, settings, {number_try: info.number_try + 1, just_refreshed: info.just_refreshed})
			}

			throw new APIError(error_message, `${this.server}/${this.route_api.join("/")}`, method, endpoint, parameters, error_code, error_object)
		}

		this.log(false, response.statusText, response.status, {method, endpoint, parameters})
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

	/** {@inheritDoc Beatmap.getSoloScores} @group Beatmap Methods */
	readonly getBeatmapSoloScores = Beatmap.getSoloScores

	/** {@inheritDoc Beatmap.getUserScore} @group Beatmap Methods */
	readonly getBeatmapUserScore = Beatmap.getUserScore

	/** {@inheritDoc Beatmap.getUserScores} @group Beatmap Methods */
	readonly getBeatmapUserScores = Beatmap.getUserScores

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

	/** {@inheritDoc Forum.getTopicAndPosts} @group Forum Methods */
	readonly getForumTopicAndPosts = Forum.getTopicAndPosts


	// HOME STUFF

	/** {@inheritDoc Home.Search.getUsers} @group Home Methods */
	readonly searchUser = Home.Search.getUsers

	/** {@inheritDoc Home.Search.getWikiPages} @group Home Methods */
	readonly searchWiki = Home.Search.getWikiPages


	// MULTIPLAYER STUFF

	/** {@inheritDoc Multiplayer.Room.getOne} @group Multiplayer Methods */
	readonly getRoom = Multiplayer.Room.getOne

	/** {@inheritDoc Multiplayer.Room.getMultiple} @group Multiplayer Methods */
	readonly getRooms = Multiplayer.Room.getMultiple

	/** {@inheritDoc Multiplayer.Room.Leader.getMultiple} @group Multiplayer Methods */
	readonly getRoomLeaderboard = Multiplayer.Room.Leader.getMultiple

	/** {@inheritDoc Multiplayer.Room.PlaylistItem.getScores} @group Multiplayer Methods */
	readonly getPlaylistItemScores = Multiplayer.Room.PlaylistItem.getScores

	/** {@inheritDoc Multiplayer.Match.getOne} @group Multiplayer Methods */
	readonly getMatch = Multiplayer.Match.getOne

	/** {@inheritDoc Multiplayer.Match.getMultiple} @group Multiplayer Methods */
	readonly getMatches = Multiplayer.Match.getMultiple


	// NEWS STUFF

	/** {@inheritDoc NewsPost.getOne} @group NewsPost Methods */
	readonly getNewsPost = NewsPost.getOne

	/** {@inheritDoc NewsPost.getMultiple} @group NewsPost Methods */
	readonly getNewsPosts = NewsPost.getMultiple


	// RANKING STUFF

	/** {@inheritDoc Ranking.getUser} @group Ranking Methods */
	readonly getUserRanking = Ranking.getUser

	/** {@inheritDoc Ranking.getCountry} @group Ranking Methods */
	readonly getCountryRanking = Ranking.getCountry

	/** {@inheritDoc Ranking.getKudosu} @group Ranking Methods */
	readonly getKudosuRanking = Ranking.getKudosu

	/** {@inheritDoc Ranking.getSpotlight} @group Ranking Methods */
	readonly getSpotlightRanking = Ranking.getSpotlight


	// SCORE STUFF

	/** {@inheritDoc Score.getReplay} @group Score Methods */
	readonly getReplay = Score.getReplay


	// SPOTLIGHT STUFF

	/** {@inheritDoc Spotlight.getAll} @group Spotlight Methods */
	readonly getSpotlights = Spotlight.getAll


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

	/** {@inheritDoc User.getMostPlayed} @group User Methods */
	readonly getUserMostPlayed = User.getMostPlayed

	/** {@inheritDoc User.getRecentActivity} @group User Methods */
	readonly getUserRecentActivity = User.getRecentActivity

	/** {@inheritDoc User.getKudosu} @group User Methods */
	readonly getUserKudosu = User.getKudosu

	/** {@inheritDoc User.getFriends} @group User Methods */
	readonly getFriends = User.getFriends


	// WIKI STUFF

	/** {@inheritDoc WikiPage.getOne} @group WikiPage Methods */
	readonly getWikiPage = WikiPage.getOne


	/**
	 * Get the backgrounds made and selected for this season or for last season!
	 * @returns When the season ended, and for each background, its URL and its artist
	 * @group Other Methods
	 */
	async getSeasonalBackgrounds(): Promise<{ends_at: Date, backgrounds: {url: string, user: User}[]}> {
		return await this.request("get", ["seasonal-backgrounds"])
	}
}

/**
 * Created with {@link API.withSettings}, this special version of the {@link API} specifies additional fetch settings to every request!
 * @remarks This **is not** to be used for any purpose other than calling methods; The original {@link ChildAPI.original} handles tokens & configuration
 */
export class ChildAPI extends API {
	/** The {@link API} where {@link API.withSettings} was used; this `ChildAPI` gets everything from it! */
	original: API
	/** The additional settings that are used for every request made by this object */
	additional_fetch_settings: Omit<RequestInit, "body">
	request = async (...args: Parameters<API["request"]>) => {
		args[3] ??= this.additional_fetch_settings // args[3] is `settings` **for now**
		return await this.original.request(...args)
	}

	// Those are first in accessors -> methods order, then in alphabetical order
	// For the sake of decent documentation and autocomplete
	/** @hidden @deprecated use API equivalent */
	get access_token() {return this.original.access_token}
	/** @hidden @deprecated use API equivalent */
	get client_id() {return this.original.client_id}
	/** @hidden @deprecated use API equivalent */
	get client_secret() {return this.original.client_secret}
	/** @hidden @deprecated use API equivalent */
	get expires() {return this.original.expires}
	/** @hidden @deprecated use API equivalent */
	get refresh_token_on_401() {return this.original.refresh_token_on_401}
	/** @hidden @deprecated use API equivalent */
	get refresh_token_on_expires() {return this.original.refresh_token_on_expires}
	/** @hidden @deprecated use API equivalent */
	get refresh_token_timer() {return this.original.refresh_token_timer}
	/** @hidden @deprecated use API equivalent */
	get refresh_token() {return this.original.refresh_token}
	/** @hidden @deprecated use API equivalent */
	get retry_delay() {return this.original.retry_delay}
	/** @hidden @deprecated use API equivalent */
	get retry_maximum_amount() {return this.original.retry_maximum_amount}
	/** @hidden @deprecated use API equivalent */
	get retry_on_automatic_token_refresh() {return this.original.retry_on_automatic_token_refresh}
	/** @hidden @deprecated use API equivalent */
	get retry_on_status_codes() {return this.original.retry_on_status_codes}
	/** @hidden @deprecated use API equivalent */
	get retry_on_timeout() {return this.original.retry_on_timeout}
	/** @hidden @deprecated use API equivalent */
	get route_api() {return this.original.route_api}
	/** @hidden @deprecated use API equivalent */
	get route_token() {return this.original.route_token}
	/** @hidden @deprecated use API equivalent */
	get scopes() {return this.original.scopes}
	/** @hidden @deprecated use API equivalent */
	get server() {return this.original.server}
	/** @hidden @deprecated use API equivalent */
	get timeout() {return this.original.timeout}
	/** @hidden @deprecated use API equivalent */
	get token_type() {return this.original.token_type}
	/** @hidden @deprecated use API equivalent */
	get user() {return this.original.user}
	/** @hidden @deprecated use API equivalent */
	get verbose() {return this.original.verbose}
	/** @hidden @deprecated use API equivalent */
	refreshToken = async () => {return await this.original.refreshToken()}
	/** @hidden @deprecated use API equivalent */
	revokeToken = async () => {return await this.original.revokeToken()}
	/** @hidden @deprecated use API equivalent */
	withSettings = (...args: Parameters<API["withSettings"]>) => {return this.original.withSettings(...args)}
	
	constructor(original: ChildAPI["original"], additional_fetch_settings: ChildAPI["additional_fetch_settings"]) {
		super({})

		this.original = original
		this.additional_fetch_settings = additional_fetch_settings
	}
}
