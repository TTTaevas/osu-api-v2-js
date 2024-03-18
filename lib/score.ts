import { Beatmap } from "./beatmap.js"
import { Beatmapset } from "./beatmapset.js"
import { API } from "./index.js"
import { Mod, Rulesets } from "./misc.js"
import { User } from "./user.js"

interface Bare {
	/** In a format where `96.40%` would be `0.9640` (likely with some numbers after the zero) */
	accuracy: number
	id: number | null
	max_combo: number
	mods: Mod[] | string[]
	passed: boolean
	/** Also known as a grade, for example this is `X` (SS) if `accuracy` is `1` (100.00%) */
	rank: string
	/** The ID of the user who made the score */
	user_id: number
	pp: number | null
	/** Can this score's replay be downloaded from the website? */
	replay: boolean
	type: string
}

export interface Score extends Bare {
	best_id: number | null
	/** @remarks Is null when Beatmap is Loved (for example) */
	pp: number | null
}

export namespace Score {
	/** All of its properties are optional because instead of being 0, the property actually disappears instead */
	export interface Statistics {
		great?: number
		ok?: number
		meh?: number
		miss?: number
		ignore_hit?: number
		ignore_miss?: number
		large_tick_hit?: number
		small_tick_hit?: number
		small_tick_miss?: number
		large_bonus?: number
		small_bonus?: number
		/** Exclusively for the `maximum_statistics` of solo-scores that were not set on lazer */
		legacy_combo_increase?: number
	}

	export interface Multiplayer extends Bare {
		/** In a format where `96.40%` would be `0.9640` **(and no number afterwards)** */
		accuracy: number
		beatmap_id: number
		ended_at: Date
		maximum_statistics: Statistics
		mods: Mod[]
		ruleset_id: number
		started_at: Date
		statistics: Statistics
		total_score: number
		playlist_item_id: number
		room_id: number
		id: number
		user: User.WithCountryCover
	}

	/**
	 * Scores called "solo-scores" are more relevant to lazer stuff, it's the opposite of legacy
	 * @obtainableFrom {@link API.getBeatmapSoloScores}
	 */
	export interface Solo extends Score {
		ranked: boolean
		preserve: boolean
		mods: Mod[]
		statistics: Statistics
		beatmap_id: number
		/** @remarks Is null if the score has not been set on lazer */
		build_id: number | null
		ended_at: Date
		has_replay: boolean
		is_perfect_combo: boolean
		legacy_perfect: boolean
		legacy_score_id: number | null
		legacy_total_score: number
		started_at: Date | null
		total_score: number
		user: User.WithCountryCover
		maximum_statistics?: Statistics
	}
	
	/**
	 * The version of Score without lazer-related stuff, used almost everywhere!
	 * @obtainableFrom {@link API.getBeatmapUserScores}
	 */
	export interface Legacy extends Score {
		mode: keyof typeof Rulesets
		mode_int: Rulesets
		mods: string[]
		score: number
		perfect: boolean
		created_at: Date
		statistics: {
			/** @remarks Is null if the score's gamemode is Taiko */
			count_50: number | null
			count_100: number
			count_300: number
			count_geki: number | null
			count_katu: number | null
			count_miss: number
		}
	}

	export interface WithMatch extends Legacy {
		match: {
			slot: number
			team: string
			pass: boolean
		}
	}

	/** @obtainableFrom {@link API.getBeatmapScores} */
	export interface WithUser extends Legacy {
		user: User.WithCountryCover
	}

	export interface WithUserBeatmap extends Legacy {
		user: User
		beatmap: Beatmap.Extended
	}

	/** @obtainableFrom {@link API.getUserScores} */
	export interface WithUserBeatmapBeatmapset extends WithUserBeatmap {
		beatmapset: Beatmapset
		/** @remarks Only if `type` is set to `best` on {@link API.getUserScores} */
		weight?: {
			percentage: number
			pp: number
		}
	}

	/**
	 * Get the replay for a score!
	 * @scope {@link Scope"public"}
	 * @param score The score that has created the replay
	 * @returns The correctly encoded content of what would be a replay file (you can just fs.writeFileSync with it!)
	 */
	export async function getReplay(this: API, score: {id: number} | Score): Promise<string> {
		return await this.request("get", `scores/${score.id}/download`)
	}
}
