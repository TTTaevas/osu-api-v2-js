import { API } from "./index.js"
import { User } from "./user.js"
import { WikiPage } from "./wiki.js"

export namespace Home {
	export namespace Search {
		/**
		 * Look for a user like you would on the website!
		 * @param query What you would put in the searchbar
		 * @param page You normally get the first **20 results**, but if page is 2, you'd get results 21 to 40 instead for example! (defaults to **1**)
		 */
		export async function getUsers(this: API, query: string, page: number = 1): Promise<{data: User[], total: number}> {
			const response = await this.request("get", "search", {mode: "user", query, page})
			return response.user // It's the only property
		}

		/**
		 * Look for a wiki page like you would on the website!
		 * @param query What you would put in the searchbar
		 * @param page You normally get the first **50 results**, but if page is 2, you'd get results 51 to 100 instead for example! (defaults to **1**)
		 */
		export async function getWikiPages(this: API, query: string, page: number = 1): Promise<{data: WikiPage[], total: number}> {
			const response = await this.request("get", "search", {mode: "wiki_page", query, page})
			return response.wiki_page // It's the only property
		}
	}
}
