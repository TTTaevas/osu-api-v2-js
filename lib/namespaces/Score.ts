import { API, Beatmap, Beatmapset, Changelog, Mod, Ruleset, User } from "../index.js"

/** Common to older and newer formats */
interface Basic {
	/** In a format where `96.40%` would be `0.9640` **(and maybe some numbers afterwards)** */
	accuracy: number
	best_id: number | null
	/** Would be null if ScoreV2 on stable, for example */
	id: number | null
	max_combo: number
	mods: Mod[] | string[]
	passed: boolean
	/** Also known as a grade, for example this is `X` (SS) if `accuracy` is `1` (100.00%) */
	rank: string
	user_id: User["id"]
	/** @remarks Is null when Beatmap is Loved (for example) */
	pp: number | null
	replay: boolean
	/** Score format */
	type: string
}

/** @obtainableFrom {@link API.getBeatmapUserScores} */
export interface Score extends Basic {
	classic_total_score: number
	preserve: boolean
	ranked: boolean
	maximum_statistics: Score.Statistics
	mods: Mod[]
	statistics: Score.Statistics
	beatmap_id: Beatmap["id"]
	id: number
	/** @remarks Is null if the score has not been set on lazer */
	build_id: Changelog.Build["id"] | null
	ended_at: Date
	has_replay: boolean
	is_perfect_combo: boolean
	legacy_perfect: boolean
	/** @remarks Is null if the score has been set on lazer */
	legacy_score_id: number | null
	legacy_total_score: number
	ruleset_id: Ruleset
	started_at: Date | null
	total_score: number
	type: "solo_score"
	current_user_attributes: {
		pin: boolean | null
	}
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
		legacy_combo_increase?: number
	}

	/** @obtainableFrom {@link API.getUserScores} */
	export interface WithUserBeatmapBeatmapset extends Score {
		beatmap: Beatmap.Extended
		beatmapset: Beatmapset
		user: User
		/** @remarks Only if `type` is set to `best` on {@link API.getUserScores} */
		weight?: {
			percentage: number
			pp: number
		}
	}

	/** @obtainableFrom {@link API.getBeatmapScores} */
	export interface WithUser extends Score {
		user: User.WithCountryCover
	}

	/** @obtainableFrom {@link API.getBeatmapUserScore} */
	export interface WithUserBeatmap extends WithUser {
		user: User.WithCountryCoverTeam
		beatmap: Beatmap.Extended
	}
	
	/** The old version of scores, barely still used */
	export interface OldFormat extends Basic {
		mode: keyof typeof Ruleset
		mode_int: Ruleset
		mods: string[]
		score: number
		perfect: boolean
		statistics: {
			/** @remarks Is null if the score's gamemode/ruleset is Taiko */
			count_50: number | null
			count_100: number
			count_300: number
			count_geki: number | null
			count_katu: number | null
			count_miss: number
		}
	}

	/**
	 * Get the replay for a score!
	 * @scope {@link Scope"public"}
	 * @param score The score that has created the replay
	 * @returns The correctly encoded content of what would be a replay file (you can just fs.writeFileSync with it!)
	 */
	export async function getReplay(this: API, score: Score["id"] | Score): Promise<string> {
		const score_id = typeof score === "number" ? score : score.id
		return await this.request("get", ["scores", score_id, "download"])
	}
}
