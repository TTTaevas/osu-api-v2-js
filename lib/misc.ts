import { API } from "./index.js"

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

/**
 * A function that makes it easy to get the id from the argument of a function
 * @param arg The id or the object with the id
 * @returns The id
 */
export function getId(arg: number | {[key: string]: any}, property_name: string = "id"): number {
	return typeof arg === "number" ? arg : arg[property_name]
}
