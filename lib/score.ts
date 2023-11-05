import { BeatmapCompact, BeatmapsetCompact } from "./beatmap.js"
import { GameModes } from "./misc.js"

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
	passed: Boolean
	pp: any
	rank: any
	created_at: Date
	mode: any
	mode_int: GameModes
	replay: any
	beatmap?: BeatmapCompact
	beatmapset?: BeatmapsetCompact
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
