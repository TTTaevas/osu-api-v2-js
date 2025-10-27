import { API, Beatmap, Miscellaneous, Ruleset, User } from "../index.js"

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
	creator: User["username"]
	favourite_count: number
	genre_id: Beatmapset.Genre
	id: number
	language_id: Beatmapset.Language
	nsfw: boolean
	offset: number
	play_count: number
	/** A string like that where id is the `id` of the beatmapset: `//b.ppy.sh/preview/<id>.mp3` */
	preview_url: string
	source: string
	spotlight: boolean
	/** Is it ranked, is it graveyarded, etc */
	status: Lowercase<keyof typeof Beatmapset.RankStatus>
	/** A title readable by any english-speaking person, so it'd be in romaji if the song's title is in Japanese */
	title: string
	/** Basically the title is the original language, so with hiragana, katakana and kanji if Japanese */
	title_unicode: string
	/**
	 * If the song exists on a featured artist's page, then it has a `track_id`
	 * @remarks https://osu.ppy.sh/beatmaps/artists/tracks/<track_id> redirects to the page of said featured artist
	 */
	track_id: number | null
	user_id: User["id"]
	video: boolean
}

export namespace Beatmapset {
	export enum RankStatus {
		Graveyard 	= -2,
		Wip 		= -1,
		Pending		= 0,
		Ranked		= 1,
		Approved	= 2,
		Qualified	= 3,
		Loved 		= 4,
	}

	export enum Genre {
		Any				= 0,
		Unspecified		= 1,
		"Video Game"	= 2,
		Anime			= 3,
		Rock			= 4,
		Pop				= 5,
		Other			= 6,
		Novelty			= 7,
		"Hip Hop"		= 9,
		Electronic		= 10,
		Metal			= 11,
		Classical		= 12,
		Folk			= 13,
		Jazz			= 14,
	}

	export enum Language {
		Any				= 0,
		Unspecified		= 1,
		English			= 2,
		Japanese 		= 3,
		Chinese			= 4,
		Instrumental	= 5,
		Korean			= 6,
		French			= 7,
		German			= 8,
		Swedish			= 9,
		Spanish			= 10,
		Italian			= 11,
		Russian			= 12,
		Polish			= 13,
		Other			= 14,
	}

	/** @obtainableFrom {@link API.getBeatmapsetEvents} */
	export interface Event {
		id: number
		/** 
		 * @remarks "approve" is currently not used, it's here just in case that ever changes
		 * https://github.com/ppy/osu-web/blob/master/app/Models/BeatmapsetEvent.php
		 */
		type: "nominate" | "love" | "remove_from_loved" | "qualify" | "disqualify" | "approve" | "rank" |
			"kudosu_allow" | "kudosu_deny" | "kudosu_gain" | "kudosu_lost" | "kudosu_recalculate" |
			"issue_resolve" | "issue_reopen" | "discussion_lock" | "discussion_unlock" | "discussion_delete" | "discussion_restore" |
			"discussion_post_delete" | "discussion_post_restore" | "nomination_reset" | "nomination_reset_received" |
			"genre_edit" | "language_edit" | "nsfw_toggle" | "offset_edit" | "tags_edit" | "beatmap_owner_change"
		comment: object | null
		created_at: Date
	}

	export namespace Event {
		/** An event's comment (unrelated to comments in bundles) can be a **lot** of things depending of the event type */
		export interface Comment {}

		/** @remarks Unrelated to comments in bundles! */
		export namespace Comment {
			export interface WithModes extends Comment {
				modes: (keyof typeof Ruleset)[]
			}

			export interface WithDiscussionidPostid extends Comment {
				beatmap_discussion_id: Discussion["id"] | null
				beatmap_discussion_post_id: Discussion.Post["id"] | null
			}

			export interface WithDiscussionidPostidReason extends WithDiscussionidPostid {
				reason: string
			}

			export interface WithDiscussionidPostidNominatorsids extends WithDiscussionidPostid {
				nominator_ids: User["id"][]
			}

			export interface WithDiscussionidPostidOldgenreNewgenre extends WithDiscussionidPostid {
				old: keyof typeof Genre
				new: keyof typeof Genre
			}

			export interface WithDiscussionidPostidOldlanguageNewlanguage extends WithDiscussionidPostid {
				old: keyof typeof Language
				new: keyof typeof Language
			}

			export interface WithDiscussionidPostidOldnsfwNewnsfw extends WithDiscussionidPostid {
				old: boolean
				new: boolean
			}

