import { BeatmapsetExtended } from "./beatmap.js"
import { UserStatisticsWithUser } from "./user.js"

export interface Spotlight {
	id: number
	name: string
	start_date: Date
	end_date: Date
	type: string
	mode_specific: boolean
	participant_count?: number
}

export interface Rankings {
	ranking: UserStatisticsWithUser[]
	/**
	 * Total amount of users available across all pages, not on this specific page! Maximum of 10000
	 */
	total: number
	cursor: {
		/**
		 * The number of the next page, is null if no more results are available
		 */
		page: number | null
	}
	beatmapsets?: BeatmapsetExtended[]
	spotlight?: Spotlight
}
