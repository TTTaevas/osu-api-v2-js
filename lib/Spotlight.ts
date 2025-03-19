import { API } from "./index.js"

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
	export interface WithParticipantcount extends Spotlight {
		participant_count: number
	}

	/**
	 * Get ALL legacy spotlights! (2009-2020, somewhat known as charts/ranking charts, available @ https://osu.ppy.sh/rankings/osu/charts)
	 * @remarks The data for newer spotlights (2020-2023, somewhat known as seasons) can be obtained through `getRoom()`
	 * but you can't really get the id of those newer spotlights without going through the website's URLs (https://osu.ppy.sh/seasons/latest) as far as I know :(
	 */
	export async function getAll(this: API): Promise<Spotlight[]> {
		const response = await this.request("get", ["spotlights"])
		return response.spotlights // It's the only property
	}
}
