import { API } from "./index.js"
import { User as UserInterface } from "./user.js"
import { WikiPage } from "./wiki.js"

export namespace Home {
	interface Search {
		/** How many results there are across all pages */
		total: number
	}

	export namespace Search {
		/** @obtainableFrom {@link API.searchUser} */
		export interface User extends Search {
			/** The Users that have been found */
			data: UserInterface[]
		}

		/** @obtainableFrom {@link API.searchWiki} */
		export interface Wiki extends Search {
			/** The WikiPages that have been found */
			data: WikiPage[]
		}

		/**
		 * Look for a user like you would on the website!
		 * @param query What you would put in the searchbar
		 * @param page (defaults to 1) You normally get the first 20 results, but if page is 2, you'd get results 21 to 40 instead for example!
		 */
		export async function getUsers(this: API, query: string, page: number = 1): Promise<User> {
			const response = await this.request("get", "search", {mode: "user", query, page})
			return response.user
		}

		/**
		 * Look for a wiki page like you would on the website!
		 * @param query What you would put in the searchbar
		 * @param page (defaults to 1) You normally get the first 50 results, but if page is 2, you'd get results 51 to 100 instead for example!
		 */
		export async function getWikiPages(this: API, query: string, page: number = 1): Promise<Wiki> {
			const response = await this.request("get", "search", {mode: "wiki_page", query, page})
			return response.wiki_page
		}
	}
}
