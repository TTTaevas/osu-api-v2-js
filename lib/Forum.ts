import { API, User } from "./index.js"
import { getId } from "./misc.js"

export interface Forum {
	id: number
	name: string
	description: string
}

export namespace Forum {
	/** This is a forum with subforums, but those subforums do NOT have subforums */
	export interface WithSubforums extends Forum {
		subforums: Forum[]
	}

	/** This is a forum with subforums, those subforums also have subforums, which in turn do not have subforums */
	export interface WithSubforums2 extends Forum {
		subforums: Forum.WithSubforums[]
	}

	/**
	 * @obtainableFrom
	 * {@link API.replyForumTopic} /
	 * {@link API.createForumTopic} /
	 * {@link API.getForumTopicAndPosts} /
	 * {@link API.editForumPost}
	 */
	export interface Post {
		created_at: Date
		deleted_at: Date | null
		edited_at: Date | null
		edited_by_id: number | null
		forum_id: Forum["id"]
		id: number
		topic_id: Topic["id"]
		user_id: User["id"]
		body: {
			/** Post content in HTML format */
			html: string
			/** Post content in BBCode format */
			raw: string
		}
	}

	export namespace Post {
		/**
		 * Edit a ForumPost! Note that it can be the initial one of a ForumTopic!
		 * @scope {@link Scope"forum.write"}
		 * @param post The post or the id of the post in question
		 * @param new_text The new content of the post (replaces the old content)
		 * @returns The edited ForumPost
		 */
		export async function edit(this: API, post: Post["id"] | Post, new_text: string): Promise<Post> {
			return await this.request("put", ["forums", "posts", getId(post)], {body: new_text})
		}
	}

