export interface WikiPage {
    available_locales: string[]
    layout: string
    /**
     * BCP 47 language (sub)tag, lowercase (for example, `en` for english)
     */
    locale: string
    markdown: string
    /**
     * It's what should be after `https://osu.ppy.sh/wiki/{locale}/`
     */
    path: string
    /**
     * If the `title` in the `path` is after a slash (/), this is what is before the slash
     */
    subtitle: string | null
    tags: string[]
    title: string
}
