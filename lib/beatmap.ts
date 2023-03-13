export enum RankStatus {
	Graveyard = -2,
	Wip 			= -1,
	Pending		= 0,
	Ranked		= 1,
	Approved	= 2,
	Qualified	= 3,
	Loved 		= 4
}

export interface BeatmapCompact {
	beatmapset_id: number
	difficulty_rating: number
	id: number
	mode: string
	status: string
	total_length: number
	user_id: number
	version: string
	beatmapset?: Beatmapset | BeatmapsetCompact | null
	checksum?: string
	failtimes?: Failtimes
	max_combo?: number
}

export interface Beatmap extends BeatmapCompact {
	accuracy: number
	ar: number
	beatmapset_id: number
	bpm: number | null
	convert: Boolean
	count_circles: number
	count_sliders: number
	count_spinners: number
	cs: number
	deleted_at: Date | null
	drain: number
	hit_length: number
	is_scoreable: Boolean
	last_updated: Date
	mode_int: number
	passcount: number
	playcount: number
	ranked: RankStatus
	url: string
}

export interface BeatmapsetCompact {
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
	nsfw: Boolean
	play_count: number
	preview_url: string
	source: string
	status: string
	title: string
	title_unicode: string
	user_id: number
	video: Boolean
	beatmaps?: Beatmap[]
	converts?: any
	current_user_attributes?: any
	description?: any
	discussions?: any
	events?: any
	genre?: any
	has_favourited?: Boolean
	language?: any
	nominations?: any
	pack_tags?: string[]
	ratings?: any
	recent_favourites?: any
	related_users?: any
	user?: any
}

export interface Beatmapset extends BeatmapsetCompact {
	availability: {
		download_disabled: boolean
		more_information: string | null
	}
	bpm: number
	can_be_hyped: Boolean
	creator: string
	deleted_at: string | null
	discussion_locked: Boolean
	"hype.current": number
	"hype.required": number
	is_scoreable: Boolean
	last_updated: Date
	legacy_thread_url: string | null
	nominations: {
		current: number
		required: number
	}
	ranked: RankStatus
	ranked_date: Date | null
	source: string
	storyboard: Boolean
	submitted_date: Date | null
	tags: string
	has_favourited?: any
}

export interface BeatmapAttributes {
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

export interface Failtimes {
	exit?: number[]
	fail?: number[]
}
