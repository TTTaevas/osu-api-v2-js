import { Genres, Languages, Rulesets } from "./misc.js"
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
	}
}

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
	/** A string like that where id is the `id` of the beatmapset: `//b.ppy.sh/preview/58951.mp3` */
	preview_url: string
	source: string
	spotlight: boolean
	/** Is it ranked, is it graveyarded, etc */
	status: string
	/** A title readable by any english-speaking person, so it'd be in romaji if the song's title is in Japanese */
	title: string
	/** Basically the title is the original language, so with hiragana, katakana and kanji if Japanese */
	title_unicode: string
	user_id: number
	video: boolean
}

export namespace Beatmapset {
	/** Whether properties are there or not and null or not depend of the `type` */
	export interface Event {
		id: number
		/** Port of https://github.com/ppy/osu-web/blob/master/app/Models/BeatmapsetEvent.php */
		type: "nominate" | "love" | "remove_from_loved" | "qualify" | "disqualify" | "approve" | "rank" |
			"kudosu_allow" | "kudosu_denied" | "kudosu_gain" | "kudosu_lost" | "kudosu_recalculate" |
			"issue_resolve" | "issue_reopen" | "discussion_lock" | "disccusion_unlock" | "discussion_delete" | "discussion_restore" |
			"discussion_post_delete" | "discussion_post_restore" | "nomination_reset" | "nomination_reset_received" |
			"genre_edit" | "language_edit" | "nsfw_toggle" | "offset_edit" | "tags_edit" | "beatmap_owner_change"
		comment: {
			beatmap_discussion_id: number | null
			beatmap_discussion_post_id: number | null
			reason?: string
			old?: keyof typeof Genres | keyof typeof Languages
			new?: keyof typeof Genres | keyof typeof Languages
		} | null
		created_at: Date
		user_id: number | null
		beatmapset: Beatmapset.WithUserHype
		discussion?: Beatmapset.Discussion.WithStartingpost | null
	}

	export interface WithHype extends Beatmapset {
		hype: {
			current: number
			required: number
		} | null
	}

	export interface WithUserHype extends WithHype {
		user: User
	}

	export interface Extended extends WithHype {
		availability: {
			/** So it's `false` if you can download it */
			download_disabled: boolean
			more_information: string | null
		}
		bpm: number
		can_be_hyped: boolean
		creator: string
		deleted_at: string | null
		discussion_locked: boolean
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
		tags: string
	}

	export namespace Extended {
		/** @obtainableFrom {@link API.getUserBeatmaps} */
		export interface WithBeatmapExtended extends Extended {
			beatmaps: Beatmap.Extended[]
		}

		export interface WithBeatmapExtendedPacktags extends Extended {
			beatmaps: Beatmap.Extended.WithMaxcombo[]
			pack_tags: string[]
		}

		/** @obtainableFrom {@link API.getBeatmapset} */
		export interface Plus extends Extended, WithUserHype {
			/** The different beatmaps/difficulties this beatmapset has */
			beatmaps: Beatmap.Extended.WithFailtimes[]
			/** The different beatmaps made for osu!, but converted to the other Rulesets */
			converts: Beatmap.Extended.WithFailtimes[]
			current_nominations: {
				beatmapset_id: number
				rulesets: Rulesets[]
				reset: boolean
				user_id: number
			}[]
			description: {
				/** In HTML */
				description: string
			}
			genre: {
				id: Genres
				name: keyof typeof Genres
			}
			language: {
				id: Languages
				name: keyof typeof Languages
			}
			pack_tags: string[]
			ratings: number[]
			recent_favourites: User[]
			related_users: User[]
			/** Only exists if authorized user */
			has_favourited?: boolean
		}
	}

	export interface Discussion {
		id: number
		beatmapset_id: number
		beatmap_id: number | null
		user_id: number
		deleted_by_id: number | null
		message_type: "suggestion" | "problem" | "mapper_note" | "praise" | "hype" | "review"
		parent_id: number | null
		timestamp: number | null
		resolved: boolean
		can_be_resolved: boolean
		can_grant_kudosu: boolean
		created_at: Date
		updated_at: Date
		deleted_at: Date | null
		last_post_at: Date
		kudosu_denied: boolean
	}

	export namespace Discussion {
		export interface WithStartingpost extends Discussion {
			starting_post: Discussion.Post
		}

		export interface Post {
			beatmapset_discussion_id: number
			created_at: Date
			deleted_at: Date | null
			deleted_by_id: number | null
			id: number
			last_editor_id: number | null
			message: string
			system: boolean
			updated_at: Date
			user_id: number
		}

		export interface Vote {
			beatmapset_discussion_id: number
			created_at: Date
			id: number
			score: number
			updated_at: Date
			user_id: number
		}
	}
}
