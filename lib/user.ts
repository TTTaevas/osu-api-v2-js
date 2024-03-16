import { Beatmapset, Beatmap } from "./beatmap.js"
import { Event } from "./event.js"
import { API } from "./index.js"
import { Rulesets } from "./misc.js"
import { Score } from "./score.js"

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

	export interface WithGroups extends User {
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

	/** @obtainableFrom {@link API.getUsers} */
	export interface WithCountryCoverGroupsStatisticsrulesets extends WithCountryCover, WithGroups {
		statistics_rulesets: {
			osu?: Statistics
			taiko?: Statistics
			fruits?: Statistics
			mania?: Statistics
		}
	}

	/** @obtainableFrom {@link API.getFriends} */
	export interface WithCountryCoverGroupsStatisticsSupport extends WithCountryCover, WithGroups {
		statistics: Statistics
		support_level: number
	}

	/** @obtainableFrom {@link API.getUser} */
	export interface Extended extends WithCountryCoverGroupsStatisticsSupport, WithKudosu {
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


	// FUNCTIONS

	/**
	 * Get extensive user data about the authorized user
	 * @scope {@link Scope"identify"}
	 * @param ruleset Defaults to the user's default Ruleset
	 */
	export async function getResourceOwner(this: API, ruleset?: Rulesets): Promise<User.Extended.WithStatisticsrulesets> {
		return await this.request("get", "me", {mode: ruleset})
	}
	
	/**
	 * Get extensive user data about whoever you want!
	 * @param user A user id, a username or a `User` object!
	 * @param ruleset Defaults to the user's default Ruleset
	 */
	export async function getOne(this: API, user: User["id"] | User["username"] | User, ruleset?: Rulesets): Promise<User.Extended> {
		const mode = ruleset !== undefined ? `/${Rulesets[ruleset]}` : ""
		if (typeof user === "string") return await this.request("get", `users/${user}${mode}`, {key: "username"})
		if (typeof user === "number") return await this.request("get", `users/${user}${mode}`, {key: "id"})
		return await this.request("get", `users/${user.id}${mode}`, {key: "id"})
	}

	/**
	 * Get user data for up to 50 users at once!
	 * @param users An array containing user ids or/and `User` objects!
	 */
	export async function getMultiple(this: API, users: Array<User["id"] | User>): Promise<User.WithCountryCoverGroupsStatisticsrulesets[]> {
		const ids = users.map((user) => typeof user === "number" ? user : user.id)
		const response = await this.request("get", "users", {ids})
		return response.users
	}

	/**
	 * Get "notable" scores from a user
	 * @param user The user who set the scores
	 * @param type Do you want scores: in the user's top 100, that are top 1 on a beatmap, that have been recently set?
	 * @param limit The maximum amount of scores to be returned
	 * @param ruleset The Ruleset the scores were made in, defaults to the user's default/favourite Ruleset
	 * @param include_fails (defaults to false) Do you want scores where the user didn't survive or quit the map?
	 * @param offset How many elements that would be at the top of the returned array get skipped (while still filling the array up to the limit)
	 */
	export async function getScores(this: API, user: User["id"] | User, type: "best" | "firsts" | "recent", limit?: number,
	ruleset?: Rulesets, include_fails: boolean = false, offset?: number): Promise<Score.WithUserBeatmapBeatmapset[]> {
		const mode = ruleset !== undefined ? Rulesets[ruleset] : undefined
		const id = typeof user === "number" ? user : user.id
		return await this.request("get", `users/${id}/scores/${type}`, {mode, limit, offset, include_fails: String(Number(include_fails))})
	}

	/**
	 * Get beatmaps favourited or made by a user!
	 * @param user The user in question
	 * @param type The relation between the user and the beatmaps
	 * @param limit (defaults to 5) The maximum amount of elements returned in the array
	 * @param offset How many elements that would be at the top of the returned array get skipped (while still filling the array up to the limit)
	 */
	export async function getBeatmaps(this: API, user: User["id"] | User, type: "favourite" | "graveyard" | "guest" | "loved" | "nominated" | "pending" | "ranked",
	limit: number = 5, offset?: number): Promise<Beatmapset.Extended.WithBeatmapExtended[]> {
		const id = typeof user === "number" ? user : user.id
		return await this.request("get", `users/${id}/beatmapsets/${type}`, {limit, offset})
	}

	/**
	 * Get the beatmaps most played by a user!
	 * @param user The user who played the beatmaps
	 * @param limit (defaults to 5) The maximum amount of elements returned in the array
	 * @param offset How many elements that would be at the top of the returned array get skipped (while still filling the array up to the limit)
	 */
	export async function getMostPlayed(this: API, user: User["id"] | User, limit: number = 5, offset?: number): Promise<Beatmap.Playcount[]> {
		const id = typeof user === "number" ? user : user.id
		return await this.request("get", `users/${id}/beatmapsets/most_played`, {limit, offset})
	}

	/**
	 * Get an array of Events of different `type`s that relate to a user's activity during the last 31 days! (or 100 activities, whatever comes first)
	 * @param user The user in question
	 * @param limit (defaults to 5) The maximum amount of elements returned in the array
	 * @param offset How many elements that would be at the top of the returned array get skipped (while still filling the array up to the limit)
	 */
	export async function getRecentActivity(this: API, user: User["id"] | User, limit: number = 5, offset?: number): Promise<Array<Event.AnyRecentActivity>> {
		const id = typeof user === "number" ? user : user.id
		return await this.request("get", `users/${id}/recent_activity`, {limit, offset})
	}

	/**
	 * Get data about the activity of a user kudosu-wise!
	 * @param user The user in question
	 * @param limit (defaults to 5) The maximum amount of activities in the returned array
	 * @param offset How many elements that would be at the top of the returned array get skipped (while still filling the array up to the limit)
	 */
	export async function getKudosu(this: API, user: User["id"] | User, limit?: number, offset?: number): Promise<User.KudosuHistory[]> {
		const id = typeof user === "number" ? user : user.id
		return await this.request("get", `users/${id}/kudosu`, {limit, offset})
	}

	/**
	 * Get user data of each friend of the authorized user
	 * @scope {@link Scope"friends.read"}
	 */
	export async function getFriends(this: API): Promise<User.WithCountryCoverGroupsStatisticsSupport[]> {
		return await this.request("get", "friends")
	}
}
