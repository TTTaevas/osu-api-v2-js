import { Beatmapset } from "./beatmapset.js"
import { API } from "./index.js"
import { Spotlight as SpotlightInterface, Rulesets, getId } from "./misc.js"
import { User } from "./user.js"

interface RankingBare {
	cursor: {
		/** The number of the next page, is null if no more results are available */
		page: number | null
	}
	/** Total amount of elements available across all pages, not on this specific page! Maximum of 10000 */
	total: number
}

export namespace Ranking {
	/** @obtainableFrom {@link API.getUserRanking} */
	export interface User extends RankingBare {
		ranking: User.Statistics.WithUser[]
	}

	/** @obtainableFrom {@link API.getCountryRanking} */
	export interface Country extends RankingBare {
		ranking: {
			/** Same as `country.code` */
			code: string
			active_users: number
			play_count: number
			ranked_score: number
			performance: number
			country: {
				/** The country's ISO 3166-1 alpha-2 code! (France would be `FR`, United States `US`) */
				code: string
				name: string
			}
		}[]
	}

	/** @obtainableFrom {@link API.getSpotlightRanking} */
	export interface Spotlight {
		beatmapsets: Beatmapset.Extended[]
		ranking: User.Statistics.WithUser[]
		spotlight: SpotlightInterface.WithParticipantcount
	}

	/**
	 * Get the top players of the game, with some filters!
	 * @param ruleset Self-explanatory, is also known as "Gamemode"
	 * @param type Rank players by their performance points or by their ranked score?
	 * @param page (defaults to 1) Imagine `Rankings` as a page, it can only have a maximum of 50 players, while 50 others may be on the next one
	 * @param filter What kind of players do you want to see? Defaults to `all`, `friends` has no effect if no authorized user
	 * @param country Only get players from a specific country, using its ISO 3166-1 alpha-2 country code! (France would be `FR`, United States `US`)
	 * @param variant If `type` is `performance` and `ruleset` is mania, choose between 4k and 7k!
	 */
	export async function getUser(this: API, ruleset: Rulesets, type: "performance" | "score", page: number = 1, filter: "all" | "friends" = "all",
	country?: string, variant?: "4k" | "7k"): Promise<Ranking.User> {
		return await this.request("get", `rankings/${Rulesets[ruleset]}/${type}`, {page, filter, country, variant})
	}

	/**
	 * Get the top countries of a specific ruleset!
	 * @param ruleset On which Ruleset should the countries be compared?
	 * @param page (defaults to 1) Imagine `Rankings` as a page, it can only have a maximum of 50 countries, while 50 others may be on the next one
	 */
	export async function getCountry(this: API, ruleset: Rulesets, page: number = 1): Promise<Ranking.Country> {
		return await this.request("get", `rankings/${Rulesets[ruleset]}/country`, {page})
	}

	/**
	 * Get the top 50 players who have the most total kudosu!
	 */
	export async function getKudosu(this: API): Promise<User.WithKudosu[]> {
		const response = await this.request("get", "rankings/kudosu")
		return response.ranking
	}

	/**
	 * Get the rankings of a spotlight from 2009 to 2020 on a specific ruleset!
	 * @param ruleset Each spotlight has a different ranking (and often maps) depending on the ruleset
	 * @param spotlight The spotlight in question
	 * @param filter What kind of players do you want to see? Defaults to `all`, `friends` has no effect if no authorized user
	 */
	export async function getSpotlight(this: API, ruleset: Rulesets, spotlight: SpotlightInterface["id"] | SpotlightInterface, filter: "all" | "friends" = "all"): Promise<Ranking.Spotlight> {
		return await this.request("get", `rankings/${Rulesets[ruleset]}/charts`, {spotlight: getId(spotlight), filter})
	}
}