	/**
	 * @obtainableFrom
	 * {@link API.createForumTopic} /
	 * {@link API.getForumTopicAndPosts} /
	 * {@link API.editForumTopicTitle}
	 */
	export interface Topic {
		created_at: Date
		deleted_at: Date | null
		first_post_id: Post["id"]
		forum_id: Forum["id"]
		id: number
		is_locked: boolean
		last_post_id: Post["id"]
		post_count: number
		title: string
		type: "normal" | "sticky" | "announcement"
		updated_at: Date
		user_id: User["id"]
		poll: {
			allow_vote_change: boolean
			/** @remarks Can be in the future */
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
				/** @remarks Not present if the poll is incomplete and results are hidden */
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

	export namespace Topic {
		/**
		 * Get multiple existing Forum.Topic, optionally in a specific Forum!
		 * @param config Where you specify filters, sorting options, and the such
		 * @returns An object with an array of relevant Forum.Topic, and a `cursor_string` to allow you to go further
		 */
		export async function getMultiple(this: API, config?: {
			/** From which specific Forum to get the topcis from */
			forum_id?: Forum["id"]
			/** How many `topics` maximum, up to 50 */
			limit?: number
			/** "id_asc" to have the oldest post at the beginning of the `topics` array, "id_desc" to have the newest instead */
			sort?: "id_asc" | "id_desc"
			/** Use a response's `cursor_string` with the same parameters to get the next "page" of results, so `topics` in this instance! */
			cursor_string?: string
		}): Promise<{topics: Forum.Topic[], cursor_string: string | null}> {
			return await this.request("get", ["forums", "topics"], {...config})
		}

		/**
		 * Create a new Forum.Topic in the forum of your choice!
		 * @scope {@link Scope"forum.write"}
		 * @param forum_id The id of the forum you're creating your topic in
		 * @param title The topic's title
		 * @param text The first post's content/message
		 * @param poll If you want to make a poll, specify the parameters of that poll!
		 * @returns An object with the topic you've made, and its first initial post (which uses your `text`)
		 * @remarks Some users may not be allowed to do that, such as newly registered users, so this can 403 even with the right scopes
		 */
		export async function create(this: API, forum_id: Forum["id"], title: string, text: string, poll?: {
			title: string
			/** The things the users can vote for */
			options: string[]
			/** Length of voting period in days, 0 means forever */
			length_days: number
			/** The maximum amount of votes per user! (defaults to **1**) */
			max_options?: number
			/** Do you allow users to change their vote? (defaults to **false**) */
			vote_change?: boolean
			/** Should the results of the poll be hidden while the voting period is still active? (defaults to **false**) */
			hide_results?: boolean
		}): Promise<{topic: Forum.Topic, post: Forum.Post}> {
			const with_poll = poll !== undefined
			const options = poll?.options !== undefined ? poll.options.toString().replace(/,/g, "\n") : undefined

			return await this.request("post", ["forums", "topics"], {forum_id, title, body: text, with_poll, forum_topic_poll: poll ? {
				title: poll.title,
				options: options,
				length_days: poll.length_days,
				max_options: poll.max_options || 1,
				vote_change: poll.vote_change || false,
				hide_results: poll.hide_results || false,
			} : undefined})
		}

		/**
		 * Make and send a Forum.Post in a Forum.Topic!
		 * @scope {@link Scope"forum.write"}
		 * @param topic The topic or the id of the topic you're making your reply in
		 * @param text Your reply! Your message!
		 * @returns The reply you've made, as a Forum.Post!
		 * @remarks Replying when the last post was made by the authorized user will likely cause the server to return a 403
		 */
		export async function reply(this: API, topic: Topic["id"] | Topic, text: string): Promise<Post> {
			return await this.request("post", ["forums", "topics", getId(topic), "reply"], {body: text})
		}

		/**
		 * Edit the title of a Forum.Topic!
		 * @scope {@link Scope"forum.write"}
		 * @param topic The topic or the id of the topic in question
		 * @param new_title The new title of the topic
		 * @returns The edited ForumTopic
		 * @remarks Use `editForumPost` if you wanna edit the post at the top of the topic
		 */
		export async function editTitle(this: API, topic: Topic["id"] | Topic, new_title: string): Promise<Topic> {
			return await this.request("put", ["forums", "topics", getId(topic)], {forum_topic: {topic_title:  new_title}})
		}
	}

	/**
	 * Get a Forum with a specific id, as well as its Forum.Topics!
	 * @param forum_id The id of the Forum you want to get
	 * @returns An object with the Forum, its topics, and the topics pinned in it
	 */
	export async function getOne(this: API, forum_id: Forum["id"]): Promise<{
		forum: Forum.WithSubforums2,
		topics: Forum.Topic[],
		pinned_topics: Forum.Topic[],
	}> {
		return await this.request("get", ["forums", forum_id])
	}

	/**
	 * Get a list of all top-level Forums!
	 * @returns All the top-level forums
	 * @remarks The subforums of a forum are in the properties of their respective forum
	 */
	export async function getMultiple(this: API): Promise<Forum.WithSubforums2[]> {
		const response = await this.request("get", ["forums"])
		return response.forums // It's the only property
	}

	/**
	 * Get a Forum.Topic, as well as its main post (content) and the posts that were sent in it!
	 * @param topic An object with the id of the topic in question
	 * @param config How many results maximum, how to sort them, etc...
	 * @remarks The oldest post of a topic is the text of a topic
	 */
	export async function getTopicAndPosts(this: API, topic: Topic["id"] | Topic, config?: {
		/** The id (or the post itself) of the first post to be returned in `posts` (irrelevant if using a `cursor_string`) */
		first_post?: Post["id"] | Post
		/** How many `posts` maximum, up to 50 */
		limit?: number
		/** "id_asc" to have the oldest post at the beginning of the `posts` array, "id_desc" to have the newest instead */
		sort?: "id_asc" | "id_desc"
		/** Use a response's `cursor_string` with the same parameters to get the next "page" of results, so `posts` in this instance! */
		cursor_string?: string
	}): Promise<{topic: Topic, posts: Post[], cursor_string: string | null}> {
		const start = config?.sort === "id_asc" && config?.first_post ? getId(config.first_post) : undefined
		const end = config?.sort === "id_desc" && config?.first_post ? getId(config.first_post) : undefined
		return await this.request("get", ["forums", "topics", getId(topic)],
		{start, end, sort: config?.sort, limit: config?.limit, cursor_string: config?.cursor_string})
	}
}