			export interface WithDiscussionidPostidOldoffsetNewoffset extends WithDiscussionidPostid {
				old: number
				new: number
			}

			export interface WithDiscussionidPostidOldtagsNewtags extends WithDiscussionidPostid {
				old: string
				new: string
			}

			export interface WithDiscussionidPostidNewvotevotes extends WithDiscussionidPostid {
				new_vote: {
					user_id: User["id"]
					score: number
				}
				votes: {
					user_id: User["id"]
					score: number
				}[]
			}

			export interface WithDiscussionidPostidSourceuseridSourceuserusername extends WithDiscussionidPostid {
				source_user_id: User["id"]
				source_user_username: User["username"]
			}

			export interface WithDiscussionidPostidBeatmapidBeatmapversionNewuseridNewuserusername extends WithDiscussionidPostid {
				beatmap_id: Beatmap["id"]
				beatmap_version: Beatmap["version"]
				new_user_id: User["id"]
				new_user_username: User["username"]
			}
		}

		interface WithUserid extends Event {
			user_id: User["id"]
		}

		interface WithOptionalUserid extends Event {
			user_id?: User["id"]
		}

		/** A Beatmapset can only be optional as events may relate to Beatmapsets that have been made private or were deleted */
		interface WithOptionalBeatmapset extends Event {
			beatmapset?: Beatmapset.WithUserHype
		}

		interface WithDiscussion extends Event {
			discussion: Discussion.WithStartingpost
		}

		interface WithOptionalDiscussion extends Event {
			discussion?: Discussion.WithStartingpost | null
		}

		/** @group Beatmap Change */
		export interface BeatmapOwnerChange extends WithUserid, WithOptionalBeatmapset {
			type: "beatmap_owner_change"
			comment: Comment.WithDiscussionidPostidBeatmapidBeatmapversionNewuseridNewuserusername
		}

		/** @group Beatmap Change */
		export interface GenreEdit extends WithUserid, WithOptionalBeatmapset {
			type: "genre_edit"
			comment: Comment.WithDiscussionidPostidOldgenreNewgenre
		}

		/** @group Beatmap Change */
		export interface LanguageEdit extends WithUserid, WithOptionalBeatmapset {
			type: "language_edit"
			comment: Comment.WithDiscussionidPostidOldlanguageNewlanguage
		}

		/** @group Beatmap Change */
		export interface NsfwToggle extends WithUserid, WithOptionalBeatmapset {
			type: "nsfw_toggle"
			comment: Comment.WithDiscussionidPostidOldnsfwNewnsfw
		}

		/** @group Beatmap Change */
		export interface OffsetEdit extends WithUserid, WithOptionalBeatmapset {
			type: "offset_edit"
			comment: Comment.WithDiscussionidPostidOldoffsetNewoffset
		}

		/** @group Beatmap Change */
		export interface TagsEdit extends WithOptionalUserid, WithOptionalBeatmapset, WithOptionalDiscussion {
			type: "tags_edit"
			comment: Comment.WithDiscussionidPostidOldtagsNewtags
		}

		/** @group Beatmap Change */
		export type AnyBeatmapChange =
			| BeatmapOwnerChange
			| GenreEdit
			| LanguageEdit
			| NsfwToggle
			| OffsetEdit
			| TagsEdit

		/** @group Beatmapset Status Change */
		export interface Approve extends Event {
			type: "approve"
			comment: null
		}

		/** @group Beatmapset Status Change */
		export interface Qualify extends WithOptionalBeatmapset {
			type: "qualify"
			comment: null
		}

		/** @group Beatmapset Status Change */
		export interface Rank extends WithOptionalBeatmapset {
			type: "rank"
			comment: null
		}

		/** @group Beatmapset Status Change */
		export interface Love extends WithOptionalBeatmapset {
			type: "love"
			comment: null
		}

		/** @group Beatmapset Status Change */
		export interface Nominate extends WithUserid, WithOptionalBeatmapset {
			type: "nominate"
			comment: Comment.WithModes
		}

		/** @group Beatmapset Status Change */
		export interface RemoveFromLoved extends WithUserid, WithOptionalBeatmapset {
			type: "remove_from_loved"
			comment: Comment.WithDiscussionidPostidReason
		}

		/** @group Beatmapset Status Change */
		export interface Disqualify extends WithUserid, WithOptionalBeatmapset, WithOptionalDiscussion {
			type: "disqualify"
			comment: Comment.WithDiscussionidPostidNominatorsids
		}

