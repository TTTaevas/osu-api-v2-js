export enum GameModes {
	Osu 		= 0,
	Taiko 	= 1,
	Fruits	= 2,
	Mania 	= 3
}

export type Mod = {
	acronym: string
	settings?: {[k: string]: any}
}
