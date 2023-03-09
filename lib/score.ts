import { BeatmapCompact, BeatmapsetCompact } from "./beatmap"
import { GameModes } from "./misc"

export interface Score {
	id: number
	best_id: number
	user_id: number
	accuracy: number
	mods: any
	score: number
	max_combo: number
	perfect: any
	["statistics.count_50"]: number
	["statistics.count_100"]: number
	["statistics.count_300"]: number
	["statistics.count_geki"]: number
	["statistics.count_katu"]: number
	["statistics.count_miss"]: number
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