		/** @group Beatmapset Status Change */
		export interface NominationReset extends WithUserid, WithOptionalBeatmapset, WithDiscussion {
			type: "nomination_reset"
			comment: Comment.WithDiscussionidPostidNominatorsids
		}

		/** @group Beatmapset Status Change */
		export interface NominationResetReceived extends WithUserid, WithOptionalBeatmapset, WithOptionalDiscussion {
			type: "nomination_reset_received"
			comment: Comment.WithDiscussionidPostidSourceuseridSourceuserusername
		}

		/** @group Beatmapset Status Change */
		export type AnyBeatmapsetStatusChange =
			| Qualify
			| Rank
			| Love
			| Nominate
			| RemoveFromLoved
			| Disqualify
			| NominationReset
			| NominationResetReceived

		/** @group Discussion Change */
		export interface DiscussionDelete extends WithOptionalBeatmapset {
			type: "discussion_delete"
			comment: Comment.WithDiscussionidPostid
		}

		/** @group Discussion Change */
		export interface DiscussionRestore extends WithOptionalBeatmapset, WithOptionalDiscussion {
			type: "discussion_restore"
			comment: Comment.WithDiscussionidPostid
		}

		/** @group Discussion Change */
		export interface DiscussionPostRestore extends WithOptionalBeatmapset, WithOptionalDiscussion {
			type: "discussion_post_restore"
			comment: Comment.WithDiscussionidPostid
		}

		/** @group Discussion Change */
		export interface DiscussionPostDelete extends WithOptionalBeatmapset, WithOptionalDiscussion {
			type: "discussion_post_delete"
			comment: Comment.WithDiscussionidPostid
		}

		/** @group Discussion Change */
		export interface DiscussionLock extends WithUserid, WithOptionalBeatmapset, WithOptionalDiscussion {
			type: "discussion_lock"
			comment: Comment.WithDiscussionidPostid
		}

		/** @group Discussion Change */
		export interface DiscussionUnlock extends WithUserid, WithOptionalBeatmapset, WithOptionalDiscussion {
			type: "discussion_unlock"
			comment: Comment.WithDiscussionidPostid
		}
		
		/** @group Discussion Change */
		export interface IssueResolve extends WithUserid, WithOptionalBeatmapset, WithOptionalDiscussion {
			type: "issue_resolve"
			comment: Comment.WithDiscussionidPostid
		}

		/** @group Discussion Change */
		export interface IssueReopen extends WithUserid, WithOptionalBeatmapset, WithOptionalDiscussion {
			type: "issue_reopen"
			comment: Comment.WithDiscussionidPostid
		}

		/** @group Discussion Change */
		export type AnyDiscussionChange = 
			| DiscussionDelete
			| DiscussionRestore
			| DiscussionPostRestore
			| DiscussionPostDelete
			| DiscussionLock
			| DiscussionUnlock
			| IssueResolve
			| IssueReopen

		/** @group Kudosu Change */
		export interface KudosuAllow extends WithOptionalBeatmapset, WithOptionalDiscussion {
			type: "kudosu_allow"
			comment: Comment.WithDiscussionidPostid
		}

		/** @group Kudosu Change */
		export interface KudosuDeny extends WithOptionalBeatmapset, WithOptionalDiscussion {
			type: "kudosu_deny"
			comment: Comment.WithDiscussionidPostid
		}

		/** @group Kudosu Change */
		export interface KudosuRecalculate extends WithOptionalBeatmapset, WithOptionalDiscussion {
			type: "kudosu_recalculate"
			comment: Comment.WithDiscussionidPostid
		}

		/** @group Kudosu Change */
		export interface KudosuGain extends WithUserid, WithOptionalBeatmapset, WithOptionalDiscussion {
			type: "kudosu_gain"
			comment: Comment.WithDiscussionidPostidNewvotevotes
		}

		/** @group Kudosu Change */
		export interface KudosuLost extends WithUserid, WithOptionalBeatmapset, WithOptionalDiscussion {
			type: "kudosu_lost"
			comment: Comment.WithDiscussionidPostidNewvotevotes
		}

		/** @group Kudosu Change */
		export type AnyKudosuChange =
			| KudosuAllow
			| KudosuDeny
			| KudosuRecalculate
			| KudosuGain
			| KudosuLost

		export type Any = AnyBeatmapChange | AnyBeatmapsetStatusChange | AnyDiscussionChange | AnyKudosuChange

