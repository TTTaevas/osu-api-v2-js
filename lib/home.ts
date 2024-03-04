import { User as UserInterface } from "./user.js"
import { WikiPage } from "./wiki.js"

interface SearchResult {
	/** How many results there are across all pages */
	total: number
}

export namespace SearchResult {
	/** @obtainableFrom {@link API.searchUser} */
	export interface User extends SearchResult {
		/** The Users that have been found */
		data: UserInterface[]
	}

	/** @obtainableFrom {@link API.searchWiki} */
	export interface Wiki extends SearchResult {
		/** The WikiPages that have been found */
		data: WikiPage[]
	}
}
