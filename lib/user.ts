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

export interface User {
	avatar_url: string
	country_code: string
	default_group: string
	id: number
	is_active: boolean
	is_bot: boolean
	is_deleted: boolean
	is_online: boolean
	is_supported: boolean
	last_visit: Date | null
	pm_friends_only: boolean
	profile_colour: string | null
	username: string

	account_history?: {
		description: string | null
		id: number
		length: number
		permanent: boolean
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
	cover?: {
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
		has_listing: boolean
		has_playmodes: boolean
		id: number
		identifier: string
		is_probationary: boolean
		name: string
		playmodes: string[] | null
		short_name: string
	}[] | 0
	is_restricted?: boolean | null
	loved_beatmapset_count?: number
	monthly_playcounts?: {
		start_date: Date
		count: number
	}[]
	page?: {
		html: string
		raw: string
	}
	pending_beatmapset_count?: number
	previous_usernames?: string[]
	rank_highest?: {
		rank: number
		updated_at: Date
	} | null
	rank_history?: {
		mode: string
		data: number[]
	}
	ranked_beatmapset_count?: number
	replays_watched_counts?: {
		start_date: Date
		count: number
	}[]
	scores_best_count?: number
	scores_recent_count?: number
	statistics?: UserStatistics
	statistics_rulesets?: {
		osu: UserStatistics
		taiko: UserStatistics
		fruits: UserStatistics
		mania: UserStatistics
	}
	support_level?: number
	/**
	 * @remarks ...I actually don't know its type and have been unable to figure it out, I'm only presuming it is number
	 */
	unread_pm_count?: number
	user_achievements?: {
		achieved_at: Date
		achievement_id: number
	}[]
	user_preferences?: any
}

export interface UserExtended extends User {
	cover_url: string
	discord: string | null
	has_supported: boolean
	interests: string | null
	join_date: Date
	kudosu: {
		available: number
		total: number
	}
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
	grade_counts: {
		a: number
		s: number
		sh: number
		ss: number
		ssh: number
	}
	hit_accuracy: number
	is_ranked: number
	level: {
		current: number
		progress: number
	}
	maximum_combo: number
	play_count: number
	play_time: number
	pp: number
	pp_exp: number
	global_rank: number | null
	global_rank_exp: number | null
	ranked_score: number
	replays_watched_by_others: number
	total_hits: number
	total_score: number
	user: User
}

export interface KudosuHistory {
	id: number
	action: "give" | "vote.give" | "reset" | "vote.reset" | "revoke" | "vote.revoke"
	amount: number
	model: string
	created_at: Date
	giver: {
		url: string
		username: string
	} | null
	post: {
		url: string | null
		title: string
	}
}

export interface CurrentUserAttributes {
	can_destroy: boolean
	can_reopen: boolean
	can_moderate_kudosu: boolean
	can_resolve: boolean
	vote_score: number
	can_message: boolean
	can_message_error: string | null
	last_read_id: number
} 