		/**
		 * Get complex data about the events of a beatmapset and the users involved with them!
		 * @param from Which beatmapset, or caused by which user? When?
		 * @param types What kinds of events?
		 * @param config How many results maximum, how to sort them, which page of those, maybe a cursor_string...
		 * @returns Relevant events and users
		 * @remarks This route is undocumented in the API docs, so this is only the result of my interpretation of the website's code and could be unstable
		 */
		export async function getMultiple(this: API, from?: {beatmapset?: Beatmapset["id"] | Beatmapset, user?: User["id"] | User, min_date?: Date, max_date?: Date},
		types?: Event["type"][], config?: Miscellaneous.Config):
		Promise<{events: Event.Any[], users: User.WithGroups[]}> {
			const beatmapset = typeof from?.beatmapset === "object" ? from.beatmapset.id : from?.beatmapset
			const user = typeof from?.user === "object" ? from.user.id : from?.user
			return await this.request("get", ["beatmapsets", "events"], {beatmapset_id: beatmapset, user, min_date: from?.min_date?.toISOString(),
			max_date: from?.max_date?.toISOString(), types, ...config})
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
			/** So it's `false` if you CAN download it */
			download_disabled: boolean
			more_information: string | null
		}
		bpm: number
		can_be_hyped: boolean
		deleted_at: Date | null
		discussion_locked: boolean
		is_scoreable: boolean
		last_updated: Date
		/** In the following format: `https://osu.ppy.sh/community/forums/topics/<topic_id>` */
		legacy_thread_url: string
		nominations_summary: {
			current: number
			eligible_main_rulesets: (keyof typeof Ruleset)[] | null
			/** Required nominations */
			required_meta: {
				main_ruleset: number
				non_main_ruleset: number
			}
		}
		ranked: RankStatus
		ranked_date: Date | null
		rating: number
		storyboard: boolean
		submitted_date: Date | null
		tags: string
	}

	export namespace Extended {
		/** @obtainableFrom {@link API.getUserBeatmaps} */
		export interface WithBeatmap extends Extended {
			beatmaps: Beatmap.Extended[]
		}

		/** @obtainableFrom {@link API.searchBeatmapsets} */
		export interface WithBeatmapPacktags extends Extended {
			beatmaps: Beatmap.Extended.WithMaxcombo[]
			pack_tags: string[]
		}

		/** 
		 * @obtainableFrom
		 * {@link API.getBeatmapset} /
		 * {@link API.lookupBeatmapset}
		 */
		export interface Plus extends Extended, WithUserHype {
			/** The different beatmaps/difficulties this beatmapset has */
			beatmaps: Beatmap.Extended.WithFailtimesOwnersMaxcomboToptagids[]
			/** The different beatmaps made for osu!, but converted to the other Rulesets */
			converts: Beatmap.Extended.WithFailtimesOwners[]
			current_nominations: {
				beatmapset_id: Beatmapset["id"]
				rulesets: Ruleset[] | null
				reset: boolean
				user_id: User["id"]
			}[]
			description: {
				/** In HTML */
				description: string
			}
			genre: {
				id: Genre
				name: keyof typeof Genre
			}
			language: {
				id: Language
				name: keyof typeof Language
			}
			pack_tags: string[]
			ratings: number[]
			recent_favourites: User[]
			related_users: User[]
			/** Tags that have been voted for by users in some of this Beatmapset's Beatmaps! */
			related_tags: Beatmap.UserTag.WithDates[]
			version_count: number
			/** Only exists if authorized user */
			has_favourited?: boolean
		}
	}

	export interface Discussion {
		id: number
		beatmapset_id: Beatmapset["id"]
		beatmap_id: Beatmap["id"] | null
		user_id: User["id"]
		deleted_by_id: User["id"] | null
		message_type: "suggestion" | "problem" | "mapper_note" | "praise" | "hype" | "review"
		/** For example, the id of the review this discussion is included in */
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
		/** @obtainableFrom {@link API.getBeatmapsetDiscussions} */
		export interface WithStartingpost extends Discussion {
			starting_post: Post
		}

		/** @obtainableFrom {@link API.getBeatmapsetDiscussionPosts} */
		export interface Post {
			beatmapset_discussion_id: Discussion["id"]
			created_at: Date
			deleted_at: Date | null
			deleted_by_id: User["id"] | null
			id: number
			last_editor_id: User["id"] | null
			message: string
			system: boolean
			updated_at: Date
			user_id: User["id"]
		}

