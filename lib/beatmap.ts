import { Beatmapset } from "./beatmapset.js"
import { API, User } from "./index.js"
import { Rulesets, RankStatus, Mod } from "./misc.js"
import { Score } from "./score.js"

export interface Beatmap {
	beatmapset_id: number
	difficulty_rating: number
	id: number
	mode: keyof typeof Rulesets
	status: string
	total_length: number
	user_id: number
	version: string
}

export namespace Beatmap {
	export interface WithBeatmapset extends Beatmap {
		beatmapset: Beatmapset
	}

	interface WithChecksum extends Beatmap {
		checksum: string
	}

	export interface WithBeatmapsetChecksumMaxcombo extends WithBeatmapset, WithChecksum {
		max_combo: number
	}

	export interface Extended extends WithChecksum {
		accuracy: number
		ar: number
		bpm: number
		convert: boolean
		count_circles: number
		count_sliders: number
		count_spinners: number
		cs: number
		deleted_at: Date | null
		drain: number
		hit_length: number
		is_scoreable: boolean
		last_updated: Date
		mode_int: Rulesets
		passcount: number
		playcount: number
		ranked: RankStatus
		url: string
	}

	export namespace Extended {
		export interface WithFailtimes extends Extended {
			failtimes: {
				exit: number[]
				fail: number[]
			}
		}

		export interface WithMaxcombo extends Extended {
			max_combo: number
		}

		/** @obtainableFrom {@link API.getBeatmaps} */
		export interface WithFailtimesMaxcombo extends WithFailtimes, WithMaxcombo {}

		/** @obtainableFrom {@link API.getBeatmap} */
		export interface WithFailtimesBeatmapsetextended extends WithFailtimesMaxcombo {
			beatmapset: Beatmapset.Extended
		}
	}

	/** @obtainableFrom {@link API.getUserMostPlayed} */
	export interface Playcount {
		beatmap_id: number
		/** Playcount */
		count: number
		beatmap: Beatmap
		beatmapset: Beatmapset
	}

	/**
	 * @obtainableFrom
	 * {@link API.getBeatmapPack} /
	 * {@link API.getBeatmapPacks}
	 */
	export interface Pack {
		author: string
		date: Date
		name: string
		/** Are difficulty reduction mods unable to be used to clear this pack? (is `false` if you can use such mods) */
		no_diff_reduction: boolean
		ruleset_id: number | null,
		tag: string,
		url: string,
		beatmapsets?: Beatmapset.Extended[],
		user_completion_data?:{
			/** IDs of beatmapsets completed by the user (according to the requirements of the pack) */
			beatmapset_ids: number[],
			/** Whether all beatmapsets are completed by the user or not */
			completed: boolean
		}
	}

	export namespace Pack {
		/**
		 * Get data about a BeatmapPack using its tag!
		 * @param pack An object with the tag of the beatmappack you're trying to get
		 * @remarks Currently in https://osu.ppy.sh/beatmaps/packs, when hovering a pack, its link with its tag should show up on your browser's bottom left
		 */
		export async function getOne(this: API, pack: {tag: string} | Beatmap.Pack): Promise<Beatmap.Pack> {
			return await this.request("get", `beatmaps/packs/${pack.tag}`)
		}

		/**
		 * Get an Array of up to 100 BeatmapPacks of a specific type!
		 * @param type The type of the BeatmapPacks, defaults to "standard"
		 */
		export async function getMultiple(this: API, type: "standard" | "featured" | "tournament" | "loved" | "chart" | "theme" | "artist" = "standard"): Promise<Beatmap.Pack[]> {
			const response = await this.request("get", "beatmaps/packs", {type})
			return response.beatmap_packs
		}
	}

	/** @obtainableFrom {@link API.getBeatmapDifficultyAttributes} */
	export interface DifficultyAttributes {
		star_rating: number
		max_combo: number
	}

	export namespace DifficultyAttributes {
		/** @obtainableFrom {@link API.getBeatmapDifficultyAttributesOsu} */
		export interface Osu extends DifficultyAttributes {
			aim_difficulty: number
			speed_difficulty: number
			speed_note_count: number
			flashlight_difficulty: number
			slider_factor: number
			approach_rate: number
			overall_difficulty: number
		}

		/** @obtainableFrom {@link API.getBeatmapDifficultyAttributesTaiko} */
		export interface Taiko extends DifficultyAttributes {
			stamina_difficulty: number
			rhythm_difficulty: number
			colour_difficulty: number
			peak_difficulty: number
			great_hit_window: number
		}

