export interface ForumPost {
	created_at: Date
	deleted_at: Date | null
	edited_at: Date | null
	edited_by_id: number | null
	forum_id: number
	id: number
	topic_id: number
	user_id: number
	body: {
		/**
		 * Post content in HTML format
		 */
		html: string
		/**
		 * Post content in BBCode format
		 */
		raw: string
	}
}

export interface ForumTopic {
	created_at: Date
	deleted_at: Date | null
	first_post_id: number
	forum_id: number
	id: number
	is_locked: boolean
	last_post_id: number
	post_count: number
	title: string
	type: "normal" | "sticky" | "announcement"
	updated_at: Date
	user_id: number
	poll: {
		allow_vote_change: boolean
		/**
		 * Can be in the future
		 */
		ended_at: Date | null
		hide_incomplete_results: boolean
		last_vote_at: Date | null
		max_votes: number
		options: {
			id: number
			text: {
				bbcode: string
				html: string
			}
			/**
			 * Not present if the poll is incomplete and results are hidden
			 */
			vote_count?: number
		}[]
		started_at: Date
		title: {
			bbcode: string
			html: string
		}
		total_vote_count: number
	} | null
}
