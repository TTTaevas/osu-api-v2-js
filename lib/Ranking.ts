import { API, Beatmapset, Ruleset, Spotlight as ISpotlight, User } from "./index.js"

interface Ranking {
	cursor: {
		/** The number of the next page, is null if no more results are available */
		page: number | null
	}
	/** Total amount of elements available across all pages, not on this specific page! Maximum of 10000 */
	total: number
}

export namespace Ranking {
	/** @obtainableFrom {@link API.getUserRanking} */
	export interface User extends Ranking {
		ranking: User.Statistics.WithUser[]
	}

	/** @obtainableFrom {@link API.getCountryRanking} */
	export interface Country extends Ranking {
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
		spotlight: ISpotlight.WithParticipantcount
	}

	/**
	 * Get the top players of the game, with some filters!
	 * @param ruleset Self-explanatory, is also known as "Gamemode"
	 * @param type Rank players by their performance points or by their ranked score?
	 * @param config Specify which page, country, filter out non-friends...
	 */
	export async function getUser(this: API, ruleset: Ruleset, type: "performance" | "score", config?: {
		/** Imagine the array you get as a page, it can only have a maximum of 50 players, while 50 others may be on the next one */
		page?: number,
		/** What kind of players do you want to see? Keep in mind `friends` has no effect if no authorized user */
		filter?: "all" | "friends",
		/** Only get players from a specific country, using its ISO 3166-1 alpha-2 country code! (France would be `FR`, United States `US`) */
		country?: string
		/** If `type` is `performance` and `ruleset` is mania, choose between 4k and 7k! */
		variant?: "4k" | "7k"
	}): Promise<Ranking.User> {
		return await this.request("get", ["rankings", Ruleset[ruleset], type],
		{page: config?.page, filter: config?.filter, country: config?.country, variant: config?.variant})
	}

	/**
	 * Get the top countries of a specific ruleset!
	 * @param ruleset On which Ruleset should the countries be compared?
	 * @param page Imagine the array you get as a page, it can only have a maximum of 50 countries, while 50 others may be on the next one (defaults to **1**)
	 */
	export async function getCountry(this: API, ruleset: Ruleset, page: number = 1): Promise<Ranking.Country> {
		return await this.request("get", ["rankings", Ruleset[ruleset], "country"], {page})
	}

	/** Get the top 50 players who have the most total kudosu! */
	export async function getKudosu(this: API): Promise<User.WithKudosu[]> {
		const response = await this.request("get", ["rankings", "kudosu"])
		return response.ranking // It's the only property
	}

	/**
	 * Get the rankings of a spotlight from 2009 to 2020 on a specific ruleset!
	 * @param ruleset Each spotlight has a different ranking (and often maps) depending on the ruleset
	 * @param spotlight The spotlight in question
	 * @param filter What kind of players do you want to see? Keep in mind `friends` has no effect if no authorized user (defaults to **all**)
	 */
	export async function getSpotlight(this: API, ruleset: Ruleset, spotlight: ISpotlight["id"] | ISpotlight, filter: "all" | "friends" = "all"):
	Promise<Ranking.Spotlight> {
		spotlight = typeof spotlight === "number" ? spotlight : spotlight.id
		return await this.request("get", ["rankings", Ruleset[ruleset], "charts"], {spotlight, filter})
	}
}
