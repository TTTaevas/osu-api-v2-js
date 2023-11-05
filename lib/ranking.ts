import { BeatmapsetExtended } from "./beatmap.js"
import { UserStatistics } from "./user.js"

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
	beatmapsets?: BeatmapsetExtended[]
	ranking: UserStatistics[]
	spotlight?: Spotlight
	total: number
}
