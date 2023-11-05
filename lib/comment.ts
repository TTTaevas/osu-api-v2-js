import { CurrentUserAttributes, UserCompact } from "./user.js"

export interface Comment {
	commentable_id: number
	commentable_type: string
	created_at: Date
	deleted_at: Date | null
	edited_at: Date | null
	edited_by_id: number | null
	id: number
	legacy_name: string | null
	message: string | null
	message_html: string | null
	parent_id: number | null
	pinned: Boolean
	replies_count: number
	updated_at: Date
	user_id: number
	votes_count: number
}

export interface CommentBundle {
	commentable_meta: CommentableMeta[]
	comments: Comment[]
	has_more: Boolean
	has_more_id: number | null
	included_comments: Comment[]
	pinned_comments: Comment[]
	sort: string
	top_level_count: number | null
	total: number | null
	user_follow: Boolean
	user_votes: number[]
	users: UserCompact[]
}

export interface CommentableMeta {
	current_user_attributes: CurrentUserAttributes
	id: number
	owner_id: number | null
	owner_title: string | null
	title: string
	type: string
	url: string
}
