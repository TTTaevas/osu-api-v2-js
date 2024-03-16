import { API } from "./index.js"

export namespace Changelog {
	export interface Build {
		created_at: Date
		display_version: string
		id: number
		/** How many users are playing on this version of the game? (if web, should be 0) */
		users: number
		/** The name of the version */
		version: string | null
		/**
		 * If a video is showcased on the changelog
		 * @remarks The ID of a Youtube video is whatever comes after `/watch?v=` in its url
		 */
		youtube_id: string | null
	}

	export namespace Build {
		/** @obtainableFrom {@link Changelog.Build.WithChangelogentriesVersions} */
		export interface WithUpdatestreams extends Build {
			update_stream: UpdateStream
		}

		interface WithChangelogentries extends Build {
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
				/** @remarks Can be January 1st 1970! */
				created_at: Date
				/** @remarks Doesn't exist if no github user is associated with who's credited with the change */
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
				 * Entry message in Markdown format, embedded HTML is allowed
				 * @remarks Exists only if Markdown was requested
				 */
				message?: string | null
				/**
				 * Entry message in HTML format
				 * @remarks Exists only if HTML was requested
				 */
				message_html?: string | null
				
			}[]
		}

		/** @obtainableFrom {@link API.getChangelogBuilds} */
		export interface WithUpdatestreamsChangelogentries extends WithUpdatestreams, WithChangelogentries {

		}

		/** @obtainableFrom {@link API.getChangelogBuild} */
		export interface WithChangelogentriesVersions extends WithChangelogentries {
			versions: {
				next: WithUpdatestreams | null
				previous: WithUpdatestreams | null
			}
		}

		/**
		 * Get details about the version/update/build of something related to osu!
		 * @param changelog A build version like `2023.1026.0`, a stream name like `lazer` or the id of a build
		 * @param is_id Whether or not `changelog` is the id of a build, defaults to false
		 * @param message_formats Elements of `changelog_entries` will have a `message` property if `markdown`, `message_html` property if `html`, defaults to both
		 */
		export async function lookup(this: API, changelog: string, is_id: boolean = false, message_formats: ("html" | "markdown")[] = ["html", "markdown"]):
		Promise<Changelog.Build.WithChangelogentriesVersions> {
			return await this.request("get", `changelog/${changelog}`, {key: is_id ? "id" : undefined, message_formats})
		}

		/**
		 * Get details about the version/update/build of something related to osu!
		 * @param stream The name of the thing related to osu!, like `lazer`, `web`, `cuttingedge`, `beta40`, `stable40`
		 * @param build The name of the version! Usually something like `2023.1026.0` for lazer, or `20230326` for stable
		 */
		export async function getOne(this: API, stream: string, build: string): Promise<Changelog.Build.WithChangelogentriesVersions> {
			return await this.request("get", `changelog/${stream}/${build}`)
		}

		/**
		 * Get up to 21 versions/updates/builds!
		 * @param versions Get builds that were released before/after (and including) those versions (use the name of the versions, e.g. `2023.1109.0`)
		 * @param max_id Filter out builds that have an id higher than this (this takes priority over `versions.to`)
		 * @param stream Only get builds from a specific stream
		 * @param message_formats Elements of `changelog_entries` will have a `message` property if `markdown`, `message_html` property if `html`, defaults to both
		 */
		export async function getMultiple(this: API, versions?: {from?: string, to?: string}, max_id?: number,
			stream?: string, message_formats: ("html" | "markdown")[] = ["html", "markdown"]): Promise<Changelog.Build.WithUpdatestreamsChangelogentries[]> {
				const [from, to] = [versions?.from, versions?.to]
				const response = await this.request("get", "changelog", {from, to, max_id, stream, message_formats})
				return response.builds
			}
		}

	/** @obtainableFrom {@link Changelog.Build.WithUpdatestreams} */
	export interface UpdateStream {
		id: number
		name: string
		display_name: string | null
		is_featured: boolean
	}

	export namespace UpdateStream {
		/** @obtainableFrom {@link API.getChangelogStreams} */
		export interface WithLatestbuildUsercount extends UpdateStream {
			latest_build: Build | null
			/**
			 * How many users are playing on this?
			 * @remarks Should be 0 if web
			 */
			user_count: number
		}
		
		/**
		 * An effective way to get all available streams, as well as their latest version!
		 * @example
		 * ```ts
		 * const names_of_streams = (await api.getChangelogStreams()).map(s => s.name)
		 * ```
		 */
		export async function getAll(this: API): Promise<Changelog.UpdateStream.WithLatestbuildUsercount[]> {
			const response = await this.request("get", "changelog", {max_id: 0})
			return response.streams
		}
	}
}
