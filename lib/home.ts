import { User } from "./user.js"
import { WikiPage } from "./wiki.js"

interface SearchResult {
    /**
     * How many results there are across all pages
     */
    total: number
}

/**
 * Expected from api.searchUser()
 */
export interface SearchResultUser extends SearchResult {
    /**
     * The Users that have been found
     */
    data: User[]
}

/**
 * Expected from api.searchWiki()
 */
export interface SearchResultWiki extends SearchResult {
    /**
     * The WikiPages that have been found
     */
    data: WikiPage[]
}
