import { API } from "./index.js";
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

		/**
		 * Get a ChatChannel, and the users in it if it is a private channel!
		 * @scope {@link Scope"chat.read"}
		 * @remarks Will 404 if the user has not joined the channel (use `joinChatChannel` for that)
		 * @param channel The channel in question
		 */
		export async function getOne(this: API, channel: {channel_id: number} | Chat.Channel): Promise<Chat.Channel.WithDetails> {
			const response = await this.request("get", `chat/channels/${channel.channel_id}`)
			return response.channel
		}

		/**
		 * Get a list of all publicly joinable channels!
		 * @scope {@link Scope"chat.read"}
		 */
		export async function getAll(this: API): Promise<Chat.Channel[]> {
			return await this.request("get", "chat/channels")
		}

		/**
		 * Mark a certain channel as read up to a given message!
		 * @scope {@link Scope"chat.read"}
		 * @param channel The channel in question
		 * @param message You're marking this and all the messages before it as read!
		 */
		export async function markAsRead(this: API, channel: {channel_id: number} | Chat.Channel, message: {message_id: number} | Chat.Message): Promise<void> {
			return await this.request("put",
			`chat/channels/${channel.channel_id}/mark-as-read/${message.message_id}`, {channel_id: channel.channel_id, message: message.message_id})
		}

		/**
		 * Create/Open/Join a private messages chat channel!
		 * @scope {@link Scope"chat.read"}
		 * @param user_target The other user able to read and send messages in this channel
		 * @returns The newly created channel!
		 */
		export async function createPrivate(this: API, user_target: {id: number} | User): Promise<Chat.Channel> {
			return await this.request("post", "chat/channels", {type: "PM", target_id: user_target.id})
		}

		/**
		 * Create a new announcement!
		 * @scope {@link Scope"chat.write_manage"}
		 * @remarks From my understanding, this WILL 403 unless the user is kinda special
		 * @param channel Details of the channel you're creating
		 * @param user_targets The people that will receive your message
		 * @param message The message to send with the announcement
		 * @returns The newly created channel!
		 */
		export async function createAnnouncement(this: API, channel: {name: string, description: string}, user_targets: Array<{id: number} | User>, message: string):
		Promise<Chat.Channel> {
			const target_ids = user_targets.map((u) => u.id)
			return await this.request("post", "chat/channels", {type: "ANNOUNCE", channel, target_ids, message})
		}

		/**
		 * Join a public or multiplayer ChatChannel, allowing you to interact with it!
		 * @scope {@link Scope"chat.write_manage"}
		 * @param channel The channel you wanna join
		 * @param user (defaults to the presumed authorized user) The user joining the channel
		 */
		export async function joinOne(this: API, channel: {channel_id: number} | Chat.Channel, user?: {id: number} | User): Promise<Chat.Channel.WithDetails> {
			return await this.request("put", `chat/channels/${channel.channel_id}/users/${user?.id || this.user}`)
		}

		/**
		 * Leave/Close a public ChatChannel!
		 * @scope {@link Scope"chat.write_manage"}
		 * @param channel The channel you wanna join
		 * @param user (defaults to the presumed authorized user) The user joining the channel
		 */
		export async function leaveOne(this: API, channel: {channel_id: number} | Chat.Channel, user?: {id: number} | User): Promise<void> {
			return await this.request("delete", `chat/channels/${channel.channel_id}/users/${user?.id || this.user}`)
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

	export namespace Message {
		/**
		 * Get the recent messages of a specific ChatChannel!
		 * @scope {@link Scope"chat.read"}
		 * @param channel The Channel you wanna get the messages from
		 * @param limit (defaults to 20, max 50) The maximum amount of messages you want to get!
		 * @param since Get the messages sent after this message
		 * @param until Get the messages sent up to but not including this message
		 */
		export async function getMultiple(this: API, channel: {channel_id: number} | Chat.Channel, limit: number = 20,
		since?: {message_id: number} | Chat.Message, until?: {message_id: number} | Chat.Message): Promise<Chat.Message[]> {
			return await this.request("get", `chat/channels/${channel.channel_id}/messages`, {limit, since: since?.message_id, until: until?.message_id})
		}

		/**
		 * Send a message in a ChatChannel!
		 * @scope {@link Scope"chat.write"}
		 * @param channel The channel in which you want to send your message
		 * @param message The message you wanna send
		 * @param is_action (defaults to false) Is it a command? Like `/me dances`
		 * @returns The newly sent ChatMessage!
		 */
		export async function send(this: API, channel: {channel_id: number} | Chat.Channel, message: string, is_action: boolean = false): Promise<Chat.Message> {
			return await this.request("post", `chat/channels/${channel.channel_id}/messages`, {message, is_action})
		}

		/**
		 * Send a private message to someone!
		 * @scope {@link Scope"chat.write"}
		 * @remarks You don't need to use `createChatPrivateChannel` before sending a message
		 * @param user_target The User you wanna send your message to!
		 * @param message The message you wanna send
		 * @param is_action (defaults to false) Is it a command? Like `/me dances`
		 * @param uuid A client-side message identifier
		 * @returns The message you sent
		 */
		export async function sendPrivate(this: API, user_target: {id: number} | User, message: string, is_action: boolean = false, uuid?: string):
		Promise<{channel: Chat.Channel, message: Chat.Message}> {
			return await this.request("post", "chat/new", {target_id: user_target.id, message, is_action, uuid})
		}
	}

	/**
	 * Needs to be done periodically to reset chat activity timeout
	 * @scope {@link Scope"chat.read"}
	 * @param since UserSilences that are before that will not be returned!
	 * @returns A list of recent silences
	 * @remarks Every 30 seconds is a good idea
	 */
	export async function keepAlive(this: API, since?: {user_silence?: {id: number} | Chat.UserSilence, message?: {message_id: number} | Chat.Message}): Promise<Chat.UserSilence[]> {
		return await this.request("post", "chat/ack", {history_since: since?.user_silence?.id, since: since?.message?.message_id})
	}
}
