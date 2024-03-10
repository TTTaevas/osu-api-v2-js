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

export interface CommentableMeta {
	id: number
	title: Exclude<string, "Deleted Item">
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
	deleted: false
}

export interface CommentBundle {
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
	}
	top_level_count: number
	total: number
	commentable_meta: (CommentableMeta | {
		title: "Deleted Item"
		deleted: true
	})[]
}
