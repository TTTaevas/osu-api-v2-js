/**
 * Scopes determine what the API instance can do as a user!
 * https://osu.ppy.sh/docs/index.html#scopes
 * @remarks "identify" is always implicity provided, **"public" is implicitly needed for almost everything**
 */
export type Scope = "chat.read" | "chat.write" | "chat.write_manage" | "delegate" | "forum.write" | "friends.read" | "identify" | "public"

export type Mod = {
	acronym: string
	settings?: {[k: string]: any}
}

export enum Rulesets {
	osu 	= 0,
	taiko 	= 1,
	fruits	= 2,
	mania 	= 3
}

export enum Genres {
	ANY				= 0,
	UNSPECIFIED		= 1,
	"VIDEO GAME"	= 2,
	ANIME			= 3,
	ROCK			= 4,
	POP				= 5,
	OTHER			= 6,
	NOVELTY			= 7,
	""				= 8,
	"HIP HOP"		= 9,
	ELECTRONIC		= 10,
	METAL			= 11,
	CLASSICAL		= 12,
	FOLK			= 13,
	JAZZ			= 14,
}

export enum Languages {
	ANY				= 0,
	UNSPECIFIED		= 1,
	ENGLISH			= 2,
	JAPANESE 		= 3,
	CHINESE			= 4,
	INSTRUMENTAL	= 5,
	KOREAN			= 6,
	FRENCH			= 7,
	GERMAN			= 8,
	SWEDISH			= 9,
	SPANISH			= 10,
	ITALIAN			= 11,
	RUSSIAN			= 12,
	POLISH			= 13,
	OTHER			= 14,
}
