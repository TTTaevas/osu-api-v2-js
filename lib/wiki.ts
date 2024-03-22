import { API } from "./index.js"

/** @obtainableFrom {@link API.getWikiPage} */
export interface WikiPage {
	available_locales: string[]
	layout: string
	/** Lowercase BCP 47 language (sub)tag (for example, `en` for english) */
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
	 * @param locale The BCP 47 language (sub)tag lowercase (for example, for a french WikiPage, use "fr") (defaults to **en**) 
	 */
	export async function getOne(this: API, path: string, locale: WikiPage["locale"] = "en"): Promise<WikiPage> {
		return await this.request("get", `wiki/${locale}/${path}`)
	}
}
