import { API, Beatmap, Beatmapset, Event, Ruleset, Score } from "./index.js"
import { getId } from "./misc.js"

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
	/** 
	 * An interface to tell the API how the returned Array should be like
	 * @group Parameter Object Interfaces
	 */
	export interface Config {
		/** 
		 * The maximum amount of elements returned in the array 
		 * @remarks The server could send less than the limit because it deliberately limits itself; Putting this at 1000 doesn't mean you'll even get close to 200
		 */
		limit?: number
		/** How many elements that would be at the top of the returned array get skipped (while still filling the array up to the limit) */
		offset?: number
	}

	/** @obtainableFrom {@link API.getUserRanking} */
	export interface WithKudosu extends User {
		kudosu: {
			available: number
			total: number
		}
	}

	export interface WithGroups extends User {
		groups: {
			colour: string | null
			has_listing: boolean
			has_playmodes: boolean
			id: number
			identifier: string
			is_probationary: boolean
			name: string
			short_name: string
			playmodes: (keyof typeof Ruleset)[] | null
		}[]
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
			/** @privateRemarks When there's no cover, like on the dev server, this is null; keeping it non-null for convenience */
			url: string
			id: number | null
		}
	}

	/** @obtainableFrom {@link API.getBeatmapUserScore} */
	export interface WithCountryCoverTeam extends WithCountryCover {
		team: {
			flag_url: string
			id: number
			name: string
			short_name: string
		} | null
	}

	/** @obtainableFrom {@link API.lookupUsers} */
	export interface WithCountryCoverGroupsTeam extends WithCountryCoverTeam, WithGroups {}

	/** @obtainableFrom {@link API.getUsers} */
	export interface WithCountryCoverGroupsTeamStatisticsrulesets extends WithCountryCoverGroupsTeam {
		statistics_rulesets: {
			osu?: Statistics
			taiko?: Statistics
			fruits?: Statistics
			mania?: Statistics
		}
		/** Exists only if `include_variant_statistics` was ever specified to be true in a request */
		variants?: {
			mode: keyof typeof Ruleset
			variant: string
			country_rank: Statistics.WithCountryrank["country_rank"]
			global_rank: Statistics["global_rank"]
			pp: number
		}[]
	}

	export interface WithCountryCoverGroupsTeamStatisticsSupport extends WithCountryCover, WithGroups {
		statistics: Statistics
		support_level: number
	}

	/** @obtainableFrom {@link API.getUser} */
	export interface Extended extends WithCountryCoverGroupsTeamStatisticsSupport, WithKudosu {
		discord: string | null
		has_supported: boolean
		interests: string | null
		join_date: Date
		location: string | null
		max_blocks: number
		max_friends: number
		occupation: string | null
		playmode: keyof typeof Ruleset
		playstyle: string[] | null
		post_count: number
		profile_hue: number | null
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
		daily_challenge_user_stats: {
			daily_streak_best: number
			daily_streak_current: number
			last_update: Date | null
			last_weekly_streak: Date | null
			playcount: number
			top_10p_placements: number
			top_50p_placements: number
			user_id: User["id"]
			weekly_streak_best: number
			weekly_streak_current: number
		}
		follower_count: number
		mapping_follower_count: number
		monthly_playcounts: {
			start_date: Date
			count: number
		}[]
		page: {
			html: string
			/** Basically the text with the BBCode */
			raw: string
		}
		previous_usernames: User["username"][]
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
			mode: keyof typeof Ruleset
			data: number[]
		} | null
		// all the beatmapset_count stuff, in order as on https://osu.ppy.sh/users/<user_id>
		favourite_beatmapset_count: number
		ranked_beatmapset_count: number
		loved_beatmapset_count: number
		guest_beatmapset_count: number
		pending_beatmapset_count: number
		graveyard_beatmapset_count: number
		nominated_beatmapset_count: number
	}

	export namespace Extended {
		/** @obtainableFrom {@link API.getResourceOwner} */
		export interface WithStatisticsrulesets extends Extended, User.WithCountryCoverGroupsTeamStatisticsrulesets {
			is_restricted: boolean
			session_verified: boolean
		}
	}

	export interface Statistics {
		count_300: number
		count_100: number
		count_50: number
		count_miss: number
		global_rank: number | null
		/** @deprecated Use `global_rank` instead | https://github.com/ppy/osu-web/pull/12003 */
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
		/** @deprecated Use `pp` instead | https://github.com/ppy/osu-web/pull/12003 */
		pp_exp: number | null
		ranked_score: number
		replays_watched_by_others: number
		total_hits: number
		total_score: number
	}

	export namespace Statistics {
		export interface WithCountryrank extends Statistics {
			country_rank: number | null
		}

		export interface WithUser extends Statistics {
			user: User.WithCountryCover
		}
	}

	/** @obtainableFrom {@link API.getFriends} */
	export interface Relation {
		target_id: User["id"]
		relation_type: "friend" | "block"
		mutual: boolean
		target: WithCountryCoverGroupsTeamStatisticsSupport
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


	// FUNCTIONS

	/**
	 * Get extensive user data about the authorized user
	 * @scope {@link Scope"identify"}
	 * @param ruleset The data should be relevant to which ruleset? (defaults to **user's default Ruleset**)
	 */
	export async function getResourceOwner(this: API, ruleset?: Ruleset): Promise<User.Extended.WithStatisticsrulesets> {
		return await this.request("get", "me", {mode: ruleset})
	}
	
	/**
	 * Get extensive user data about whoever you want!
	 * @param user A user id, a username or a `User` object!
	 * @param ruleset The data should be relevant to which ruleset? (defaults to **user's default Ruleset**)
	 */
	export async function getOne(this: API, user: User["id"] | User["username"] | User, ruleset?: Ruleset): Promise<User.Extended> {
		const mode = ruleset !== undefined ? Ruleset[ruleset] : ""
		if (typeof user === "string") return await this.request("get", `users/@${user}/${mode}`) // `user` is the username, use @ prefix
		if (typeof user === "number") return await this.request("get", `users/${user}/${mode}`) // `user` is the id
		return await this.request("get", `users/${user.id}/${mode}`) // `user` is the User object
	}

	/**
	 * Lookup user data for up to 50 users at once!
	 * @param users An array containing user ids or/and `User` objects!
	 */
	export async function lookupMultiple(this: API, users: Array<User["id"] | User>): Promise<User.WithCountryCoverGroupsTeam[]> {
		const ids = users.map((user) => getId(user))
		const response = await this.request("get", "users/lookup", {ids})
		return response.users // It's the only property
	}

	/**
	 * Get user data for up to 50 users at once!
	 * @param users An array containing user ids or/and `User` objects!
	 * @param include_variant_statistics Should the response include `variants`, useful to get stats specific to mania 4k/7k for example? (defaults to **false**)
	 */
	export async function getMultiple(this: API, users: Array<User["id"] | User>, include_variant_statistics: boolean = false):
	Promise<User.WithCountryCoverGroupsTeamStatisticsrulesets[]> {
		const ids = users.map((user) => getId(user))
		const response = await this.request("get", "users", {ids, include_variant_statistics})
		return response.users // It's the only property
	}

	/**
	 * Get "notable" scores from a user
	 * @param user The user who set the scores
	 * @param type Do you want scores: in the user's top 100, that are top 1 on a beatmap, that have been recently set?
	 * @param ruleset The Ruleset the scores were made in (defaults to **user's default Ruleset**)
	 * @param include Do you also want lazer scores and failed scores? (defaults to **true for lazer** & **false for fails**)
	 * @param config Array limit & offset
	 */
	export async function getScores(this: API, user: User["id"] | User, type: "best" | "firsts" | "recent", ruleset?: Ruleset,
	include: {lazer?: boolean, fails?: boolean} = {lazer: true, fails: false}, config?: Config): Promise<Score.WithUserBeatmapBeatmapset[]> {
		const mode = ruleset !== undefined ? Ruleset[ruleset] : undefined
		return await this.request("get", `users/${getId(user)}/scores/${type}`,
		{mode, limit: config?.limit, offset: config?.offset, legacy_only: Number(!include.lazer), include_fails: String(Number(include.fails))})
	}

	/**
	 * Get beatmaps favourited or made by a user!
	 * @param user The user in question
	 * @param type The relation between the user and the beatmaps
	 * @param config Array limit & offset
	 */
	export async function getBeatmaps(this: API, user: User["id"] | User, type: "favourite" | "graveyard" | "guest" | "loved" | "nominated" | "pending" | "ranked",
	config?: Config): Promise<Beatmapset.Extended.WithBeatmap[]> {
		return await this.request("get", `users/${getId(user)}/beatmapsets/${type}`, {limit: config?.limit, offset: config?.offset})
	}

	/**
	 * Get the beatmaps most played by a user!
	 * @param user The user who played the beatmaps
	 * @param config Array limit & offset
	 */
	export async function getMostPlayed(this: API, user: User["id"] | User, config?: Config): Promise<Beatmap.Playcount[]> {
		return await this.request("get", `users/${getId(user)}/beatmapsets/most_played`, {limit: config?.limit, offset: config?.offset})
	}

	/**
	 * Get an array of Events of different `type`s that relate to a user's activity during the last 31 days! (or 100 activities, whatever comes first)
	 * @param user The user in question
	 * @param config Array limit & offset
	 */
	export async function getRecentActivity(this: API, user: User["id"] | User, config?: Config): Promise<Event.AnyRecentActivity[]> {
		return await this.request("get", `users/${getId(user)}/recent_activity`, {limit: config?.limit, offset: config?.offset})
	}

	/**
	 * Get data about the activity of a user kudosu-wise!
	 * @param user The user in question
	 * @param config Array limit & offset
	 */
	export async function getKudosu(this: API, user: User["id"] | User, config?: Config): Promise<User.KudosuHistory[]> {
		return await this.request("get", `users/${getId(user)}/kudosu`, {limit: config?.limit, offset: config?.offset})
	}

	/**
	 * Get user data of each friend of the authorized user
	 * @scope {@link Scope"friends.read"}
	 * @remarks The Statistics will be of the authorized user's favourite ruleset, not the friend's!
	 */
	export async function getFriends(this: API): Promise<User.Relation[]> {
		return await this.request("get", "friends")
	}
}