		/** @obtainableFrom {@link API.getBeatmapDifficultyAttributesFruits} */
		export interface Fruits extends DifficultyAttributes {
			approach_rate: number
		}

		/** @obtainableFrom {@link API.getBeatmapDifficultyAttributesMania} */
		export interface Mania extends DifficultyAttributes {
			great_hit_window: number
			/**
			 * @remarks (2023-11-20) Doesn't exist anymore?
			 */
			score_multiplier?: number
		}

		export type Any = Osu | Taiko | Fruits | Mania

		/**
		 * Get various data about the difficulty of a beatmap!
		 * @remarks You may want to use getBeatmapDifficultyAttributesOsu (or Taiko or whatever) instead for better type safety
		 * @param beatmap The Beatmap in question
		 * @param mods (defaults to No Mod) (will ignore mod settings) Can be a bitset of mods, an array of mod acronyms ("DT" for DoubleTime), or an array of Mods
		 * @param ruleset (defaults to the ruleset the beatmap was intended for) Useful to specify if the beatmap is a convert
		 */
		export async function get(this: API, beatmap: {id: number} | Beatmap, mods?: Mod[] | string[] | number, ruleset?: Rulesets):
		Promise<Beatmap.DifficultyAttributes | Beatmap.DifficultyAttributes.Any> {
			const response = await this.request("post", `beatmaps/${beatmap.id}/attributes`, {ruleset_id: ruleset, mods})
			return response.attributes
		}

		/**
		 * Get various data about the difficulty of an osu! beatmap!
		 * @param beatmap The Beatmap in question
		 * @param mods (defaults to No Mod) (will ignore mod settings) Can be a bitset of mods, an array of mod acronyms ("DT" for DoubleTime), or an array of Mods
		 */
		export async function getOsu(this: API, beatmap: {id: number} | Beatmap, mods?: Mod[] | string[] | number): Promise<Beatmap.DifficultyAttributes.Osu> {
			return await this.getBeatmapDifficultyAttributes(beatmap, mods, Rulesets.osu) as Beatmap.DifficultyAttributes.Osu
		}

		/**
		 * Get various data about the difficulty of a taiko beatmap!
		 * @param beatmap The Beatmap in question
		 * @param mods (defaults to No Mod) (will ignore mod settings) Can be a bitset of mods, an array of mod acronyms ("DT" for DoubleTime), or an array of Mods
		 */
		export async function getTaiko(this: API, beatmap: {id: number} | Beatmap, mods?: Mod[] | string[] | number): Promise<Beatmap.DifficultyAttributes.Taiko> {
			return await this.getBeatmapDifficultyAttributes(beatmap, mods, Rulesets.taiko) as Beatmap.DifficultyAttributes.Taiko
		}
		/**
		 * Get various data about the difficulty of a ctb beatmap!
		 * @param beatmap The Beatmap in question
		 * @param mods (defaults to No Mod) (will ignore mod settings) Can be a bitset of mods, an array of mod acronyms ("DT" for DoubleTime), or an array of Mods
		 */
		export async function getFruits(this: API, beatmap: {id: number} | Beatmap, mods?: Mod[] | string[] | number): Promise<Beatmap.DifficultyAttributes.Fruits> {
			return await this.getBeatmapDifficultyAttributes(beatmap, mods, Rulesets.fruits) as Beatmap.DifficultyAttributes.Fruits
		}
		/**
		 * Get various data about the difficulty of a mania beatmap!
		 * @param beatmap The Beatmap in question
		 * @param mods (defaults to No Mod) (will ignore mod settings) Can be a bitset of mods, an array of mod acronyms ("DT" for DoubleTime), or an array of Mods
		 */
		export async function getMania(this: API, beatmap: {id: number} | Beatmap, mods?: Mod[] | string[] | number): Promise<Beatmap.DifficultyAttributes.Mania> {
			return await this.getBeatmapDifficultyAttributes(beatmap, mods, Rulesets.mania) as Beatmap.DifficultyAttributes.Mania
		}
	}

	/** @obtainableFrom {@link API.getBeatmapUserScore} */
	export interface UserScore {
		/** Value depends on the requested mode and mods! */
		position: number
		score: Score.WithUserBeatmap
	}

