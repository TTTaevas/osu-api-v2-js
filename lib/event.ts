import { Rulesets } from "./misc.js"

export interface Event {
	created_at: Date
	id: number
}

export namespace Event {
	export interface User extends Event {
		user: {
			username: string
			/**
			 * What goes after the website's URL, so for example, it could be the `/u/7276846` of `https://osu.ppy.sh/u/7276846` (or `users` instead of `u`)
			 */
			url: string
		}
	}
	
	export interface Beatmap extends Event {
		/**
		 * {artist} - {title} [{difficulty_name}]
		 */
		title: string
		/**
		 * What goes after the website's URL, like it could be the `/b/2980857?m=0` of `https://osu.ppy.sh/b/2980857?m=0` (/{beatmap_id}?m={ruleset_id})
		 */
		url: string
	}
	
	export interface Beatmapset extends Event {
		/**
		 * {artist} - {title}
		 */
		title: string
		/**
		 * What goes after the website's URL, like it could be the `/s/689155` of `https://osu.ppy.sh/s/689155` (/{beatmapset_id})
		 */
		url: string
	}
	
	
	export interface Achievement extends User {
		type: "achievement"
		achievement: {
			icon_url: string
			id: number
			name: string
			grouping: string
			ordering: number
			slug: string
			description: string
			/**
			 * If the achievement is for a specific mode only (such as pass a 2* beatmap in taiko)
			 */
			mode: string | null
			/**
			 * May contain HTML (like have the text between <i></i>)
			 */
			instructions: string
		}
	}
	
	export interface BeatmapPlaycount extends Beatmap {
		type: "beatmapPlaycount"
		count: number
	}
	
	export interface BeatmapsetApprove extends User, Beatmapset {
		type: "beatmapsetApprove"
		approval: "ranked" | "approved" | "qualified" | "loved"
	}
	
	export interface BeatmapsetDelete extends Beatmapset {
		type: "beatmapsetDelete"
	}
	
	export interface BeatmapsetRevive extends User, Beatmapset {
		type: "beatmapsetRevive"
	}
	
	export interface BeatmapsetUpdate extends User, Beatmapset {
		type: "beatmapsetUpdate"
	}
	
	export interface BeatmapsetUpload extends User, Beatmapset {
		type: "beatmapsetUpload"
	}
	
	export interface Rank extends User, Beatmap {
		type: "rank"
		/**
		 * The grade, like "S"
		 */
		scoreRank: string
		/**
		 * The position achieved, like 14
		 */
		rank: number
		mode: Rulesets
	}
	
	export interface RankLost extends User, Beatmap {
		type: "rankLost"
		mode: Rulesets
	}
	
	export interface UserSupportAgain extends User {
		type: "userSupportAgain"
	}
	
	export interface UserSupportFirst extends User {
		type: "userSupportFirst"
	}
	
	export interface UserSupportGift extends User {
		type: "userSupportGift"
	}
	
	export interface UsernameChange extends User {
		type: "usernameChange"
		user: {
			username: string
			/**
			 * What goes after the website's URL, so for example, it could be the `/u/7276846` of `https://osu.ppy.sh/u/7276846`
			 */
			url: string
			previousUsername: string
		}
	}

	/** This includes everything in this namespace, except `BeatmapPlaycount` and `BeatmapsetDelete` */
	export type AnyRecentActivity = Achievement | BeatmapsetApprove | BeatmapsetRevive | BeatmapsetUpdate | BeatmapsetUpload | Rank | RankLost |
	UserSupportAgain | UserSupportFirst | UserSupportGift | UsernameChange
	/** This includes everything in this namespace that should be related to what BanchoBot sends in the #announce chat */
	export type AnyBeatmapAnnouncement = BeatmapPlaycount | BeatmapsetDelete
	export type Any = AnyRecentActivity | AnyBeatmapAnnouncement
}
