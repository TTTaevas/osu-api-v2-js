interface ChangelogBuild {
	created_at: Date
	display_version: string
	id: number
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
}

/**
 * Expected from ChangelogBuildWithChangelogentriesVersions
 */
export interface ChangelogBuildWithUpdatestreams extends ChangelogBuild {
	update_stream: UpdateStream
}

interface ChangelogBuildWithChangelogentries extends ChangelogBuild {
	changelog_entries: {
		id: number | null
		repository: string | null
		github_pull_request_id: number | null
		github_url: string | null
		url: string | null
		type: string
		category: string
		title: string | null
		major: boolean
		/**
		 * Can be January 1st 1970!
		 */
		created_at: Date
		/**
		 * Doesn't exist if no github user is associated with who's credited with the change
		 */
		github_user?: {
			display_name: string
			github_url: string | null
			github_username: string | null
			id: number | null
			osu_username: string | null
			user_id: number | null
			user_url: string | null
		}
		/**
		 * Entry message in Markdown format, embedded HTML is allowed, exists only if Markdown was requested
		 */
		message?: string | null
		/**
		 * Entry message in HTML format, exists only if HTML was requested
		 */
		message_html?: string | null
		
	}[]
}

/**
 * Expected from api.getChangelogBuilds()
 */
export interface ChangelogBuildWithUpdatestreamsChangelogentries extends ChangelogBuildWithUpdatestreams, ChangelogBuildWithChangelogentries {

}

/**
 * Expected from api.getChangelogBuild()
 */
export interface ChangelogBuildWithChangelogentriesVersions extends ChangelogBuildWithChangelogentries {
	versions: {
		next: ChangelogBuildWithUpdatestreams | null
		previous: ChangelogBuildWithUpdatestreams | null
	}
}

/**
 * Expected from ChangelogBuildWithUpdatestreams
 */
export interface UpdateStream {
	id: number
	name: string
	display_name: string | null
	is_featured: boolean
}

/**
 * Expected from api.getChangelogStreams()
 */
export interface UpdateStreamWithLatestbuildUsercount extends UpdateStream {
	latest_build: ChangelogBuild | null
	/**
	 * How many users are playing on this? (if lazer/web, should be 0, lazer doesn't show such stats)
	 */
	user_count: number
}
