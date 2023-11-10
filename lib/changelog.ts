export interface ChangelogBuild {
	created_at: Date
	display_version: string
	id: number
	update_stream: UpdateStream | null
	/**
	 * How many users are playing on this version of the game? (if lazer/web, should be 0, lazer doesn't show such stats)
	 */
	users: number
	/**
	 * The name of the version
	 */
	version: string | null
	/**
	 * If a video is showcased on the changelog
	 * @remarks The ID of a Youtube video is whatever comes after `/watch?v=` in its url
	 */
	youtube_id: string | null
	changelog_entries?: {
		category: string
		/**
		 * Can be January 1st 1970!
		 */
		created_at: Date | null
		github_pull_request_id: number | null
		github_url: string | null
		id: number | null
		major: boolean
		repository: string | null
		title: string | null
		type: string
		url: string | null
		/**
		 * Entry message in Markdown format, embedded HTML is allowed, exists only if Markdown was requested
		 */
		message?: string | null
		/**
		 * Entry message in HTML format, exists only if HTML was requested
		 */
		message_html?: string | null
		github_user?: {
			display_name: string
			github_url: string | null
			github_username: string | null
			id: number | null
			osu_username: string | null
			user_id: number | null
			user_url: string | null
		}
	}
	/**
	 * The ChangelogBuilds in `versions` will not have `changelog_entries` or `versions`, and `users` will be 0
	 */
	versions?: {
		next: ChangelogBuild | null
		previous: ChangelogBuild | null
	}
}

export interface UpdateStream {
	display_name: string | null
	id: number
	is_featured: boolean
	name: string
	latest_build: ChangelogBuild | null
	/**
	 * How many users are playing on this? (if lazer/web, should be 0, lazer doesn't show such stats)
	 */
	user_count: number
}
