import { API, Beatmapset, Mod, Ruleset, Score, User } from "../index.js"

export interface Beatmap {
	beatmapset_id: Beatmapset["id"]
	difficulty_rating: number
	id: number
	mode: keyof typeof Ruleset
	status: string
	total_length: number
	user_id: User["id"]
	/** The name of the difficulty, maybe something like "Someone's Insane" */
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
		ruleset?: Ruleset
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
		/**
		 * @privateRemarks I had a single instance of this being null, on beatmap 2124608, specifically on the dev server (it's okay on osu server)
		 * For the sake of convenience, I cross my fingers that I won't regret not marking this as potentially null
		 */
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
		mode_int: Ruleset
		passcount: number
		playcount: number
		ranked: Beatmapset.RankStatus
		url: string
	}

	export namespace Extended {
		export interface WithFailtimesOwners extends Extended {
			failtimes: {
				exit: number[]
				fail: number[]
			}
			owners: Array<{
				id: User["id"]
				/** @remarks Users that are no longer visible will have the username set to `[deleted user]` */
				username: User["username"]
			}>
		}

		export interface WithMaxcombo extends Extended {
			max_combo: number
		}

		/** @obtainableFrom {@link API.getBeatmaps} */
		export interface WithFailtimesOwnersMaxcombo extends WithFailtimesOwners, WithMaxcombo {}

		/**
		 * @obtainableFrom
		 * {@link API.getBeatmap} /
		 * {@link API.lookupBeatmap}
		 */
		export interface WithFailtimesOwnersMaxcomboBeatmapset extends WithFailtimesOwnersMaxcombo {
			beatmapset: Beatmapset.Extended
		}

		/**
		 * @obtainableFrom
		 * {@link API.getBeatmapset} /
		 * {@link API.lookupBeatmapset}
		 */
		export interface WithFailtimesOwnersMaxcomboToptagids extends WithFailtimesOwnersMaxcombo {
			/** Objects with the ids of the tags that have been voted by users for this Beatmap! */
			top_tag_ids: {
				tag_id: UserTag["id"]
				count: number
			}[]
			/**
			 * The ids of the tags that have been voted by the authenticated user for this Beatmap!
			 * @remarks Unusually, if there is no authenticated user, this is an empty array (it exists and is not null)
			 */
			current_user_tag_ids: UserTag["id"][]
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

	/** @obtainableFrom {@link API.getBeatmapUserTags} */
	export interface UserTag {
		id: number
		name: string
		ruleset_id: Ruleset | null
		description: string
	}

	export namespace UserTag {
		/**
		 * @obtainableFrom
		 * {@link API.getBeatmapset} /
		 * {@link API.lookupBeatmapset}
		 */
		export interface WithDates extends UserTag {
			created_at: Date | null
			updated_at: Date | null
		}

		/**
		 * Get all the UserTags that currently exist in the game!
		 * @returns An Array of UserTags
		 */
		export async function getAll(this: API): Promise<UserTag[]> {
			const response = await this.request("get", ["tags"])
			return response.tags // It's the only property
		}
	}

	/** @obtainableFrom {@link API.getBeatmapPacks} */
	export interface Pack {
		author: User["username"]
		date: Date
		name: string
		/** Are difficulty reduction mods unable to be used to clear this pack? (is `false` if you can use such mods) */
		no_diff_reduction: boolean
		ruleset_id: Ruleset | null
		tag: string
		/** Download page; going there with a web browser should start the download of a zip file automatically */
		url: string
		/** Not there if the application doesn't act as a specific user */
		user_completion_data?: {
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
		export async function getOne(this: API, pack: Pack["tag"] | Pack, legacy_only: boolean = false): Promise<Pack.WithBeatmapset> {
			const tag = typeof pack === "string" ? pack : pack.tag
			return await this.request("get", ["beatmaps", "packs", tag], {legacy_only: Number(legacy_only)})
		}

		/**
		 * Get an Array of up to 100 Beatmap.Packs of a specific type!
		 * @param type The type of the BeatmapPacks (defaults to **standard**)
		 * @param cursor_string Use a response's `cursor_string` with the same parameters to get the next "page" of results!
		 */
		export async function getMultiple(this: API, type: "standard" | "featured" | "tournament" | "loved" | "chart" | "theme" | "artist" = "standard",
		cursor_string?: string): Promise<{beatmap_packs: Pack[], cursor_string: string | null}> {
			return await this.request("get", ["beatmaps", "packs"], {type, cursor_string})
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
			aim_difficult_slider_count: number
			speed_difficulty: number
			speed_note_count: number
			slider_factor: number
			aim_difficult_strain_count: number
			speed_difficult_strain_count: number
		}

		/** @obtainableFrom {@link API.getBeatmapDifficultyAttributesTaiko} */
		export interface Taiko extends DifficultyAttributes {
			mono_stamina_factor: number
		}

		/**
		 * @obtainableFrom {@link API.getBeatmapDifficultyAttributesFruits}
		 * @remarks Since the pp update of 2025-03-06, no property exclusive to this Ruleset exists
		 */
		export interface Fruits extends DifficultyAttributes {}

		/**
		 * @obtainableFrom {@link API.getBeatmapDifficultyAttributesMania}
		 * @remarks Since the pp update of 2025-03-06, no property exclusive to this Ruleset exists
		 */
		export interface Mania extends DifficultyAttributes {
			/** @remarks This seems to be about the max_combo with **Classic mod or Stable (non-lazer) client** */
			max_combo: number
		}

		export type Any = Osu | Taiko | Fruits | Mania

		/**
		 * Get various data about the difficulty of a beatmap!
		 * @param beatmap The Beatmap in question
		 * @param mods Can be a bitset of mods, an array of mod acronyms, or an array of Mods (ignores mod settings) (defaults to **No Mod**)
		 * @param ruleset Useful to specify if the beatmap is a convert (defaults to **the ruleset the beatmap was intended for**)
		 * @remarks You may want to use api.getBeatmapDifficultyAttributesOsu (or Taiko or whatever) instead for better type safety
		 */
		export async function get(this: API, beatmap: Beatmap["id"] | Beatmap, mods?: Mod[] | string[] | number, ruleset?: Ruleset):
		Promise<DifficultyAttributes.Any> {
			beatmap = typeof beatmap === "number" ? beatmap : beatmap.id
			const response = await this.request("post", ["beatmaps", beatmap, "attributes"], {ruleset_id: ruleset, mods})
			return response.attributes // It's the only property
		}

		/**
		 * Get various data about the difficulty of an osu! beatmap!
		 * @param beatmap The Beatmap in question
		 * @param mods Can be a bitset of mods, an array of mod acronyms, or an array of Mods (ignores mod settings) (defaults to **No Mod**)
		 */
		export async function getOsu(this: API, beatmap: Beatmap["id"] | Beatmap, mods?: Mod[] | string[] | number): Promise<DifficultyAttributes.Osu> {
			return await this.getBeatmapDifficultyAttributes(beatmap, mods, Ruleset.osu) as DifficultyAttributes.Osu
		}

		/**
		 * Get various data about the difficulty of a taiko beatmap!
		 * @param beatmap The Beatmap in question
		 * @param mods Can be a bitset of mods, an array of mod acronyms, or an array of Mods (ignores mod settings) (defaults to **No Mod**)
		 */
		export async function getTaiko(this: API, beatmap: Beatmap["id"] | Beatmap, mods?: Mod[] | string[] | number): Promise<DifficultyAttributes.Taiko> {
			return await this.getBeatmapDifficultyAttributes(beatmap, mods, Ruleset.taiko) as DifficultyAttributes.Taiko
		}
		/**
		 * Get various data about the difficulty of a ctb beatmap!
		 * @param beatmap The Beatmap in question
		 * @param mods Can be a bitset of mods, an array of mod acronyms, or an array of Mods (ignores mod settings) (defaults to **No Mod**)
		 * @remarks Since the pp update of 2025-03-06, no property exclusive to this Ruleset exists
		 */
		export async function getFruits(this: API, beatmap: Beatmap["id"] | Beatmap, mods?: Mod[] | string[] | number): Promise<DifficultyAttributes.Fruits> {
			return await this.getBeatmapDifficultyAttributes(beatmap, mods, Ruleset.fruits) as DifficultyAttributes.Fruits
		}
		/**
		 * Get various data about the difficulty of a mania beatmap!
		 * @param beatmap The Beatmap in question
		 * @param mods Can be a bitset of mods, an array of mod acronyms, or an array of Mods (ignores mod settings) (defaults to **No Mod**)
		 * @remarks Since the pp update of 2025-03-06, no property exclusive to this Ruleset exists
		 */
		export async function getMania(this: API, beatmap: Beatmap["id"] | Beatmap, mods?: Mod[] | string[] | number): Promise<DifficultyAttributes.Mania> {
			return await this.getBeatmapDifficultyAttributes(beatmap, mods, Ruleset.mania) as DifficultyAttributes.Mania
		}
	}

	/**
	 * Get the score on a beatmap made by a specific user (with specific mods and on a specific ruleset if needed)
	 * @param beatmap The Beatmap the score was made on
	 * @param user The User who made the score
	 * @param config Specify the score's ruleset, the score's mods, prevent a lazer score from being returned
	 * @returns An Object with the position of the score according to the specified Mods and Ruleset, and with the score itself
	 */
	export async function getUserScore(this: API, beatmap: Beatmap["id"] | Beatmap, user: User["id"] | User, config?: Omit<Config, "type">): Promise<{
		/** Value depends on the requested mode and mods! */
		position: number,
		score: Score.WithUserBeatmap
	}> {
		const mode = config?.ruleset !== undefined ? Ruleset[config.ruleset] : undefined
		delete config?.ruleset

		beatmap = typeof beatmap === "number" ? beatmap : beatmap.id
		user = typeof user === "number" ? user : user.id
		return await this.request("get", ["beatmaps", beatmap, "scores", "users", user], {...config, mode})
	}

	/**
	 * Get the scores on a beatmap made by a specific user (with the possibility to specify if the scores are on a convert)
	 * @param beatmap The Beatmap the scores were made on
	 * @param user The User who made the scores
	 * @param config Specify the score's ruleset, prevent a lazer score from being returned**
	 */
	export async function getUserScores(this: API, beatmap: Beatmap["id"] | Beatmap, user: User["id"] | User, config?: Omit<Omit<Config, "mods">, "type">): Promise<Score[]> {
		const ruleset = config?.ruleset !== undefined ? Ruleset[config.ruleset] : undefined
		delete config?.ruleset

		beatmap = typeof beatmap === "number" ? beatmap : beatmap.id
		user = typeof user === "number" ? user : user.id
		const response = await this.request("get", ["beatmaps", beatmap, "scores", "users", user, "all"], {...config, ruleset})
		return response.scores // It's the only property
	}
	
	/** 
	 * Get extensive beatmap data about whichever beatmap you want!
	 * @param query What to specify in order to find the right beatmap
	*/
	export async function lookup(this: API, query: {checksum?: Beatmap.WithChecksum["checksum"], filename?: string, id?: Beatmap["id"]}):
	Promise<Extended.WithFailtimesOwnersMaxcomboBeatmapset> {
		const id = query.id ? String(query.id) : undefined
		return await this.request("get", ["beatmaps", "lookup"], {...query, id})
	}

	/**
	 * Get extensive beatmap data about whichever beatmap you want!
	 * @param beatmap The beatmap or the id of the beatmap you're trying to get
	 */
	export async function getOne(this: API, beatmap: Beatmap["id"] | Beatmap): Promise<Extended.WithFailtimesOwnersMaxcomboBeatmapset> {
		beatmap = typeof beatmap === "number" ? beatmap : beatmap.id
		return await this.request("get", ["beatmaps", beatmap])
	}

	/**
	 * Get extensive beatmap data for up to 50 beatmaps at once!
	 * @param beatmaps An array of beatmaps or of objects that have the id of the beatmaps you're trying to get
	 */
	export async function getMultiple(this: API, beatmaps: Array<Beatmap["id"] | Beatmap>): Promise<Extended.WithFailtimesOwnersMaxcombo[]> {
		const ids = beatmaps.map((beatmap) => typeof beatmap === "number" ? beatmap : beatmap.id)
		const response = await this.request("get", ["beatmaps"], {ids})
		return response.beatmaps // It's the only property
	}

	/**
	 * Get the top scores of a beatmap!
	 * @param beatmap The Beatmap in question
	 * @param config Specify the score's ruleset, mods, type, prevent a lazer score from being returned
	 * @remarks Please check if `mods` and `type` seem to be supported or not by the API: https://osu.ppy.sh/docs/index.html#get-beatmap-scores
	 */
	export async function getScores(this: API, beatmap: Beatmap["id"] | Beatmap, config?: Config): Promise<Score.WithUser[]> {
		const mode = config?.ruleset !== undefined ? Ruleset[config.ruleset] : undefined
		delete config?.ruleset

		beatmap = typeof beatmap === "number" ? beatmap : beatmap.id
		const response = await this.request("get", ["beatmaps", beatmap, "scores"], {...config, mode})
		return response.scores // It's the only property
	}
}
