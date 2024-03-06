import { User } from "./user.js";

export namespace Chat {
	/** @obtainableFrom {@link API.keepChatAlive} */
	export interface UserSilence {
		id: number
		user_id: number
	}

	/**
	 * @obtainableFrom
	 * {@link API.sendChatPrivateMessage} /
	 * {@link API.createChatPrivateChannel}
	 */
	export interface Channel {
		channel_id: number
		name: string
		description: string | null
		icon: string | null
		type: "PUBLIC" | "PRIVATE" | "MULTIPLAYER" | "SPECTATOR" | "TEMPORARY" | "PRIVATE" | "PM" | "GROUP" | "ANNOUNCE"
		moderated: boolean
		uuid: string | null
	}

	export namespace Channel {
		/**
		 * @obtainableFrom
		 * {@link API.sendChatPrivateMessage} /
		 * {@link API.createChatPrivateChannel}
		 */
		export interface WithDetails extends Channel {
			current_user_attributes: {
				can_message: boolean
				/**
				 * The reason why messages can't be sent in this channel
				 * @remarks Is null if messages can be sent
				 */
				can_message_error: string | null
				/** @remarks Is null if no message has been read (I think) */
				last_read_id: number | null
			}
			last_message_id: number
			/**
			 * The ids of the users that are in the channel
			 * @remarks Is empty for public channels
			 */
			users: number[]
		}
	}

	/**
	 * @obtainableFrom
	 * {@link API.sendChatPrivateMessage} /
	 * {@link API.sendChatMessage} /
	 * {@link API.getChatMessages}
	 */
	export interface Message {
		channel_id: number
		content: string
		is_action: boolean
		message_id: number
		sender_id: number
		timestamp: Date
		/** Like "action", "markdown", "plain" */
		type: string
		uuid?: string | null
		sender: User
	}
}
