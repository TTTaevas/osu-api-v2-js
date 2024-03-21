import { Beatmapset } from "./beatmapset.js"
import { API, User } from "./index.js"
import { Rulesets, RankStatus, Mod, getId } from "./misc.js"
import { Score } from "./score.js"

export interface Beatmap {
	beatmapset_id: Beatmapset["id"]
	difficulty_rating: number
	id: number
	mode: keyof typeof Rulesets
	status: string
	total_length: number
	user_id: User["id"]
	version: string
}

export namespace Beatmap {
	/** 
	 * An interface to tell the API what kind of scores should be in an array returned by a function
	 * @group Parameter Object Interfaces
	 * @remarks Please note that some properties will be ignored by certain functions, check this in case of doubt: https://osu.ppy.sh/docs/index.html#beatmaps
	 */
	export interface Config {
		/** The Ruleset used to make the score, useful if it was made on a convert */
		ruleset?: Rulesets
		/** The Mods used to make the score, you can simply use `["NM"]` to filter out scores with mods (defaults to **any mods**, no scores filtered) */
		mods?: string[]
		/** "Beatmap score ranking type", whatever that means... */
		type?: string
		/** Exclude lazer scores? (defaults to **false**) */
		legacy_only?: boolean
	}

	export interface WithBeatmapset extends Beatmap {
		beatmapset: Beatmapset
	}

	export interface WithChecksum extends Beatmap {
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
		export interface WithFailtimesBeatmapset extends WithFailtimesMaxcombo {
			beatmapset: Beatmapset.Extended
		}
	}

	/** @obtainableFrom {@link API.getUserMostPlayed} */
	export interface Playcount {
		beatmap_id: Beatmap["id"]
		/** Playcount */
		count: number
		beatmap: Beatmap
		beatmapset: Beatmapset
	}

	/** @obtainableFrom {@link API.getBeatmapPacks} */
	export interface Pack {
		author: User["username"]
		date: Date
		name: string
		/** Are difficulty reduction mods unable to be used to clear this pack? (is `false` if you can use such mods) */
		no_diff_reduction: boolean
		ruleset_id: Rulesets | null,
		tag: string,
		url: string,
		user_completion_data?:{
			/** IDs of beatmapsets completed by the user (according to the requirements of the pack) */
			beatmapset_ids: Beatmapset["id"][],
			/** Whether all beatmapsets are completed by the user or not */
			completed: boolean
		}
	}
	
	export namespace Pack {
		/** @obtainableFrom {@link API.getBeatmapPack} */
		export interface WithBeatmapset extends Pack {
			beatmapsets: Beatmapset.Extended[]
		}

		/**
		 * Get data about a Beatmap.Pack using its tag!
		 * @param pack The Pack or the pack tag of the Pack you're trying to get
		 * @param legacy_only Should lazer scores be excluded from the pack's `user_completion_data`? (defaults to **false**)
		 * @remarks Currently in https://osu.ppy.sh/beatmaps/packs, when hovering a pack, its URL with its tag should be preview by your browser
		 */
		export async function getOne(this: API, pack: Pack["tag"] | Pack, legacy_only: boolean = false): Promise<Pack> {
			const tag = typeof pack === "string" ? pack : pack.tag
			return await this.request("get", `beatmaps/packs/${tag}`, {legacy_only})
		}

		/**
		 * Get an Array of up to 100 Beatmap.Packs of a specific type!
		 * @param type The type of the BeatmapPacks, defaults to "standard"
		 * @param cursor_string Use a response's `cursor_string` with the same parameters to get the next "page" of results!
		 */
		export async function getMultiple(this: API, type: "standard" | "featured" | "tournament" | "loved" | "chart" | "theme" | "artist" = "standard",
		cursor_string?: string): Promise<{beatmap_packs: Pack[], cursor_string: string | null}> {
			return await this.request("get", "beatmaps/packs", {type, cursor_string})
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
			/** @remarks API documentation says it exists, my thorough testing says it doesn't, so... */
			score_multiplier?: number
		}

