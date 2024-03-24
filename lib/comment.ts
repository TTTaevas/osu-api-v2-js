import { API, Beatmapset, Changelog, NewsPost, User } from "./index.js"
import { getId } from "./misc.js"

export interface Comment {
	id: number
	parent_id: number | null
	user_id: User["id"]
	pinned: boolean
	replies_count: number
	votes_count: number
	/** "build" means changelog, like pretty much everywhere in the API */
	commentable_type: "beatmapset" | "build" | "news_post"
	commentable_id: Beatmapset["id"] | Changelog.Build["id"] | NewsPost["id"]
	/** I think it's the name used by the person who made the comment before a migration to a new comment system in 2018 or before? */
	legacy_name: string | null
	created_at: Date
	updated_at: Date
	deleted_at: Date | null
	edited_at: Date | null
	edited_by_id: User["id"] | null
	/** 
	 * Yes comments may not have this property, yes this is stupid 
	 * @privateRemarks Example is comment 3063736 from build 7463
	 */
	message?: string
	/** Yes comments may not have this property, yes this is stupid */
	message_html?: string
}

export namespace Comment {
	/** @obtainableFrom {@link API.getComment} */
	export interface Bundle {
		comments: Comment[]
		has_more: boolean
		has_more_id: number | null
		included_comments: Comment[]
		pinned_comments: Comment[]
		user_votes: number[]
		user_follow: boolean
		users: User[]
		sort: "new" | "old" | "top"
		cursor: {
			created_at: Date
			id: number
		} | null
		commentable_meta: {
			id: number
			title: string
			type: Comment["commentable_type"]
			url: string
			owner_id: User["id"] | null
			/** Like MAPPER */
			owner_title: string | null
			current_user_attributes: {
				/** 
				 * The string explains why the authorized user cannot post a new comment in this specific context, it's null if they can
				 * @remarks If there is simply no authorized user, this'll be a string such as "Please sign in to proceed."
				 */
				can_new_comment_reason: string | null
			}
		}[]
		/**
		 * This is an original property of the package that lets you know how many `CommentableMeta`s that only consist of a `title` of "Deleted Item" got removed
		 * @remarks This DOES COUNT the one that is always there, see https://github.com/ppy/osu-web/issues/11077
		 */
		deleted_commentable_meta: number
	}

	export namespace Bundle {
		/** @obtainableFrom {@link API.getComments} */
		export interface WithTotalToplevelcount extends Comment.Bundle {
			total: number
			top_level_count: number
		}
	}

	/**
	 * Get a specific comment by using its id!
	 * @param comment The comment in question
	 */
	export async function getOne(this: API, comment: Comment["id"] | Comment): Promise<Bundle> {
		const bundle = await this.request("get", `comments/${getId(comment)}`) as Bundle
		// Remove so-called "Deleted Items" / items that lack an id, add a "deleted_commentable_meta" and make it the number of removed objects
		const commentable_meta = bundle.commentable_meta.filter((c) => c.id)
		bundle.deleted_commentable_meta = bundle.commentable_meta.length - commentable_meta.length
		bundle.commentable_meta = commentable_meta
		
		return bundle
	}

	/**
	 * Get comments that meet any of your requirements!
	 * @param from From where are the comments coming from? Maybe a beatmapset, but then, which beatmapset?
	 * @param parent The comments are replying to which comment? Make the id 0 to filter out replies (and only get top level comments)
	 * @param sort Should the comments be sorted by votes? Should they be from after a certain date? Maybe you can give a cursor?
	 */
	export async function getMultiple(this: API, from?: {type: Comment["commentable_type"], id: number}, parent?: Comment["id"] | Comment,
	sort?: {type?: Bundle["sort"], after?: Comment["id"] | Comment, cursor?: Bundle["cursor"]}): Promise<Bundle.WithTotalToplevelcount> {
		const after = sort?.after ? String(getId(sort.after)) : undefined
		const parent_id = parent ? String(getId(parent)) : undefined

		const bundle = await this.request("get", "comments", {
			after, commentable_type: from?.type, commentable_id: from?.id,
			cursor: sort?.cursor, parent_id, sort: sort?.type
		})
		// Remove so-called "Deleted Items" / items that lack an id, add a "deleted_commentable_meta" and make it the number of removed objects
		const commentable_meta = bundle.commentable_meta.filter((c: any) => c.id)
		bundle.deleted_commentable_meta = bundle.commentable_meta.length - commentable_meta.length
		bundle.commentable_meta = commentable_meta
		
		return bundle
	}
}
