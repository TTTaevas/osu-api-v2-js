export namespace Forum {
	/**
	 * Expected from api.replyForumTopic(), api.createForumTopic(), api.getForumTopicAndPosts(), api.editForumPost()
	 */
	export interface Post {
		created_at: Date
		deleted_at: Date | null
		edited_at: Date | null
		edited_by_id: number | null
		forum_id: number
		id: number
		topic_id: number
		user_id: number
		body: {
			/** Post content in HTML format */
			html: string
			/**  Post content in BBCode format */
			raw: string
		}
	}

	/**
	 * Expected from api.createForumTopic(), api.getForumTopicAndPosts(), api.editForumTopicTitle()
	 */
	export interface Topic {
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
			/** Can be in the future */
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
				/** Not present if the poll is incomplete and results are hidden */
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
}

/** Feel free to use this interface to help you create polls with `api.createForumTopic()`! */
export interface PollConfig {
	title: string
	/** The things the users can vote for */
	options: string[]
	/** Length of voting period in days, 0 means forever */
	length_days: number
	/** (defaults to 1) The maximum amount of votes per user! */
	max_options?: number
	/** defaults to false) Do you allow users to change their vote? */
	vote_change?: boolean
	/** (defaults to false) Should the results of the poll be hidden while the voting period is still active? */
	hide_results?: boolean
}
