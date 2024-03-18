import { Beatmap } from "./beatmap.js"
import { API } from "./index.js"
import { Genres, Languages, RankStatus, Rulesets } from "./misc.js"
import { User } from "./user.js"

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
			beatmap_discussion_id?: number | null
			beatmap_discussion_post_id?: number | null
			reason?: string
			old?: keyof typeof Genres | keyof typeof Languages | boolean
			new?: keyof typeof Genres | keyof typeof Languages | boolean
			modes?: (keyof typeof Rulesets)[]
			new_vote?: {
				user_id: number
				score: number
			}
			votes?: {
				user_id: number
				score: number
			}[]
		} | null
		created_at: Date
		user_id: number | null
		beatmapset: Beatmapset.WithUserHype
		discussion?: Beatmapset.Discussion.WithStartingpost | null
	}

	export namespace Event {
		/**
		 * Get complex data about the events of a beatmapset and the users involved with them!
		 * @param from Which beatmapset, or caused by which user? When?
		 * @param types What kinds of events?
		 * @param cursor_stuff How many results maximum to get, which page of those results, a cursor_string if you have that...
		 * @param sort (defaults to "id_desc") "id_asc" to have the oldest recent event first, "id_desc" to have the newest instead
		 * @returns Relevant events and users
		 * @remarks (2024-03-11) For months now, the API's documentation says the response is likely to change, so beware,
		 * and also there's no documentation for this route in the API, so this is only the result of my interpretation of the website's code lol
		 */
		export async function getMultiple(this: API, from?: {beatmapset?: Beatmapset | {id: number}, user?: User | {id: number}, min_date?: Date, max_date?: Date},
		types?: Beatmapset.Event["type"][], cursor_stuff?: {page?: number, limit?: number, cursor_string?: string}, sort: "id_desc" | "id_asc" = "id_desc"):
		Promise<{events: Beatmapset.Event[], users: User.WithGroups[]}> {
			return await this.request("get", "beatmapsets/events", {beatmapset_id: from?.beatmapset?.id, user: from?.user?.id, min_date: from?.min_date?.toISOString(),
			max_date: from?.max_date?.toISOString(), types, sort, page: cursor_stuff?.page, limit: cursor_stuff?.page, cursor_string: cursor_stuff?.cursor_string})
		}
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

		export namespace Post {
			/**
			 * Get complex data about the posts of a beatmapset's discussion or of a user!
			 * @param from From where/who are the posts coming from? A specific discussion, a specific user?
			 * @param types What kind of posts?
			 * @param cursor_stuff How many results maximum to get, which page of those results, a cursor_string if you have that...
			 * @param sort (defaults to "id_desc") "id_asc" to have the oldest recent post first, "id_desc" to have the newest instead
			 * @returns Relevant posts and info about them
			 * @remarks (2024-03-11) For months now, the API's documentation says the response is likely to change, so beware
			 */
			export async function getMultiple(this: API, from?: {discussion?: Beatmapset.Discussion | {id: number}, user?: User | {id: number}},
			types?: ("first" | "reply" | "system")[], cursor_stuff?: {page?: number, limit?: number, cursor_string?: string}, sort: "id_desc" | "id_asc" = "id_desc"):
			Promise<{beatmapsets: Beatmapset.WithHype[], posts: Beatmapset.Discussion.Post[], users: User[], cursor_string: string}> {
				return await this.request("get", "beatmapsets/discussions/posts", {beatmapset_discussion_id: from?.discussion?.id, limit: cursor_stuff?.limit,
				page: cursor_stuff?.page, sort, types, user: from?.user?.id, cursor_string: cursor_stuff?.cursor_string})
			}
		}

		export interface Vote {
			beatmapset_discussion_id: number
			created_at: Date
			id: number
			score: number
			updated_at: Date
			user_id: number
		}

		export namespace Vote {
			/**
			 * Get complex data about the votes of a beatmapset's discussions or/and received/given by a specific user!
			 * @param from The discussion with the votes, the user who voted, the user who's gotten the votes...
			 * @param score An upvote (1) or a downvote (-1)
			 * @param cursor_stuff How many results maximum to get, which page of those results, a cursor_string if you have that...
			 * @param sort (defaults to "id_desc") "id_asc" to have the oldest recent vote first, "id_desc" to have the newest instead
			 * @returns Relevant votes and info about them
			 * @remarks (2024-03-11) For months now, the API's documentation says the response is likely to change, so beware
			 */
			export async function getMultiple(this: API, from?: {discussion?: Beatmapset.Discussion | {id: number}, vote_giver?: User | {id: number},
			vote_receiver?: User | {id: number}}, score?: 1 | -1, cursor_stuff?: {page?: number, limit?: number, cursor_string?: string},
			sort: "id_desc" | "id_asc" = "id_desc"): Promise<{votes: Beatmapset.Discussion.Vote[], discussions: Beatmapset.Discussion[], users: User.WithGroups[],
			cursor_string: string}> {
				return await this.request("get", "beatmapsets/discussions/votes", {beatmapset_discussion_id: from?.discussion?.id, limit: cursor_stuff?.limit,
				page: cursor_stuff?.page, receiver: from?.vote_receiver?.id, score, sort, user: from?.vote_giver?.id, cursor_string: cursor_stuff?.cursor_string})
			}
		}

		/**
		 * Get complex data about the discussion page of any beatmapet that you want!
		 * @param from From where/who are the discussions coming from? Maybe only qualified sets?
		 * @param filter Should those discussions only be unresolved problems, for example?
		 * @param cursor_stuff How many results maximum to get, which page of those results, a cursor_string if you have that...
		 * @param sort (defaults to "id_desc") "id_asc" to have the oldest recent discussion first, "id_desc" to have the newest instead
		 * @returns Relevant discussions and info about them
		 * @remarks (2024-03-11) For months now, the API's documentation says the response is likely to change, so beware
		 * @privateRemarks I don't allow setting `beatmap_id` because my testing has led me to believe it does nothing (and is therefore misleading)
		 */
		export async function getMultiple(this: API, from?: {beatmapset?: Beatmapset | {id: number}, user?: User | {id: number},
		status?: "all" | "ranked" | "qualified" | "disqualified" | "never_qualified"}, filter?: {types?: Beatmapset.Discussion["message_type"][],
		only_unresolved?: boolean}, cursor_stuff?: {page?: number, limit?: number, cursor_string?: string}, sort: "id_desc" | "id_asc" = "id_desc"):
		Promise<{beatmaps: Beatmap.Extended[], beatmapsets: Beatmapset.Extended[], discussions: Beatmapset.Discussion.WithStartingpost[]
		included_discussions: Beatmapset.Discussion.WithStartingpost[], reviews_config: {max_blocks: number}, users: User.WithGroups[], cursor_string: string}> {
			return await this.request("get", "beatmapsets/discussions", {beatmapset_id: from?.beatmapset?.id, beatmapset_status: from?.status,
			limit: cursor_stuff?.limit, message_types: filter?.types, only_unresolved: filter?.only_unresolved, page: cursor_stuff?.page, sort,
			user: from?.user?.id, cursor_string: cursor_stuff?.cursor_string})
		}
	}

	/**
	 * Search for beatmapsets as if you were on the website or on lazer!
	 * @param query All the filters and sorting options that you'd normally find on the website or on lazer 
	 * @returns Relevant Beatmapsets that contain Beatmaps, and a cursor_string to allow you to look for more of the same!
	 * @remarks This does not bypass the current osu!supporter requirement for certain filters
	 */
	export async function search(this: API, query?: {
		/** What you'd put in the searchbar, like the name of a beatmapset or a mapper! */
		keywords?: string
		/** Sort by what, in ascending/descending order */
		sort?: {by: "title" | "artist" | "difficulty" | "ranked" | "rating" | "plays" | "favourites" | "updated", in: "asc" | "desc"},
		/** Various filters to activate */
		general?: ("Recommended difficulty" | "Include converted beatmaps" | "Subscribed mappers" | "Spotlighted beatmaps" | "Featured Artists")[],
		/** Only get sets that have maps that you can play in the ruleset of your choice */
		mode?: Rulesets,
		/** (defaults to all that have leaderboard) Filter in sets depending on their status or on their relation with the authorized user */
		categories?: "Any" | "Ranked" | "Qualified" | "Loved" | "Favourites" | "Pending" | "WIP" | "Graveyard" | "My Maps",
		/** Use this to hide all sets that are marked as explicit */
		hide_explicit_content?: true,
		/** Specify the musical genre of the music of the beatmapsets you're searching for */
		genre?: Exclude<Genres, 0>,
		/** Specify the spoken language of the music of the beatmapsets you're searching for */
		language?: Exclude<Languages, 0>,
		/** Should all sets have a video, a storyboard, maybe both at once? */
		extra?: ("must_have_video" | "must_have_storyboard")[],
		/** Does the authorized user with osu!supporter have already achieved certain ranks on those sets? */
		rank_achieved?: ("Silver SS" | "SS" | "Silver S" | "S" | "A" | "B" | "C" | "D")[],
		/** Does the authorized user with osu!supporter have already played those sets, or have they not played them yet? */
		played?: "Played" | "Unplayed",
		/** The thing you've got from a previous request to get another page of results! */
		cursor_string?: string
	}):
	Promise<{beatmapsets: Beatmapset.Extended.WithBeatmapExtendedPacktags[], recommended_difficulty: number | null, total: number, error: any | null,
	cursor_string: string | null}> {
		const sort = query?.sort ? (query.sort.by + "_" + query.sort.in) : undefined
		const c = query?.general ? query.general.map((general_value) => {
			if (general_value === "Recommended difficulty") return "recommended"
			if (general_value === "Include converted beatmaps") return "converts"
			if (general_value === "Subscribed mappers") return "follows"
			if (general_value === "Spotlighted beatmaps") return "spotlights"
			if (general_value === "Featured Artists") return "featured_artists"
		}).join(".") : undefined
		const s = query?.categories ? query.categories === "My Maps" ? "mine" : query.categories.toLowerCase() : undefined
		const nsfw = query?.hide_explicit_content ? false : undefined
		const e = query?.extra ? query.extra.map((extra_value) => {
			if (extra_value === "must_have_video") return "video"
			if (extra_value === "must_have_storyboard") return "storyboard"
		}).join(".") : undefined
		const r = query?.rank_achieved ? query.rank_achieved.map((rank_achieved_value) => {
			if (rank_achieved_value === "Silver SS") return "XH"
			if (rank_achieved_value === "SS") return "X"
			if (rank_achieved_value === "Silver S") return "SH"
			return rank_achieved_value
		}).join("x") : undefined
		const played = query?.played ? query.played.toLowerCase() : undefined
	
		return await this.request("get", `beatmapsets/search`,
		{q: query?.keywords, sort, c, m: query?.mode, s, nsfw, g: query?.genre, l: query?.language, e, r, played, cursor_string: query?.cursor_string})
	}

	/**
	 * Get extensive data about a beatmapset by using a beatmap!
	 * @param beatmap A beatmap from the beatmapset you're looking for
	 */
	export async function lookup(this: API, beatmap: {id: number} | Beatmap): Promise<Beatmapset.Extended.Plus> {
		return await this.request("get", `beatmapsets/lookup`, {beatmap_id: beatmap.id})
	}

	/**
	 * Get extensive beatmapset data about whichever beatmapset you want!
	 * @param beatmapset An object with the id of the beatmapset you're trying to get
	 */
	export async function getOne(this: API, beatmapset: {id: number} | Beatmapset): Promise<Beatmapset.Extended.Plus> {
		return await this.request("get", `beatmapsets/${beatmapset.id}`)
	}
}
