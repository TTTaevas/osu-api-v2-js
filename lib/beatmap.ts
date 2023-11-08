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

export interface Beatmap {
	beatmapset_id: number
	difficulty_rating: number
	id: number
	mode: string
	status: string
	total_length: number
	user_id: number
	version: string
	/**
	 * Beatmapset for Beatmap object, BeatmapsetExtended for BeatmapExtended object, null if the beatmap doesn't have associated beatmapset (e.g. deleted)
	 */
	beatmapset?: BeatmapsetExtended | Beatmapset | null
	checksum?: string
	failtimes?: Failtimes
	max_combo?: number
}

export interface BeatmapExtended extends Beatmap {
	accuracy: number
	ar: number
	beatmapset_id: number
	bpm: number | null
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
	play_count: number
	preview_url: string
	source: string
	status: string
	title: string
	title_unicode: string
	user_id: number
	video: boolean
	beatmaps?: BeatmapExtended[]
	converts?: BeatmapExtended[] | 0
	current_nominations?: {
		beatmapset_id: number
		rulesets: Rulesets[] | null
		reset: boolean
		user_id: number
	}[]
	current_user_attributes?: any
	description?: {
		description: string
	}
	discussions?: any
	events?: any
	genre?: {
		id: number
		name: string
	}
	has_favourited?: boolean
	language?: {
		id: number
		name: string
	}
	nominations?: any
	pack_tags?: string[]
	ratings?: number[]
	recent_favourites?: User[]
	related_users?: User[]
	user?: User
}

export interface BeatmapsetExtended extends Beatmapset {
	availability: {
		download_disabled: boolean
		more_information: string | null
	}
	bpm: number
	can_be_hyped: boolean
	creator: string
	deleted_at: string | null
	discussion_locked: boolean
	"hype.current": number
	"hype.required": number
	is_scoreable: boolean
	last_updated: Date
	legacy_thread_url: string | null
	nominations: {
		current: number
		required: number
	}
	ranked: RankStatus
	ranked_date: Date | null
	source: string
	storyboard: boolean
	submitted_date: Date | null
	tags: string
	has_favourited?: any
}

export interface BeatmapDifficultyAttributes {
	star_rating: number
	max_combo: number
	/**
	 * osu
	 */
	aim_difficulty?: number
	/**
	 * osu, taiko, fruits
	 */
	approach_rate?: number
	/**
	 * osu
	 */
	flashlight_difficulty?: number
	/**
	 * osu
	 */
	overall_difficulty?: number
	/**
	 * osu
	 */
	slider_factor?: number
	/**
	 * osu
	 */
	speed_difficulty?: number
	/**
	 * taiko
	 */
	stamina_difficulty?: number
	/**
	 * taiko
	 */
	rhythm_difficulty: number
	/**
	 * taiko
	 */
	colour_difficulty: number
	/**
	 * taiko, mania
	 */
	great_hit_window: number
	/**
	 * mania
	 */
	score_multiplier: number
}

export interface BeatmapPack {
	author: string
	date: Date
	name: string
	/**
	 * Are difficulty reduction mods unable to be used to clear this pack? (is `false` if you can use such mods)
	 */
	no_diff_reduction: boolean
	ruleset_id: number,
	tag: string,
	url: string,
	beatmapsets?: BeatmapsetExtended[],
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

export interface Failtimes {
	exit?: number[]
	fail?: number[]
}
