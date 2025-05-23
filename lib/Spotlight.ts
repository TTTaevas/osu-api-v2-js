import { API, Beatmapset, Ruleset, User } from "./index.js"

/** @obtainableFrom {@link API.getSpotlights} */
export interface Spotlight {
	id: number
	name: string
	start_date: Date
	end_date: Date
	/** @privateRemarks Don't ask me why there is a `spotlight` type for Spotlights... */
	type: "bestof" | "monthly" | "special" | "spotlight" | "theme"
	/** Pretty sure this is only `true` when the spotlight has different beatmaps for each ruleset */
	mode_specific: boolean
}

export namespace Spotlight {
	export interface Ranking {
		beatmapsets: Beatmapset.Extended[]
		ranking: User.Statistics.WithUser[]
		spotlight: Spotlight.WithParticipantcount
	}

	export interface WithParticipantcount extends Spotlight {
		participant_count: number
	}

	/**
	 * Get the rankings of a spotlight from 2009 to 2020 on a specific ruleset!
	 * @param ruleset Each spotlight has a different ranking (and often maps) depending on the ruleset
	 * @param spotlight The spotlight in question
	 * @param filter What kind of players do you want to see? Keep in mind `friends` has no effect if no authorized user (defaults to **all**)
	 */
	export async function getRanking(this: API, ruleset: Ruleset, spotlight: Spotlight["id"] | Spotlight, filter: "all" | "friends" = "all"):
	Promise<Ranking> {
		spotlight = typeof spotlight === "number" ? spotlight : spotlight.id
		return await this.request("get", ["rankings", Ruleset[ruleset], "charts"], {spotlight, filter})
	}

	/**
	 * Get ALL legacy spotlights! (2009-2020, somewhat known as charts/ranking charts, available @ https://osu.ppy.sh/rankings/osu/charts)
	 * @remarks The data for newer spotlights (2020 onwards, somewhat known as seasons) can be obtained through `getRoom()`
	 * but you can't really get the id of those newer spotlights without going through the website's URLs (https://osu.ppy.sh/seasons/latest) as far as I know :(
	 */
	export async function getAll(this: API): Promise<Spotlight[]> {
		const response = await this.request("get", ["spotlights"])
		return response.spotlights // It's the only property
	}
}