		export namespace Post {
			/**
			 * Get complex data about the posts of a beatmapset's discussion or of a user!
			 * @param from From where/who are the posts coming from? A specific discussion, a specific user?
			 * @param types What kind of posts?
			 * @param config How many results maximum, how to sort them, which page of those, maybe a cursor_string...
			 * @returns Relevant posts and info about them
			 */
			export async function getMultiple(this: API, from?: {discussion?: Discussion["id"] | Discussion, user?: User["id"] | User},
			types?: ("first" | "reply" | "system")[], config?: Miscellaneous.Config):
			Promise<{beatmapsets: Beatmapset.WithHype[], posts: Post[], users: User[], cursor_string: Miscellaneous.CursorString | null}> {
				const discussion = typeof from?.discussion === "object" ? from.discussion.id : from?.discussion
				const user = typeof from?.user === "object" ? from.user.id : from?.user
				return await this.request("get", ["beatmapsets", "discussions", "posts"], {beatmapset_discussion_id: discussion, types, user, ...config})
			}
		}

		/** @obtainableFrom {@link API.getBeatmapsetDiscussionVotes} */
		export interface Vote {
			beatmapset_discussion_id: Discussion["id"]
			created_at: Date
			id: number
			score: number
			updated_at: Date
			user_id: User["id"]
		}

		export namespace Vote {
			/**
			 * Get complex data about the votes of a beatmapset's discussions or/and received/given by a specific user!
			 * @param from The discussion with the votes, the user who voted, the user who's gotten the votes...
			 * @param score An upvote (1) or a downvote (-1)
			 * @param config How many results maximum, how to sort them, which page of those, maybe a cursor_string...
			 * @returns Relevant votes and info about them
			 */
			export async function getMultiple(this: API, from?: {discussion?: Discussion["id"] | Discussion, vote_giver?: User["id"] | User,
			vote_receiver?: User["id"] | User}, score?: 1 | -1, config?: Miscellaneous.Config):
			Promise<{votes: Vote[], discussions: Discussion[], users: User.WithGroups[], cursor_string: Miscellaneous.CursorString | null}> {
				const discussion = typeof from?.discussion === "object" ? from.discussion.id : from?.discussion
				const user = typeof from?.vote_giver === "object" ? from.vote_giver.id : from?.vote_giver
				const receiver = typeof from?.vote_receiver === "object" ? from.vote_receiver.id : from?.vote_receiver

				return await this.request("get", ["beatmapsets", "discussions", "votes"],
				{beatmapset_discussion_id: discussion, receiver, score, user, ...config})
			}
		}

