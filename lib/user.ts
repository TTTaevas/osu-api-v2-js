import { Rulesets } from "./misc.js"

export interface User {
	avatar_url: string
	country_code: string
	default_group: string
	id: number
	is_active: boolean
	is_bot: boolean
	is_deleted: boolean
	is_online: boolean
	is_supporter: boolean
	last_visit: Date | null
	pm_friends_only: boolean
	profile_colour: string | null
	username: string
}

export namespace User {
	export interface WithKudosu extends User {
		kudosu: {
			available: number
			total: number
		}
	}

	/** @obtainableFrom {@link API.getMatch} */
	export interface WithCountry extends User {
		country: {
			code: string
			name: string
		}
	}

	export interface WithCountryCover extends WithCountry {
		cover: {
			custom_url: string | null
			url: string
			id: number | null
		}
	}

	interface WithCountryCoverGroups extends WithCountryCover {
		groups: {
			colour: string | null
			has_listing: boolean
			has_playmodes: boolean
			id: number
			identifier: string
			is_probationary: boolean
			name: string
			playmodes: (keyof typeof Rulesets)[] | null
			short_name: string
		}[]
	}

	/** @obtainableFrom {@link API.getUsers} */
	export interface WithCountryCoverGroupsStatisticsrulesets extends WithCountryCoverGroups {
		statistics_rulesets: {
			osu?: Statistics
			taiko?: Statistics
			fruits?: Statistics
			mania?: Statistics
		}
	}

	/** @obtainableFrom {@link API.getFriends} */
	export interface WithCountryCoverGroupsStatisticsSupport extends WithCountryCoverGroups {
		statistics: Statistics
		support_level: number
	}

	/** @obtainableFrom {@link API.getUser} */
	export interface Extended extends User.WithCountryCoverGroupsStatisticsSupport, User.WithKudosu {
		cover_url: string
		discord: string | null
		has_supported: boolean
		interests: string | null
		join_date: Date
		location: string | null
		max_blocks: number
		max_friends: number
		occupation: string | null
		playmode: keyof typeof Rulesets
		playstyle: string[]
		post_count: number
		profile_order: ("me" | "recent_activity" | "beatmaps" | "historical" | "kudosu" | "top_ranks" | "medals")[]
		title: string | null
		title_url: string | null
		twitter: string | null
		website: string | null
		account_history: {
			description: string | null
			id: number
			length: number
			permanent: boolean
			timestamp: Date
			type: "note" | "restriction" | "silence"
		}[]
		active_tournament_banners: {
			id: number
			tournament_id: number
			image: string
		}[]
		badges: {
			awarded_at: Date
			description: string
			image_url: string
			url: string
		}[]
		beatmap_playcounts_count: number
		comments_count: number
		favourite_beatmapset_count: number
		follower_count: number
		graveyard_beatmapset_count: number
		guest_beatmapset_count: number
		loved_beatmapset_count: number
		mapping_follower_count: number
		monthly_playcounts: {
			start_date: Date
			count: number
		}[]
		nominated_beatmapset_count: number
		page: {
			html: string
			/** Basically the text with the BBCode */
			raw: string
		}
		pending_beatmapset_count: number
		previous_usernames: string[]
		rank_highest: {
			rank: number
			updated_at: Date
		} | null
		replays_watched_counts: {
			start_date: Date
			count: number
		}[]
		scores_best_count: number
		scores_first_count: number
		/** Specific to the Ruleset (`playmode`) */
		scores_pinned_count: number
		scores_recent_count: number
		statistics: Statistics.WithCountryrank
		support_level: number
		user_achievements: {
			achieved_at: Date
			achievement_id: number
		}[]
		rank_history: {
			mode: keyof typeof Rulesets
			data: number[]
		} | null
	}

	export namespace Extended {
		/** @obtainableFrom {@link API.getResourceOwner} */
		export interface WithStatisticsrulesets extends Extended, User.WithCountryCoverGroupsStatisticsrulesets {
			is_restricted: boolean
		}
	}

	export interface Statistics {
		count_300: number
		count_100: number
		count_50: number
		count_miss: number
		global_rank: number | null
		global_rank_exp: number | null
		grade_counts: {
			a: number
			s: number
			sh: number
			ss: number
			ssh: number
		}
		/** Accuracy in the normal format, where 96.56% would be `96.56` */
		hit_accuracy: number
		/** Hasn't become inactive in the rankings */
		is_ranked: boolean
		level: {
			current: number
			progress: number
		}
		maximum_combo: number
		play_count: number
		play_time: number | null
		pp: number | null
		pp_exp: number
		ranked_score: number
		replays_watched_by_others: number
		total_hits: number
		total_score: number
	}

	export namespace Statistics {
		export interface WithCountryrank extends Statistics {
			country_rank: number
		}

		export interface WithUser extends Statistics {
			user: User.WithCountryCover
		}
	}

	/** @obtainableFrom {@link API.getUserKudosu} */
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
}
