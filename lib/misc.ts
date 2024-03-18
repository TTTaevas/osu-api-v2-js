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

export enum RankStatus {
	Graveyard 	= -2,
	Wip 		= -1,
	Pending		= 0,
	Ranked		= 1,
	Approved	= 2,
	Qualified	= 3,
	Loved 		= 4
}

export enum Genres {
	Any				= 0,
	Unspecified		= 1,
	"Video Game"	= 2,
	Anime			= 3,
	Rock			= 4,
	Pop				= 5,
	Other			= 6,
	Novelty			= 7,
	"Hip Hop"		= 9,
	Electronic		= 10,
	Metal			= 11,
	Classical		= 12,
	Folk			= 13,
	Jazz			= 14,
}

export enum Languages {
	Any				= 0,
	Unspecified		= 1,
	English			= 2,
	Japanese 		= 3,
	Chinese			= 4,
	Instrumental	= 5,
	Korean			= 6,
	French			= 7,
	German			= 8,
	Swedish			= 9,
	Spanish			= 10,
	Italian			= 11,
	Russian			= 12,
	Polish			= 13,
	Other			= 14,
}
