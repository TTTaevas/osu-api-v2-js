export interface ChangelogBuild {
	created_at: Date
	display_version: string
	id: number
	update_stream: UpdateStream | null
	users: number
	version: string | null
	changelog_entries?: {
		category: string
		created_at: Date | null
		github_pull_request_id: number | null
		github_url: string | null
		id: number | null
		major: Boolean
		repository: string | null
		title: string | null
		type: string
		url: string | null
	}
	versions?: {
		next: ChangelogBuild | null
		previous: ChangelogBuild | null
	}
}

export interface UpdateStream {
	display_name: string | null
	id: number
	is_featured: Boolean
	name: string
	latest_build: ChangelogBuild | null
	user_count: number
}
