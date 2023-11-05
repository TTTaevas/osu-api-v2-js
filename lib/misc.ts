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
