import { Rulesets } from "./misc.js"

export interface Event {
	created_at: Date
	id: number
}

export interface EventUser extends Event {
	user: {
		username: string
		/**
		 * What goes after the website's URL, so for example, it could be the `/u/7276846` of `https://osu.ppy.sh/u/7276846` (or `users` instead of `u`)
		 */
		url: string
	}
}

export interface EventBeatmap extends Event {
	/**
	 * {artist} - {title} [{difficulty_name}]
	 */
	title: string
	/**
	 * What goes after the website's URL, like it could be the `/b/2980857?m=0` of `https://osu.ppy.sh/b/2980857?m=0` (/{beatmap_id}?m={ruleset_id})
	 */
	url: string
}

export interface EventBeatmapset extends Event {
	/**
	 * {artist} - {title}
	 */
	title: string
	/**
	 * What goes after the website's URL, like it could be the `/s/689155` of `https://osu.ppy.sh/s/689155` (/{beatmapset_id})
	 */
	url: string
}


export interface EventAchievement extends EventUser {
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

export interface EventBeatmapPlaycount extends EventBeatmap {
	type: "beatmapPlaycount"
	count: number
}

export interface EventBeatmapsetApprove extends EventUser, EventBeatmapset {
	type: "beatmapsetApprove"
	approval: "ranked" | "approved" | "qualified" | "loved"
}

export interface EventBeatmapsetDelete extends EventBeatmapset {
	type: "beatmapsetDelete"
}

export interface EventBeatmapsetRevive extends EventUser, EventBeatmapset {
	type: "beatmapsetRevive"
}

export interface EventBeatmapsetUpdate extends EventUser, EventBeatmapset {
	type: "beatmapsetUpdate"
}

export interface EventBeatmapsetUpload extends EventUser, EventBeatmapset {
	type: "beatmapsetUpload"
}

export interface EventRank extends EventUser, EventBeatmap {
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

export interface EventRankLost extends EventUser, EventBeatmap {
	type: "rankLost"
	mode: Rulesets
}

export interface EventUserSupportAgain extends EventUser {
	type: "userSupportAgain"
}

export interface EventUserSupportFirst extends EventUser {
	type: "userSupportFirst"
}

export interface EventUserSupportGift extends EventUser {
	type: "userSupportGift"
}

export interface EventUsernameChange extends EventUser {
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
