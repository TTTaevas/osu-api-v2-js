import { API, Beatmap, Ruleset, Score as IScore, User, Miscellaneous } from "../index.js"

/** @obtainableFrom {@link API.getMatch} */
export interface Match {
	match: Match.Info
	events: Match.Event[]
	users: User.WithCountry[]
	first_event_id: Match.Event["id"]
	latest_event_id: Match.Event["id"]
	current_game_id: number | null
}

export namespace Match {
	export interface Score extends IScore.OldFormat {
		created_at: Date
		match: {
			slot: number
			team: "none" | "red" | "blue"
			pass: boolean
		}
	}

	export interface Event {
		id: number
		detail: {
			type: string
			/** If `detail.type` is `other`, this exists and will be the name of the room */
			text?: string
		}
		timestamp: Date
		user_id: User["id"] | null
		/** If `detail.type` is `other`, then this should exist! */
		game?: {
			beatmap_id: Beatmap["id"]
			id: number
			start_time: Date
			end_time: Date | null
			mode: keyof typeof Ruleset
			mode_int: Ruleset
			scoring_type: string
			team_type: string
			mods: string[]
			beatmap: Beatmap.WithBeatmapset
			scores: Score[]
		}
	}

	/** @obtainableFrom {@link API.getMatches} */
	export interface Info {
		id: number
		start_time: Date
		end_time: Date | null
		name: string
	}

	/**
	 * Get data of a multiplayer lobby from the stable (non-lazer) client that have URLs with `community/matches` or `mp`
	 * @param match The id of a match can be found at the end of its URL
	 * @param query Filter and limit the amount of events shown
	 */
	export async function getOne(this: API, match: Info["id"] | Info, query?: {
		/** Filter FOR events BEFORE this one */
		before?: Match.Event["id"] | Match.Event,
		/** Filter FOR events AFTER this one */
		after?: Match.Event["id"] | Match.Event,
		/**
		 * From 1 to 101 events (defaults to **100**)
		 * @remarks 0 is treated as 1, anything above 101 is treated as 101
		 */
		limit?: number
	}): Promise<Match> {
		const match_id = typeof match === "number" ? match : match.id
		const before = typeof query?.before === "object" ? query.before.id : query?.before
		const after = typeof query?.after === "object" ? query.after.id : query?.after
		const response = await this.request("get", ["matches", match_id], {before, after, limit: query?.limit}) as Match

		// This converts scores' "perfect" from number to boolean
		response.events.forEach((event) => {
			event.game?.scores.forEach((score) => {
				score.perfect = Boolean(score.perfect)
			})
		})

		return response
	}

	/**
	 * Get the info about several matches!
	 * @param query The id of the first match of the array, and the sorting and size of said array
	 */
	export async function getMultiple(this: API, query?: {
		/**
		 * Which match should be featured at index 0 of the returned array? Will get one with a similar id if it is unavailable
		 * @remarks You can use this argument differently to get all matches before/after (depending of `query.sort`) a certain match,
		 * by adding +1/-1 to its id! So if you want all matches after match_id 10 with sorting is_desc, just have this argument be 10 + 1, or 11!
		 */
		first_match_in_array?: Info["id"] | Info
		/** The maximum amount of elements returned in the array (defaults to **50**) */
		limit?: number
		/** "id_desc" has the biggest id (most recent start_time) at the beginning of the array, "id_asc" is the opposite (defaults to **id_desc**) */
		sort?: Miscellaneous.Sort
	}): Promise<Info[]> {
		// `first_match_in_array` is a cool way to use the endpoint's cursor
		const match_id = typeof query?.first_match_in_array === "object" ? query.first_match_in_array.id : query?.first_match_in_array
		const cursor = match_id ? {match_id: match_id + (query?.sort === "id_asc" ? -1 : 1)} : undefined
		const response = await this.request("get", ["matches"], {cursor, limit: query?.limit, sort: query?.sort})
		return response.matches // NOT the only property; `params` is useless while `cursor` and `cursor_string` are superseded by `first_match_in_array`
	}
}
