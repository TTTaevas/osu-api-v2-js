import { Beatmap, Beatmapset } from "./beatmap.js"
import { Rulesets } from "./misc.js"

export interface Score {
	id: number
	best_id: number
	user_id: number
	accuracy: number
	mods: any
	score: number
	max_combo: number
	perfect: any
	statistics: {
		count_50: number
		count_100: number
		count_300: number
		count_geki: number
		count_katu: number
		count_miss: number
	}
	passed: boolean
	pp: any
	rank: any
	created_at: Date
	mode: any
	mode_int: Rulesets
	replay: any
	beatmap?: Beatmap
	beatmapset?: Beatmapset
	rank_country?: any
	rank_global?: any
	weight?: any
	user?: any
	match?: any
}

export interface BeatmapUserScore {
	position: number
	score: Score
}

export interface BeatmapScores {
	scores: Score[]
	userScore: BeatmapUserScore | null
	user_score: BeatmapUserScore | null | undefined
}
