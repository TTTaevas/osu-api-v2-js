import { API } from "./index.js"

/**
 * Expected from api.getWikiPage(), SearchResultWiki
 */
export interface WikiPage {
	available_locales: string[]
	layout: string
	/** BCP 47 language (sub)tag, lowercase (for example, `en` for english) */
	locale: string
	markdown: string
	/** It's what should be after `https://osu.ppy.sh/wiki/{locale}/` */
	path: string
	/**
	 * Think of it as the title of the parent wiki page
	 * @remarks If the `title` in the `path` (assuming it's in it (very unlikely if `locale` is not `en`)) is after a slash (/), this is what is before the slash
	 */
	subtitle: string | null
	tags: string[]
	title: string
}

export namespace WikiPage {
	/**
	 * Get a wiki page!
	 * @param path What's in the page's URL after `https://osu.ppy.sh/wiki/` (so the title, after the subtitle if there is a subtitle)
	 * (An example for `https://osu.ppy.sh/wiki/en/Game_mode/osu!` would be `Game_mode/osu!`)
	 * @param locale (defaults to "en") The BCP 47 language (sub)tag, lowercase (for example, for the article in french, use "fr")
	 */
	export async function getOne(this: API, path: string, locale: string = "en"): Promise<WikiPage> {
		return await this.request("get", `wiki/${locale}/${path}`)
	}
}
