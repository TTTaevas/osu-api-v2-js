import { BeatmapExtended, Beatmapset } from "./beatmap.js"
import { Rulesets } from "./misc.js"
import { User, UserWithCountryCover } from "./user.js"

/**
 * Expected from api.getBeatmapUserScores()
 */
export interface Score {
	/**
	 * In a format where `96.40%` would be `0.9640` (likely with some numbers after the zero)
	 */
	accuracy: number
	best_id: number | null
	created_at: Date
	id: number
	max_combo: number
	mode: string
	mode_int: Rulesets
	mods: string[]
	passed: boolean
	perfect: boolean
	/**
	 * null when Beatmap is Loved (for example)
	 */
	pp: null | number
	/**
	 * Also known as a grade, for example this is `X` (SS) if `accuracy` is `1` (100.00%)
	 */
	rank: string
	/**
	 * Can this score's replay be downloaded from the website?
	 */
	replay: boolean
	score: number
	statistics: {
		count_50: number
		count_100: number
		count_300: number
		count_geki: number
		count_katu: number
		count_miss: number
	}
	type: string
	/**
	 * The ID of the user who made the score
	 */
	user_id: number
	/**
	 * @remarks Only if `type` is set to `best` on `getUserScores`
	 */
	weight?: {
		percentage: number
		pp: number
	}
}

/**
 * Expected from Match
 */
export interface ScoreWithMatch extends Score {
	match: {
		slot: number
		team: string
		pass: boolean
	}
}

/**
 * Expected from api.getBeatmapScores()
 */
export interface ScoreWithUser extends Score {
	user: UserWithCountryCover
}

/**
 * Expected from BeatmapUserScore
 * @privateRemarks Doesn't extend ScoreWithUser as the User here lacks Country and Cover
 */
export interface ScoreWithUserBeatmap extends Score {
	user: User
	beatmap: BeatmapExtended
}

/**
 * Expected from api.getUserScores()
 */
export interface ScoreWithUserBeatmapBeatmapset extends ScoreWithUserBeatmap {
	beatmapset: Beatmapset
}

/**
 * Expected from api.getBeatmapUserScore()
 */
export interface BeatmapUserScore {
	/**
	 * Value depends on the requested mode and mods!
	 */
	position: number
	score: ScoreWithUserBeatmap
}
