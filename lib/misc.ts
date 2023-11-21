export enum Rulesets {
	osu 	= 0,
	taiko 	= 1,
	fruits	= 2,
	mania 	= 3
}

export type Mod = {
	acronym: string
	settings?: {[k: string]: any}
}

/**
 * Scopes determine what the API instance can do as a user!
 * @remarks "identify" is always implicity provided, "public" is implicitly needed for almost everything
 */
export type Scope = "chat.read" | "chat.write" | "chat.write_manage" | "delegate" | "forum.write" | "friends.read" | "identify" | "public"
