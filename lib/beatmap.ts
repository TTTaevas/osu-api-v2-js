import { Rulesets } from "./misc.js"
import { User } from "./user.js"

export enum RankStatus {
	Graveyard 	= -2,
	Wip 		= -1,
	Pending		= 0,
	Ranked		= 1,
	Approved	= 2,
	Qualified	= 3,
	Loved 		= 4
}

/**
 * Expected from BeatmapPlaycount
 */
export interface Beatmap {
	beatmapset_id: number
	difficulty_rating: number
	id: number
	mode: string
	status: string
	total_length: number
	user_id: number
	version: string
}

export namespace Beatmap {
	/**
	 * Expected from Match
	 */
	export interface WithBeatmapset extends Beatmap {
		beatmapset: Beatmapset
	}

	interface WithChecksum extends Beatmap {
		checksum: string
	}

	/**
	 * Expected from PlaylistItem
	 */
	export interface WithBeatmapsetChecksumMaxcombo extends WithBeatmapset, WithChecksum {
		max_combo: number
	}

	/**
	 * Expected from ScoreWithUserBeatmapBeatmapset
	 */
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
		mode_int: number
		passcount: number
		playcount: number
		ranked: RankStatus
		url: string
	}

	export namespace Extended {
		/**
		 * Expected from BeatmapsetExtendedPlus
		 */
		export interface WithFailtimes extends Extended {
			failtimes: {
				exit: number[]
				fail: number[]
			}
		}

		/**
		 * Expected from api.getBeatmaps()
		 */
		export interface WithFailtimesMaxcombo extends WithFailtimes {
			max_combo: number
		}

		/**
		 * Expected from api.getBeatmap()
		 */
		export interface WithFailtimesBeatmapsetextended extends WithFailtimesMaxcombo {
			beatmapset: Beatmapset.Extended
		}
	}

	/**
	 * Expected from api.getUserMostPlayed()
	 */
	export interface Playcount {
		beatmap_id: number
		/**
		 * Playcount
		 */
		count: number
		beatmap: Beatmap
		beatmapset: Beatmapset
	}

	/**
	 * Expected from api.getBeatmapPack(), api.getBeatmapPacks()
	 */
	export interface Pack {
		author: string
		date: Date
		name: string
		/**
		 * Are difficulty reduction mods unable to be used to clear this pack? (is `false` if you can use such mods)
		 */
		no_diff_reduction: boolean
		ruleset_id: number | null,
		tag: string,
		url: string,
		beatmapsets?: Beatmapset.Extended[],
		user_completion_data?:{
			/**
			 * IDs of beatmapsets completed by the user (according to the requirements of the pack)
			 */
			beatmapset_ids: number[],
			/**
			 * Whether all beatmapsets are completed by the user or not
			 */
			completed: boolean
		}
	}

	/**
	 * Expected from api.getBeatmapDifficultyAttributes()
	 */
	export interface DifficultyAttributes {
		star_rating: number
		max_combo: number
	}

	export namespace DifficultyAttributes {
		/**
		 * Expected from api.getBeatmapDifficultyAttributesOsu()
		 */
		export interface Osu extends DifficultyAttributes {
			aim_difficulty: number
			speed_difficulty: number
			speed_note_count: number
			flashlight_difficulty: number
			slider_factor: number
			approach_rate: number
			overall_difficulty: number
		}

		/**
		 * Expected from api.getBeatmapDifficultyAttributesTaiko()
		 */
		export interface Taiko extends DifficultyAttributes {
			stamina_difficulty: number
			rhythm_difficulty: number
			colour_difficulty: number
			peak_difficulty: number
			great_hit_window: number
		}

		/**
		 * Expected from api.getBeatmapDifficultyAttributesFruits()
		 */
		export interface Fruits extends DifficultyAttributes {
			approach_rate: number
		}

		/**
		 * Expected from api.getBeatmapDifficultyAttributesMania()
		 */
		export interface Mania extends DifficultyAttributes {
			great_hit_window: number
			/**
			 * @remarks (2023-11-20) Doesn't exist anymore?
			 */
			score_multiplier?: number
		}

		export type Any = Osu | Taiko | Fruits | Mania
	}
}

/**
 * Expected from BeatmapWithBeatmapset, Score, BeatmapPlaycount
 */
export interface Beatmapset {
	artist: string
	artist_unicode: string
	covers: {
		cover: string
		"cover@2x": string
		card: string
		"card@2x": string
		list: string
		"list@2x": string
		slimcover: string
		"slimcover@2x": string
	}
	creator: string
	favourite_count: number
	id: number
	nsfw: boolean
	offset: number
	play_count: number
	/**
	 * A string like that, where id is the `id` of the beatmapset: `//b.ppy.sh/preview/58951.mp3`
	 */
	preview_url: string
	/**
	 * Can be/Is 0 if there is no source
	 */
	source: string | 0
	spotlight: boolean
	/**
	 * Is it ranked, is it graveyarded, etc
	 */
	status: string
	/**
	 * A title readable by any english-speaking person, so it'd be romaji if the song's title is in Japanese
	 */
	title: string
	/**
	 * Basically the title is the original language, so with hiraganas and kanji if Japanese
	 */
	title_unicode: string
	user_id: number
	video: boolean
}

export namespace Beatmapset {
	/**
	 * Expected from RankingsSpotlight, BeatmapExtendedWithFailtimesBeatmapsetextended
	 */
	export interface Extended extends Beatmapset {
		availability: {
			/**
			 * So it's `false` if you can download it
			 */
			download_disabled: boolean
			more_information: string | null
		}
		bpm: number
		can_be_hyped: boolean
		creator: string
		deleted_at: string | null
		discussion_locked: boolean
		hype: {
			current: number
			required: number
		} | null
		is_scoreable: boolean
		last_updated: Date
		legacy_thread_url: string
		nominations_summary: {
			current: number
			required: number
		}
		ranked: RankStatus
		ranked_date: Date | null
		source: string
		storyboard: boolean
		submitted_date: Date | null
		/**
		 * 0 if no tags at all, a string with tags separated from each other by a whitespace
		 */
		tags: string | 0
	}

	export namespace Extended {
		/**
		 * Expected from api.getUserBeatmaps()
		 */
		export interface WithBeatmapExtended extends Extended {
			beatmaps: Beatmap.Extended[]
		}

		/**
		 * Expected from api.getBeatmapset()
		 */
		export interface Plus extends Extended {
			/**
			 * The different beatmaps/difficulties this beatmapset has
			 */
			beatmaps: Beatmap.Extended.WithFailtimes[]
			/**
			 * The different beatmaps made for osu!, but converted to the other Rulesets
			 */
			converts: Beatmap.Extended.WithFailtimes[]
			current_nominations: {
				beatmapset_id: number
				rulesets: Rulesets[]
				reset: boolean
				user_id: number
			}[]
			description: {
				/**
				 * In HTML
				 */
				description: string
			}
			genre: {
				id: number
				name: string
			}
			language: {
				id: number
				name: string
			}
			pack_tags: string[]
			ratings: number[]
			recent_favourites: User[]
			related_users: User[]
			user: User
			/**
			 * Only exists if authorized user
			 */
			has_favourited?: boolean
		}
	}
}