		export type Any = Osu | Taiko | Fruits | Mania

		/**
		 * Get various data about the difficulty of a beatmap!
		 * @param beatmap The Beatmap in question
		 * @param mods Can be a bitset of mods, an array of mod acronyms, or an array of Mods (ignores mod settings) (defaults to **No Mod**)
		 * @param ruleset Useful to specify if the beatmap is a convert (defaults to **the ruleset the beatmap was intended for**)
		 * @remarks You may want to use api.getBeatmapDifficultyAttributesOsu (or Taiko or whatever) instead for better type safety
		 */
		export async function get(this: API, beatmap: Beatmap["id"] | Beatmap, mods?: Mod[] | string[] | number, ruleset?: Rulesets):
		Promise<DifficultyAttributes.Any> {
			const response = await this.request("post", `beatmaps/${getId(beatmap)}/attributes`, {ruleset_id: ruleset, mods})
			return response.attributes // It's the only property
		}

		/**
		 * Get various data about the difficulty of an osu! beatmap!
		 * @param beatmap The Beatmap in question
		 * @param mods Can be a bitset of mods, an array of mod acronyms, or an array of Mods (ignores mod settings) (defaults to **No Mod**)
		 */
		export async function getOsu(this: API, beatmap: Beatmap["id"] | Beatmap, mods?: Mod[] | string[] | number): Promise<DifficultyAttributes.Osu> {
			return await this.getBeatmapDifficultyAttributes(beatmap, mods, Rulesets.osu) as DifficultyAttributes.Osu
		}

		/**
		 * Get various data about the difficulty of a taiko beatmap!
		 * @param beatmap The Beatmap in question
		 * @param mods Can be a bitset of mods, an array of mod acronyms, or an array of Mods (ignores mod settings) (defaults to **No Mod**)
		 */
		export async function getTaiko(this: API, beatmap: Beatmap["id"] | Beatmap, mods?: Mod[] | string[] | number): Promise<DifficultyAttributes.Taiko> {
			return await this.getBeatmapDifficultyAttributes(beatmap, mods, Rulesets.taiko) as DifficultyAttributes.Taiko
		}
		/**
		 * Get various data about the difficulty of a ctb beatmap!
		 * @param beatmap The Beatmap in question
		 * @param mods Can be a bitset of mods, an array of mod acronyms, or an array of Mods (ignores mod settings) (defaults to **No Mod**)
		 */
		export async function getFruits(this: API, beatmap: Beatmap["id"] | Beatmap, mods?: Mod[] | string[] | number): Promise<DifficultyAttributes.Fruits> {
			return await this.getBeatmapDifficultyAttributes(beatmap, mods, Rulesets.fruits) as DifficultyAttributes.Fruits
		}
		/**
		 * Get various data about the difficulty of a mania beatmap!
		 * @param beatmap The Beatmap in question
		 * @param mods Can be a bitset of mods, an array of mod acronyms, or an array of Mods (ignores mod settings) (defaults to **No Mod**)
		 */
		export async function getMania(this: API, beatmap: Beatmap["id"] | Beatmap, mods?: Mod[] | string[] | number): Promise<DifficultyAttributes.Mania> {
			return await this.getBeatmapDifficultyAttributes(beatmap, mods, Rulesets.mania) as DifficultyAttributes.Mania
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
		 * @param config Specify the score's ruleset, the score's mods, prevent a lazer score from being returned **(`type` should not be supported)**
		 * @returns An Object with the position of the score according to the specified Mods and Ruleset, and with the score itself
		 */
		export async function getOne(this: API, beatmap: Beatmap["id"] | Beatmap, user: User["id"] | User, config?: Config): Promise<UserScore> {
			const mode = config?.ruleset !== undefined ? Rulesets[config.ruleset] : undefined
			return await this.request("get", `beatmaps/${getId(beatmap)}/scores/users/${getId(user)}`,
			{legacy_only: config?.legacy_only, mode, mods: config?.mods, type: config?.type})
		}

		/**
		 * Get the scores on a beatmap made by a specific user (with the possibility to specify if the scores are on a convert)
		 * @param beatmap The Beatmap the scores were made on
		 * @param user The User who made the scores
		 * @param config Specify the score's ruleset, prevent a lazer score from being returned **(`mods` and `type` should not be supported)**
		 */
		export async function getMultiple(this: API, beatmap: Beatmap["id"] | Beatmap, user: User["id"] | User, config?: Config): Promise<Score.Legacy[]> {
			const mode = config?.ruleset !== undefined ? Rulesets[config.ruleset] : undefined
			const response = await this.request("get", `beatmaps/${getId(beatmap)}/scores/users/${getId(user)}/all`,
			{legacy_only: config?.legacy_only, mode, mods: config?.mods, type: config?.type})
			return response.scores // It's the only property
		}
	}
	
