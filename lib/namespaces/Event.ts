import { API, User as IUser, Miscellaneous, Ruleset } from "../index.js"

/** @obtainableFrom {@link API.getEvents} */
export interface Event {
	created_at: Date
	id: number
}

export namespace Event {
	/** Those are used as properties by Events, they're not events themselves */
	export namespace SharedProperties {
		export interface User {
			username: IUser["username"]
			/** What goes after the website's URL, so for example, it could be the `/u/7276846` of `https://osu.ppy.sh/u/7276846` (or `users` instead of `u`) */
			url: string
		}
		
		export interface Beatmap {
			/** Format: {artist} - {song_name} [{difficulty_name}] */
			title: string
			/** What goes after the website's URL, like it could be the `/b/2980857?m=0` of `https://osu.ppy.sh/b/2980857?m=0` (/{beatmap_id}?m={ruleset_id}) */
			url: string
		}
		
		export interface Beatmapset {
			/** Format: {artist} - {song_name} */
			title: string
			/** What goes after the website's URL, like it could be the `/s/689155` of `https://osu.ppy.sh/s/689155` (/{beatmapset_id}) */
			url: string
		}
	}
	
	export interface Achievement extends Event {
		type: "achievement"
		achievement: {
			icon_url: string
			id: number
			name: string
			grouping: string
			ordering: number
			slug: string
			description: string
			/** If the achievement is for a specific mode only (such as pass a 2* beatmap in taiko) */
			mode: keyof typeof Ruleset | null
			/** @remarks May contain HTML (like have the text between <i></i>) */
			instructions: string | null
		}
		user: SharedProperties.User
	}
	
	export interface BeatmapPlaycount extends Event {
		type: "beatmapPlaycount"
		count: number
		beatmap: SharedProperties.Beatmap
	}
	
	export interface BeatmapsetApprove extends Event {
		type: "beatmapsetApprove"
		approval: "ranked" | "approved" | "qualified" | "loved"
		user: SharedProperties.User
		beatmapset: SharedProperties.Beatmapset
	}
	
	export interface BeatmapsetDelete extends Event {
		type: "beatmapsetDelete"
		beatmapset: SharedProperties.Beatmapset
	}
	
	export interface BeatmapsetRevive extends Event {
		type: "beatmapsetRevive"
		user: SharedProperties.User
		beatmapset: SharedProperties.Beatmapset
	}
	
	export interface BeatmapsetUpdate extends Event {
		type: "beatmapsetUpdate"
		user: SharedProperties.User
		beatmapset: SharedProperties.Beatmapset
	}
	
	export interface BeatmapsetUpload extends Event {
		type: "beatmapsetUpload"
		user: SharedProperties.User
		beatmapset: SharedProperties.Beatmapset
	}
	
	export interface Rank extends Event {
		type: "rank"
		/** The grade, like "S" */
		scoreRank: string
		/** The position achieved, like 14 */
		rank: number
		mode: keyof typeof Ruleset
		user: SharedProperties.User
		beatmap: SharedProperties.Beatmap
	}
	
	export interface RankLost extends Event {
		type: "rankLost"
		mode: keyof typeof Ruleset
		user: SharedProperties.User
		beatmap: SharedProperties.Beatmap
	}
	
	export interface UserSupportAgain extends Event {
		type: "userSupportAgain"
		user: SharedProperties.User
	}
	
	export interface UserSupportFirst extends Event {
		type: "userSupportFirst"
		user: SharedProperties.User
	}
	
	export interface UserSupportGift extends Event {
		type: "userSupportGift"
		user: SharedProperties.User
	}
	
	export interface UsernameChange extends Event {
		type: "usernameChange"
		user: {
			username: IUser["username"]
			/** What goes after the website's URL, so for example, it could be the `/u/7276846` of `https://osu.ppy.sh/u/7276846` (or `users` instead of `u`) */
			url: string
			previousUsername: IUser["username"]
		}
	}

	/**
	 * This includes everything in this namespace, except `BeatmapPlaycount`
	 * @obtainableFrom {@link API.getUserRecentActivity}
	 */
	export type AnyRecentActivity = Achievement | BeatmapsetApprove | BeatmapsetDelete | BeatmapsetRevive | BeatmapsetUpdate | BeatmapsetUpload | Rank | RankLost |
	UserSupportAgain | UserSupportFirst | UserSupportGift | UsernameChange
	export type Any = AnyRecentActivity | BeatmapPlaycount

	/**
	 * Get everything note-worthy that happened on osu! recently!
	 * @param sort "id_asc" to have the oldest recent event first, "id_desc" to have the newest instead (defaults to **id_desc**)
	 * @param cursor_string Use a response's `cursor_string` with the same parameters to get the next "page" of results, so `events` in this instance!
	 */
	export async function getMultiple(this: API, sort: Miscellaneous.Sort = "id_desc", cursor_string?: Miscellaneous.CursorString):
	Promise<{events: Event.Any[], cursor_string: Miscellaneous.CursorString | null}> {
		return await this.request("get", ["events"], {sort, cursor_string})
	}
}
