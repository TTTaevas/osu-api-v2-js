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
}

export interface ChatChannelWithDetails extends ChatChannel {
	current_user_attributes: {
		can_message: boolean
		/**
		 * The reason why messages can't be sent in this channel
		 * @remarks Is null if messages can be sent
		 */
		can_message_error: string | null
		/**
		 * @remarks Is null if no message has been read (I think)
		 */
		last_read_id: number | null
	}
	last_message_id: number
	/**
	 * The ids of the users that are in the channel
	 * @remarks Is empty for public channels
	 */
	users: number[]
}

export interface ChatMessage {
	channel_id: number
	content: string
	is_action: boolean
	message_id: number
	sender_id: number
	timestamp: Date
	/**
	 * Like "action", "markdown", "plain"
	 */
	type: string
	uuid?: string | null
	sender: User
}
