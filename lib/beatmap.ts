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
 * @privateRemarks While not expected from anywhere, it should be exported for ease of use purposes
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

/**
 * Expected from Match
 */
export interface BeatmapWithBeatmapset extends Beatmap {
	beatmapset: Beatmapset
}

interface BeatmapWithChecksum extends Beatmap {
	checksum: string
}

/**
 * Expected from PlaylistItem
 */
export interface BeatmapWithBeatmapsetChecksumMaxcombo extends BeatmapWithBeatmapset, BeatmapWithChecksum {
	max_combo: number
}

/**
 * Expected from Score
 */
export interface BeatmapExtended extends BeatmapWithChecksum {
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

/**
 * Expected from BeatmapsetExtendedPlus
 */
export interface BeatmapExtendedWithFailtimes extends BeatmapExtended {
	failtimes: {
		exit: number[]
		fail: number[]
	}
}

/**
 * Expected from api.getBeatmap()
 */
export interface BeatmapExtendedWithFailtimesBeatmapsetextended extends BeatmapExtendedWithFailtimes {
	beatmapset: BeatmapsetExtended
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
	/**
	 * A string like that, where id is the `id` of the beatmapset: `//b.ppy.sh/preview/58951.mp3`
	 */
	preview_url: string
	source: string
	spotlight: boolean
	/**
	 * Is it ranked, is it graveyard, etc
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

/**
 * Expected from RankingsSpotlight, BeatmapExtendedWithFailtimesBeatmapsetextended
 */
export interface BeatmapsetExtended extends Beatmapset {
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
	}
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

/**
 * Expected from api.getBeatmapset()
 */
export interface BeatmapsetExtendedPlus extends BeatmapsetExtended {
	/**
	 * The different beatmaps/difficulties this beatmapset has
	 */
	beatmaps: BeatmapExtendedWithFailtimes[]
	/**
	 * The different beatmaps made for osu!, but converted to the other Rulesets
	 */
	converts: BeatmapExtendedWithFailtimes[]
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
	has_favourited: boolean
	language: {
		id: number
		name: string
	}
	pack_tags: string[]
	ratings: number[]
	recent_favourites: User[]
	related_users: User[]
	user: User
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
