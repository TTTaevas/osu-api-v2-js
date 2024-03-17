import { API } from "./index.js"

/** @obtainableFrom {@link API.getNewsPosts} */
export interface NewsPost {
	id: number
	author: string
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
	 * @param post An object with the id or the slug of a NewsPost (the slug being the filename minus the extension, used in its URL)
	 */
	export async function getOne(this: API, post: {id?: number, slug?: string} | NewsPost): Promise<NewsPost.WithContentNavigation> {
		const key = post.id !== undefined ? "id" : undefined
		const lookup = post.id !== undefined ? post.id : post.slug
		return await this.request("get", `news/${lookup}`, {key})
	}

	/**
	 * Get all the NewsPosts of a specific year!
	 * @remarks If the specified year is invalid/has no news, it fallbacks to the default year
	 * @param year (defaults to current year) The year the posts were made
	 */
	export async function getMultiple(this: API, year?: number): Promise<NewsPost[]> {
		const response = await this.request("get", "news", {year, limit: 1})
		return response.news_sidebar.news_posts
	}
}
