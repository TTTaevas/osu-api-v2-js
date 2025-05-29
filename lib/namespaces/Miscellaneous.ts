import { API, Ruleset, User } from "../index.js"

/**
 * This can be treated as a collection of concepts and interfaces that are used throughout the API and the package but yet
 * do not belong in any other namespace
 *
 * This also contains a couple of methods which would similarly look out of place elsewhere
 */
export namespace Miscellaneous {
	/**
	 * Some endpoints make use of a "page" argument, which is a number that allows you to skip a certain amount of results,
	 * you may want to look up images of a "paginator" if you're confused and would like a visual idea
	 * @remarks The amount of results skipped is the amount of pages minus 1, times the amount of results on a page
	 */
	export type Page = number

	/**
	 * Some endpoints make use of a "cursor_string" argument, which allows you to get more results on a subsequent request,
	 * it is obtained alongside the results you have already gotten
	 * @remarks So you can make a request without that, make a 2nd request with what you've obtained for more results,
	 * and then possibly a 3rd request with what you've got from the 2nd request for even more results!
	 */
	export type CursorString = string

	/**
	 * Some endpoints make use of a "sort" argument, which allows you to choose to get results from newest to oldest and vice-versa!
	 * @remarks `id_desc` (descending) is for newest first and oldest last, while `id_asc` (ascending) is for oldest first and newest last
	 */
	export type Sort = "id_desc" | "id_asc"

	/**
	 * Some endpoints allow you to customize the amount and order of what you will receive, such endpoints usually have a `config` argument
	 * that will expect an object that roughly meets this very interface!
	 */
	export interface Config {
		/**
		 * The maximum amount of results to get
		 * @remarks Regardless of the limit, the API server will not send more than a certain amount of results,
		 * that amount being different for every endpoint
		 */
		limit?: number
		/** "id_asc" to have the oldest element first, "id_desc" to have the newest instead */
		sort?: Miscellaneous.Sort
		/** Which page of the results to get */
		page?: Miscellaneous.Page
		/** A cursor_string provided by a previous request */
		cursor_string?: Miscellaneous.CursorString
	}

	/** The content of a forum post or the "me!" section of a user page, where there can be lots of custom text */
	export interface RichText {
		/** Content in HTML format */
		html: string
		/** Content in BBCode format */
		raw: string
	}

	export interface Country {
		/** The country's ISO 3166-1 alpha-2 code! (France would be `FR`, United States `US`) */
		code: string
		name: string
	}

	export namespace Country {
		export interface Ranking {
			cursor: {
				/** The number of the next page, is null if no more results are available */
				page: number | null
			}
			/** Total amount of elements available across all pages, not on this specific page! Maximum of 10000 */
			total: number
			ranking: {
				/** Same as `country.code` */
				code: Country["code"]
				active_users: number
				play_count: number
				ranked_score: number
				performance: number
				country: Country
			}[]
		}

		/**
		* Get the top countries of a specific ruleset!
		* @param ruleset On which Ruleset should the countries be compared?
		* @param page Imagine the array you get as a page, it can only have a maximum of 50 countries, while 50 others may be on the next one (defaults to **1**)
		*/
		export async function getRanking(this: API, ruleset: Ruleset, page: Page = 1): Promise<Country.Ranking> {
			return await this.request("get", ["rankings", Ruleset[ruleset], "country"], {page})
		}
	}

	/**
	 * Get the backgrounds made and selected for this season or for last season!
	 * @returns When the season ended, and for each background, its URL and its artist
	 */
	export async function getSeasonalBackgrounds(this: API): Promise<{ends_at: Date, backgrounds: {url: string, user: User}[]}> {
		return await this.request("get", ["seasonal-backgrounds"])
	}
}