	export namespace UserScore {
		/**
		 * Get the score on a beatmap made by a specific user (with specific mods and on a specific ruleset if needed)
		 * @param beatmap The Beatmap the score was made on
		 * @param user The User who made the score
		 * @param mods The Mods used to make the score, defaults to any, you can use `["NM"]` to filter out scores with mods
		 * @param ruleset The Ruleset used to make the score, useful if it was made on a convert
		 * @returns An Object with the position of the score according to the specified Mods and Ruleset, and with the score itself
		 */
		export async function getOne(this: API, beatmap: {id: number} | Beatmap, user: {id: number} | User,
			mods?: string[], ruleset?: Rulesets): Promise<UserScore> {
			const mode = ruleset !== undefined ? Rulesets[ruleset] : undefined
			return await this.request("get", `beatmaps/${beatmap.id}/scores/users/${user.id}`, {mods, mode})
		}

		/**
		 * Get the scores on a beatmap made by a specific user (with the possibility to specify if the scores are on a convert)
		 * @param beatmap The Beatmap the scores were made on
		 * @param user The User who made the scores
		 * @param ruleset The Ruleset used to make the scores, defaults to the Ruleset the Beatmap was made for
		 */
		export async function getMultiple(this: API, beatmap: {id: number} | Beatmap, user: {id: number} | User, ruleset?: Rulesets): Promise<Score.Legacy[]> {
			const mode = ruleset !== undefined ? Rulesets[ruleset] : undefined
			const response = await this.request("get", `beatmaps/${beatmap.id}/scores/users/${user.id}/all`, {mode})
			return response.scores
		}
	}
	
	/** Get extensive beatmap data about whichever beatmap you want! */
	export async function lookup(this: API, query: {checksum?: string, filename?: string, id?: number | string}): Promise<Beatmap.Extended.WithFailtimesBeatmapsetextended> {
		if (query.id !== undefined) query.id = String(query.id)
		return await this.request("get", `beatmaps/lookup`, {...query})
	}

	/**
	 * Get extensive beatmap data about whichever beatmap you want!
	 * @param beatmap An object with the id of the beatmap you're trying to get
	 */
	export async function getOne(this: API, beatmap: {id: number} | Beatmap): Promise<Beatmap.Extended.WithFailtimesBeatmapsetextended> {
		return await this.request("get", `beatmaps/${beatmap.id}`)
	}

	/**
	 * Get extensive beatmap data for up to 50 beatmaps at once!
	 * @param beatmaps An array of beatmaps or of objects that have the id of the beatmaps you're trying to get
	 */
	export async function getMultiple(this: API, beatmaps: Array<{id: number} | Beatmap>): Promise<Beatmap.Extended.WithFailtimesMaxcombo[]> {
		const ids = beatmaps.map((beatmap) => beatmap.id)
		const response = await this.request("get", "beatmaps", {ids})
		return response.beatmaps
	}

	/**
	 * Get the top scores of a beatmap!
	 * @param beatmap The Beatmap in question
	 * @param include_lazer_scores Whether or not lazer scores should be included, defaults to true
	 * @param ruleset The Ruleset used to make the scores, useful if they were made on a convert
	 * @param mods (2023-11-16) Currently doesn't do anything
	 * @param type (2023-11-16) Currently doesn't do anything
	 */
	export async function getScores(this: API, beatmap: {id: number} | Beatmap, include_lazer_scores: boolean = true,
		ruleset?: Rulesets, mods?: string[], type?: string): Promise<Score.WithUser[]> {
		const mode = ruleset !== undefined ? Rulesets[ruleset] : undefined
		const response = await this.request("get", `beatmaps/${beatmap.id}/scores`, {mode, mods, legacy_only: Number(!include_lazer_scores), type})
		return response.scores
	}

	/**
	 * Get the top scores of a beatmap, in the "solo score" format lazer brought with it!
	 * More info on GitHub if needed https://github.com/ppy/osu-infrastructure/blob/master/score-submission.md
	 * @param beatmap The Beatmap in question
	 * @param ruleset The Ruleset used to make the scores, useful if they were made on a convert
	 * @param mods (2023-11-16) Currently doesn't do anything
	 * @param type (2023-11-16) Currently doesn't do anything
	 */
	export async function getSoloScores(this: API, beatmap: {id: number} | Beatmap, ruleset?: Rulesets, mods?: string[], type?: string): Promise<Score.Solo[]> {
		const mode = ruleset !== undefined ? Rulesets[ruleset] : undefined
		const response = await this.request("get", `beatmaps/${beatmap.id}/solo-scores`, {mode, mods, type})
		return response.scores
	}
}
