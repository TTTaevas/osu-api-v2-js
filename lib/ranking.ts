import { Beatmapset } from "./beatmapset.js"
import { User } from "./user.js"

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
}

interface RankingsBare {
	cursor: {
		/** The number of the next page, is null if no more results are available */
		page: number | null
	}
	/** Total amount of elements available across all pages, not on this specific page! Maximum of 10000 */
	total: number
}

export namespace Rankings {
	/** @obtainableFrom {@link API.getUserRanking} */
	export interface User extends RankingsBare {
		ranking: User.Statistics.WithUser[]
	}

	/** @obtainableFrom {@link API.getCountryRanking} */
	export interface Country extends RankingsBare {
		ranking: {
			/** Same as `country.code` */
			code: string
			active_users: number
			play_count: number
			ranked_score: number
			performance: number
			country: {
				/** The country's ISO 3166-1 alpha-2 code! (France would be `FR`, United States `US`) */
				code: string
				name: string
			}
		}[]
	}

	/** @obtainableFrom {@link API.getSpotlightRanking} */
	export interface Spotlight {
		beatmapsets: Beatmapset.Extended[]
		ranking: User.Statistics.WithUser[]
		spotlight: Spotlight.WithParticipantcount
	}
}
