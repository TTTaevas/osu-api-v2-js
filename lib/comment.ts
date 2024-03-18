import { API } from "./index.js"
import { User } from "./user.js"

export interface Comment {
	id: number
	parent_id: number | null
	user_id: number
	pinned: boolean
	replies_count: number
	votes_count: number
	/** "build" means changelog, like pretty much everywhere in the API */
	commentable_type: "beatmapset" | "build" | "news_post"
	commentable_id: number
	/** I think it's the name used by the person who made the comment before a migration to a new comment system in 2018 or before? */
	legacy_name: string | null
	created_at: Date
	updated_at: Date
	deleted_at: Date | null
	edited_at: Date | null
	edited_by_id: number | null
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
			owner_id: number | null
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
	export async function getOne(this: API, comment: Comment | {id: number}): Promise<Comment.Bundle> {
		let bundle = await this.request("get", `comments/${comment.id}`)
		const commentable_meta = bundle.commentable_meta.filter((c: any) => c.id)
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
	export async function getMultiple(this: API, from?: {type: Comment["commentable_type"], id: number}, parent?: Comment | {id: number | 0},
	sort?: {type?: Comment.Bundle["sort"], after?: Comment | {id: number}, cursor?: Comment.Bundle["cursor"]}): Promise<Comment.Bundle.WithTotalToplevelcount> {
		const after = sort?.after?.id ? String(sort.after.id) : undefined
		const parent_id = parent?.id ? String(parent.id) : undefined

		let bundle = await this.request("get", "comments", {
			after, commentable_type: from?.type, commentable_id: from?.id,
			cursor: sort?.cursor, parent_id, sort: sort?.type
		})
		const commentable_meta = bundle.commentable_meta.filter((c: any) => c.id)
		bundle.deleted_commentable_meta = bundle.commentable_meta.length - commentable_meta.length
		bundle.commentable_meta = commentable_meta
		
		return bundle
	}
}
