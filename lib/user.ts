type ProfilePage = "me" | "recent_activity" | "beatmaps" |
"historical" | "kudosu" | "top_ranks" | "medals"

type UserBadge = {
	awarded_at: Date
	description: string
	image_url: string
	url: string
}

type ProfileBanner = {
	id: number
	tournament_id: number
	image: string
}

export interface UserCompact {
	avatar_url: string
	country_code: string
	default_group: string
	id: number
	is_active: Boolean
	is_bot: Boolean
	is_deleted: Boolean
	is_online: Boolean
	is_supported: Boolean
	last_visit: Date | null
	pm_friends_only: Boolean
	profile_colour: string | null
	username: string

	account_history?: {
		description: string | null
		id: number
		length: number
		permanent: Boolean
		timestamp: Date
		type: "note" | "restriction" | "silence"
	}[] | 0
	active_tournament_banner?: ProfileBanner | null
	badges?: UserBadge[] | 0
	beatmap_playcounts_count?: number
	blocks?: any
	country?: {
		code: string
		name: string
	}
	cover?: { // poorly documented
		custom_url: string | null
		url: string
		id: string | null
	}
	favourite_beatmapset_count?: number
	follower_count?: number
	friends?: any
	graveyard_beatmapset_count?: number
	groups?: {
		colour: string | null
		has_listing: Boolean
		has_playmodes: Boolean
		id: number
		identifier: string
		is_probationary: Boolean
		name: string
		playmodes: string[] | null
		short_name: string
	}[]
	is_restricted?: Boolean | null
	loved_beatmapset_count?: number
	monthly_playcounts?: {
		start_date: Date
		count: number
	}[]
	page?: {
		html: string
		raw: string
	}
	pending_beatmapset_count?: any
	previous_usernames?: string[]
	rank_highest?: {
		rank: number
		updated_at: Date
	} | null
	rank_history?: {
		mode: string
		data: number[]
	}
	ranked_beatmapset_count?: any
	replays_watched_count?: {
		start_date: Date
		count: number
	}[]
	scores_best_count?: number
	scores_recent_count?: number
	statistics?: any
	statistics_rulesets?: any
	support_level?: number
	unread_pm_count?: any
	user_achievements?: any
	user_preferences?: any
}

export interface User extends UserCompact {
	cover_url: string
	discord: string | null
	has_supported: Boolean
	interests: string | null
	join_date: Date
	"kudosu.available": number
	"kudosu.total": number
	location: string | null
	max_blocks: number
	max_friends: number
	occupation: string | null
	playmode: string
	playstyle: string[]
	post_count: number
	profile_order: ProfilePage[]
	title: string | null
	title_url: string | null
	twitter: string | null
	website: string | null
}

export interface UserStatistics {
	count_100: number
	count_300: number
	count_50: number
	count_miss: number
	["grade_counts.a"]: number
	["grade_counts.s"]: number
	["grade_counts.sh"]: number
	["grade_counts.ss"]: number
	["grade_counts.ssh"]: number
	hit_accuracy: number
	is_ranked: number
	["level.current"]: number
	["level.progress"]: number
	maximum_combo: number
	play_count: number
	play_time: number
	pp: number
	/**
	 * Amount of pp in lazer
	 * @remarks Not in official documentation
	 */
	pp_exp: number | null
	global_rank: number
	/**
	 * Global rank in lazer
	 * @remarks Not in official documentation
	 */
	global_rank_exp: number | null
	ranked_score: number
	replays_watched_by_others: number
	total_hits: number
	total_score: number
	user: UserCompact
}