	/** 
	 * Get extensive beatmap data about whichever beatmap you want!
	 * @param query What to specify in order to find the right beatmap
	*/
	export async function lookup(this: API, query: {checksum?: Beatmap.WithChecksum["checksum"], filename?: string, id?: Beatmap["id"]}):
	Promise<Extended.WithFailtimesBeatmapset> {
		return await this.request("get", `beatmaps/lookup`, {checksum: query.checksum, filename: query.filename, id: query.id ? String(query.id) : undefined})
	}

	/**
	 * Get extensive beatmap data about whichever beatmap you want!
	 * @param beatmap An object with the id of the beatmap you're trying to get
	 */
	export async function getOne(this: API, beatmap: Beatmap["id"] | Beatmap): Promise<Extended.WithFailtimesBeatmapset> {
		return await this.request("get", `beatmaps/${getId(beatmap)}`)
	}

	/**
	 * Get extensive beatmap data for up to 50 beatmaps at once!
	 * @param beatmaps An array of beatmaps or of objects that have the id of the beatmaps you're trying to get
	 */
	export async function getMultiple(this: API, beatmaps: Array<Beatmap["id"] | Beatmap>): Promise<Extended.WithFailtimesMaxcombo[]> {
		const ids = beatmaps.map((beatmap) => getId(beatmap))
		const response = await this.request("get", "beatmaps", {ids})
		return response.beatmaps // It's the only property
	}

	/**
	 * Get the top scores of a beatmap!
	 * @param beatmap The Beatmap in question
	 * @param config Specify the score's ruleset, mods, type, prevent a lazer score from being returned
	 * @remarks Please check if `mods` and `type` seem to be supported or not by the API: https://osu.ppy.sh/docs/index.html#get-beatmap-scores
	 */
	export async function getScores(this: API, beatmap: Beatmap["id"] | Beatmap, config?: Config): Promise<Score.WithUser[]> {
		const mode = config?.ruleset !== undefined ? Rulesets[config.ruleset] : undefined
		const response = await this.request("get", `beatmaps/${getId(beatmap)}/scores`,
		{legacy_only: config?.legacy_only, mode, mods: config?.mods, type: config?.type})
		return response.scores // It's the only property
	}

	/**
	 * Get the top scores of a beatmap, in the "solo score" format lazer brought with it!
	 * More info on GitHub if needed https://github.com/ppy/osu-infrastructure/blob/master/score-submission.md
	 * @param beatmap The Beatmap in question
	 * @param config Specify the score's ruleset, mods, type **(`legacy_only` should not be supported)**
	 * @remarks Please check if `mods` and `type` seem to be supported or not by the API: https://osu.ppy.sh/docs/index.html#get-beatmap-scores-non-legacy
	 */
	export async function getSoloScores(this: API, beatmap: Beatmap["id"] | Beatmap, config?: Config): Promise<Score.Solo[]> {
		const mode = config?.ruleset !== undefined ? Rulesets[config.ruleset] : undefined
		const response = await this.request("get", `beatmaps/${getId(beatmap)}/solo-scores`,
		{legacy_only: config?.legacy_only, mode, mods: config?.mods, type: config?.type})
		return response.scores // It's the only property
	}
}
