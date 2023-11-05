import { CurrentUserAttributes, User } from "./user.js";

export type ChannelType =
"PUBLIC" |
"PRIVATE" |
"MULTIPLAYER" |
"SPECTATOR" |
"TEMPORARY" |
"PRIVATE" |
"PM" |
"GROUP" |
"ANNOUNCE";

export interface UserSilence {
	id: number
	user_id: number
}

export interface ChatChannel {
	channel_id: number
	name: string
	description: string | null
	icon: string | null
	type: ChannelType
	moderated: boolean
	uuid: string | null
	current_user_attributes?: CurrentUserAttributes | null
	last_message_id?: number | null
	users?: number[] | null
}

export interface ChatMessage {
	channel_id: number
	content: string
	is_action: boolean
	message_id: number
	sender_id: number
	timestamp: Date
	type: string
	uuid: string | null
	sender?: User
}
