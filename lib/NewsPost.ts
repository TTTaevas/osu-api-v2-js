import { API, User } from "./index.js"

/** @obtainableFrom {@link API.getNewsPosts} */
export interface NewsPost {
	id: number
	author: User["username"]
	/** Link to view the file on GitHub */
	edit_url: string
	/** Link to the first image in the document */
	first_image: string | null
	published_at: Date
	updated_at: Date
	/** Filename without the extension, used in URLs */
	slug: string
	title: string
}

export namespace NewsPost {
	/** @obtainableFrom {@link API.getNewsPost} */
	export interface WithContentNavigation extends NewsPost {
		/** With HTML */
		content: string
		navigation: {
			newer?: NewsPost
			older?: NewsPost
		}
	}

	/**
	 * Get a NewsPost, its content, and the NewsPosts right before and right after it!
	 * @param post The NewsPost, or its id, or its slug
	 */
	export async function getOne(this: API, post: NewsPost["id"] | NewsPost["slug"] | NewsPost): Promise<NewsPost.WithContentNavigation> {
		const lookup = typeof post === "object" ? post.id : post
		const key = typeof post === "string" ? undefined : "id"
		return await this.request("get", ["news", lookup], {key})
	}

	/**
	 * Get all the NewsPosts of a specific year!
	 * @param year The year the posts were made (defaults to **current year**)
	 * @privateRemarks Because the only filter is the year, everything but `news_sidebar.news_posts` is actually completely useless!
	 * You could maybe make a case for `years` being useful, but I don't believe it's useful enough to sacrifice the simplicity
	 * @remarks If the specified year is invalid/has no news, it fallbacks to the default year
	 */
	export async function getMultiple(this: API, year?: number): Promise<NewsPost[]> {
		const response = await this.request("get", ["news"], {year, limit: 0}) // Put the limit at minimum because it's about stuff we're filtering out anyway
		return response.news_sidebar.news_posts // NOT the only property as explained by the private remarks; it's believed to be the only USEFUL property
	}
}
