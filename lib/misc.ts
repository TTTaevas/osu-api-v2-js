import { API } from "./index.js"


// EXPORTED FOR PACKAGE USERS

/**
 * Scopes determine what the API instance can do as a user!
 * https://osu.ppy.sh/docs/index.html#scopes
 * @remarks "identify" is always implicity provided, **"public" is implicitly needed for almost everything!!**
 * The need for the "public" scope is only made explicit when the function can't be used unless the application acts as as a user (non-guest)
 */
export type Scope = "chat.read" | "chat.write" | "chat.write_manage" | "delegate" | "forum.write" | "friends.read" | "identify" | "public"

export type Mod = {
	acronym: string
	settings?: {[k: string]: any}
}

export enum Ruleset {
	osu 	= 0,
	taiko 	= 1,
	fruits	= 2,
	mania 	= 3
}

/** @obtainableFrom {@link API.getSpotlights} */
export interface Spotlight {
	id: number
	name: string
	start_date: Date
	end_date: Date
	type: string
	/** Pretty sure this is only `true` when the spotlight has different beatmaps for each ruleset */
	mode_specific: boolean
}

export namespace Spotlight {
	export interface WithParticipantcount extends Spotlight {
		participant_count: number
	}

	/**
	 * Get ALL legacy spotlights! (2009-2020, somewhat known as charts/ranking charts, available @ https://osu.ppy.sh/rankings/osu/charts)
	 * @remarks The data for newer spotlights (2020-, somewhat known as seasons) can be obtained through `getRoom()`
	 * but you can't really get the id of those newer spotlights without going through the website's URLs (https://osu.ppy.sh/seasons/latest) as far as I know :(
	 */
	export async function getAll(this: API): Promise<Spotlight[]> {
		const response = await this.request("get", "spotlights")
		return response.spotlights // It's the only property
	}
}


// PRIVATE TO PACKAGE USERS

/**
 * When using `fetch()` for a GET request, you can't just give the parameters the same way you'd give them for a POST request!
 * @param parameters The parameters as they'd be for a POST request (prior to using `JSON.stringify`)
 * @returns Parameters adapted for a GET request
 */
export function adaptParametersForGETRequests(parameters: {[k: string]: any}): {[k: string]: any} {
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

	return parameters
}

/**
 * Some stuff doesn't have the right type to begin with, such as dates, which are being returned as strings, this fixes that
 * @param x Anything, but should be a string, an array that contains a string, or an object which has a string
 * @returns x, but with it (or what it contains) now having the correct type
 */
export function correctType(x: any, force_string?: boolean): any {
	// those MUST be strings; turn the server's numbers into strings and keep the server's strings as strings
	const bannedProperties = [
		"name", "artist", "artist_unicode", "title", "title_unicode", "tags", "username", "location", "interests", "occupation", "twitter",
		"discord", "version", "display_version", "author", "raw", "bbcode", "message", "creator", "source"
	]
	if (force_string && typeof x !== "object") {
		return String(x)
	}

	if (typeof x === "boolean") {
		return x
	} else if (/^[+-[0-9][0-9]+-[0-9]{2}-[0-9]{2}($|[ T].*)/.test(x)) {
		if (/[0-9]{2}:[0-9]{2}:[0-9]{2}$/.test(x)) x += "Z"
		if (/[0-9]{2}:[0-9]{2}:[0-9]{2}\+[0-9]{2}:[0-9]{2}$/.test(x)) x = x.substring(0, x.indexOf("+")) + "Z"
		return new Date(x)
	} else if (Array.isArray(x)) {
		return x.map((e) => correctType(e, force_string))
	} else if (!isNaN(x) && x !== "") {
		return x === null ? null : Number(x)
	} else if (typeof x === "object" && x !== null) {
		const keys = Object.keys(x)
		const vals = Object.values(x)
		for (let i = 0; i < keys.length; i++) {
			x[keys[i]] = correctType(vals[i], bannedProperties.some((p) => keys[i] === p))
		}
	}

	return x
}

/**
 * This is an alternative to `AbortSignal.any` that is friendly to older versions of Node.js, it was provided by the kind https://github.com/baileyherbert
 * @param signals The multiple signals you'd want `fetch()` to take
 * @returns A signal that's aborted when any of the `signals` is aborted
 */
export function anySignal(signals: AbortSignal[]) {
	const controller = new AbortController()
	const unsubscribe: (() => void)[] = []

	function onAbort(signal: AbortSignal) {
		controller.abort(signal.reason)
		unsubscribe.forEach((f) => f())
	}

	for (const signal of signals) {
		if (signal.aborted) {
			onAbort(signal)
			break
		}

		const handler = onAbort.bind(undefined, signal)
		signal.addEventListener("abort", handler)
		unsubscribe.push(() => signal.removeEventListener("abort", handler))
	}

	return controller.signal
}

/**
 * A function that makes it easy to get the id from the argument of a function
 * @param arg The id or the object with the id
 * @returns The id
 */
export function getId(arg: number | {[key: string]: any}, property_name: string = "id"): number {
	return typeof arg === "number" ? arg : arg[property_name]
}
