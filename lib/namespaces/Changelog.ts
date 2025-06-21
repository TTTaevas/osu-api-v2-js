import { API, User } from "../index.js"

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
				/** The URL of the Pull Request, for example `https://github.com/ppy/osu/pull/<github_pull_request_id>` */
				github_url: string | null
				url: string | null
				type: string
				category: string
				title: string | null
				major: boolean
				/** @remarks Can be January 1st 1970, and can be null if it's for example a notice to say the build is a hotfix */
				created_at: Date | null
				/** @remarks Doesn't exist if no github user is associated with the person who's credited with the change */
				github_user?: {
					display_name: string
					github_url: string | null
					github_username: string | null
					id: number | null
					osu_username: User["username"] | null
					user_id: User["id"] | null
					/** The URL of the user's osu! profile, for example `https://osu.ppy.sh/users/<user_id>` */
					user_url: string | null
				}
				/**
				 * Entry message in Markdown format, embedded HTML is allowed
				 * @remarks Exists only if Markdown was requested, may still be null if there is no message
				 */
				message?: string | null
				/**
				 * Entry message in HTML format
				 * @remarks Exists only if HTML was requested, may still be null if there is no message
				 */
				message_html?: string | null
				
			}[]
		}

		/** @obtainableFrom {@link API.getChangelogBuilds} */
		export interface WithUpdatestreamsChangelogentries extends WithUpdatestreams, WithChangelogentries {}

		/**
		 * @obtainableFrom
		 * {@link API.getChangelogBuild} /
		 * {@link API.lookupChangelogBuild}
		 */
		export interface WithChangelogentriesVersions extends WithChangelogentries {
			versions: {
				next: WithUpdatestreams | null
				previous: WithUpdatestreams | null
			}
		}

		/**
		 * Get details about the version/update/build of something related to osu!
		 * @param changelog A stream name like `lazer`, a build version like `2023.1026.0`, or the id of a build
		 * @param message_formats `changelog_entries` will have a `message` property if `markdown`, `message_html` property if `html` (defaults to **both**)
		 */
		export async function lookup(this: API, changelog: Changelog.UpdateStream["name"] | Changelog.Build["display_version"] | Changelog.Build["id"],
		message_formats: ("html" | "markdown")[] = ["html", "markdown"]): Promise<Changelog.Build.WithChangelogentriesVersions> {
			return await this.request("get", ["changelog", changelog], {key: typeof changelog === "number" ? "id" : undefined, message_formats})
		}

		/**
		 * Get details about the version/update/build of something related to osu!
		 * @param stream The name of the thing related to osu!, like `lazer`, `web`, `cuttingedge`, `beta40`, `stable40`
		 * @param build The name of the version! Usually something like `2023.1026.0` for lazer, or `20230326` for stable
		 */
		export async function getOne(this: API, stream: Changelog.UpdateStream["name"], build: Changelog.Build["display_version"]):
		Promise<Changelog.Build.WithChangelogentriesVersions> {
			return await this.request("get", ["changelog", stream, build])
		}

		/**
		 * Get up to 21 versions/updates/builds!
		 * @param stream Only get builds from a specific stream
		 * @param range Get builds that were released before/after (and including) those builds
		 * @param message_formats `changelog_entries` will have a `message` property if `markdown`, `message_html` property if `html` (defaults to **both**)
		 */
		export async function getMultiple(this: API, stream?: Changelog.UpdateStream["name"], range?: {
		/** The name of the build */
		from?: Changelog.Build["display_version"],
		/** The name or the id of the build */
		to?: Changelog.Build["display_version"] | Changelog.Build["id"]},
		message_formats: ("html" | "markdown")[] = ["html", "markdown"]): Promise<Changelog.Build.WithUpdatestreamsChangelogentries[]> {
			const from = range?.from
			const to = typeof range?.to === "string" ? range.to : undefined
			const max_id = typeof range?.to === "number" ? range.to : undefined

			const response = await this.request("get", ["changelog"], {from, to, max_id, stream, message_formats})
			return response.builds // NOT the only property; `streams` is irrelevant while `search` is useless
		}
	}

	export interface UpdateStream {
		id: number
		/** Stable would be `stable40`, Lazer would be `lazer` */
		name: string
		/** Stable would be `Stable`, Lazer would be `Lazer` */
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
			const response = await this.request("get", ["changelog"], {max_id: 0}) // Limit how many `builds` we receive, for the sake of speed
			return response.streams // NOT the only property; both `builds` and `search` are irrelevant
		}
	}
}