		/**
		 * Get complex data about the discussion page of any beatmapet that you want!
		 * @param from From where/who are the discussions coming from? Maybe only qualified sets?
		 * @param filter Should those discussions only be unresolved problems, for example?
		 * @param config How many results maximum, how to sort them, which page of those, maybe a cursor_string...
		 * @returns Relevant discussions and info about them
		 * @privateRemarks I don't allow setting `beatmap_id` because my testing has led me to believe it does nothing (and is therefore misleading)
		 */
		export async function getMultiple(this: API, from?: {
			beatmapset?: Beatmapset["id"] | Beatmapset,
			user?: User["id"] | User,
			status?: "all" | "ranked" | "qualified" | "disqualified" | "never_qualified"
		}, filter?: {
			types?: Beatmapset.Discussion["message_type"][],
			only_unresolved?: boolean
		}, config?: Miscellaneous.Config):
		Promise<{
			beatmaps: Beatmap.Extended[],
			beatmapsets: Beatmapset.Extended[],
			discussions: Beatmapset.Discussion.WithStartingpost[]
			included_discussions: Beatmapset.Discussion.WithStartingpost[],
			reviews_config: {max_blocks: number},
			users: User.WithGroups[],
			cursor_string: Miscellaneous.CursorString | null
		}> {
			const beatmapset_id = typeof from?.beatmapset === "object" ? from.beatmapset.id : from?.beatmapset
			const user_id = typeof from?.user === "object" ? from.user.id : from?.user

			return await this.request("get", ["beatmapsets", "discussions"], {beatmapset_id, beatmapset_status: from?.status,
			message_types: filter?.types, only_unresolved: filter?.only_unresolved, user: user_id, ...config})
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
		mode?: Ruleset,
		/** Filter in sets depending on their status or on their relation with the authorized user (defaults to **all that have a leaderboard**) */
		categories?: "Any" | "Ranked" | "Qualified" | "Loved" | "Favourites" | "Pending" | "WIP" | "Graveyard" | "My Maps",
		/** Use this to hide all sets that are marked as explicit */
		hide_explicit_content?: true,
		/** 
		 * Specify the musical genre of the music of the beatmapsets you're searching for (don't specify to get any genre)
		 * @remarks "Any"/0 actually looks up sets that specifically have the Genre "Any" such as `5947`, it's excluded because it's counter-intuitive
		 * and near useless (but you can do something like `1-1` if you actually want that!)
		 */
		genre?: Exclude<Genre, 0>,
		/** 
		 * Specify the spoken language of the music of the beatmapsets you're searching for (don't specify to get any language)
		 * @remarks "Any"/0 actually looks up sets that specifically have the Language "Any" (and no set has that), it's excluded because it's counter-intuitive
		 * and near useless (but you can do something like `1-1` if you actually want that!)
		 */
		language?: Exclude<Language, 0>,
		/** Should all sets have a video, a storyboard, maybe both at once? */
		extra?: ("must_have_video" | "must_have_storyboard")[],
		/** Does the authorized user with osu!supporter have already achieved certain ranks on those sets? */
		rank_achieved?: ("Silver SS" | "SS" | "Silver S" | "S" | "A" | "B" | "C" | "D")[],
		/** Does the authorized user with osu!supporter have already played those sets, or have they not played them yet? */
		played?: "Played" | "Unplayed",
		/** The thing you've got from a previous request to get another page of results! */
		cursor_string?: Miscellaneous.CursorString
	}):
	Promise<{beatmapsets: Beatmapset.Extended.WithBeatmapPacktags[], recommended_difficulty: number | null, total: number, error: any | null,
	cursor_string: Miscellaneous.CursorString | null}> {
		const sort = query?.sort ? (query.sort.by + "_" + query.sort.in) : undefined

		/** General */
		const c = query?.general ? query.general.map((general_value) => {
			if (general_value === "Recommended difficulty") return "recommended"
			if (general_value === "Include converted beatmaps") return "converts"
			if (general_value === "Subscribed mappers") return "follows"
			if (general_value === "Spotlighted beatmaps") return "spotlights"
			if (general_value === "Featured Artists") return "featured_artists"
		}).join(".") : undefined

		/** Categories */
		const s = query?.categories ? query.categories === "My Maps" ? "mine" : query.categories.toLowerCase() : undefined

		/** Explicit Content */
		const nsfw = query?.hide_explicit_content ? false : true

		/** Extra */
		const e = query?.extra ? query.extra.map((extra_value) => {
			if (extra_value === "must_have_video") return "video"
			if (extra_value === "must_have_storyboard") return "storyboard"
		}).join(".") : undefined

		/** Rank Achieved */
		const r = query?.rank_achieved ? query.rank_achieved.map((rank_achieved_value) => {
			if (rank_achieved_value === "Silver SS") return "XH"
			if (rank_achieved_value === "SS") return "X"
			if (rank_achieved_value === "Silver S") return "SH"
			return rank_achieved_value
		}).join("x") : undefined

		/** Played */
		const played = query?.played ? query.played.toLowerCase() : undefined
	
		return await this.request("get", ["beatmapsets", "search"],
		{q: query?.keywords, sort, c, m: query?.mode, s, nsfw, g: query?.genre, l: query?.language, e, r, played, cursor_string: query?.cursor_string})
	}

	/**
	 * Get extensive data about a beatmapset by using a beatmap!
	 * @param beatmap A beatmap from the beatmapset you're looking for
	 */
	export async function lookup(this: API, beatmap: Beatmap["id"] | Beatmap): Promise<Beatmapset.Extended.Plus> {
		const beatmap_id = typeof beatmap === "number" ? beatmap : beatmap.id
		return await this.request("get", ["beatmapsets", "lookup"], {beatmap_id})
	}

	/**
	 * Get extensive beatmapset data about whichever beatmapset you want!
	 * @param beatmapset The beatmapset or the id of the beatmapset you're trying to get
	 */
	export async function getOne(this: API, beatmapset: Beatmapset["id"] | Beatmapset): Promise<Beatmapset.Extended.Plus> {
		beatmapset = typeof beatmapset === "number" ? beatmapset : beatmapset.id
		return await this.request("get", ["beatmapsets", beatmapset])
	}
}
