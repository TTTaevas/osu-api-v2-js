import { API, User as IUser } from "../index.js";

export namespace Chat {
	/** @obtainableFrom {@link API.keepChatAlive} */
	export interface UserSilence {
		id: number
		user_id: IUser["id"]
	}

	/**
	 * @obtainableFrom
	 * {@link API.getChatChannels} /
	 * {@link API.sendChatPrivateMessage}
	 */
	export interface Channel {
		channel_id: number
		description: string | null
		icon: string | null
		message_length_limit: number
		moderated: boolean
		name: string
		type: "PUBLIC" | "PRIVATE" | "MULTIPLAYER" | "SPECTATOR" | "TEMPORARY" | "PM" | "GROUP" | "ANNOUNCE"
		uuid: string | null
	}

	export namespace Channel {
		/** @obtainableFrom {@link API.createChatPrivateChannel} */
		export interface WithRecentmessages extends Channel {
			recent_messages: Chat.Message[]
		}

		/**
		 * @obtainableFrom
		 * {@link API.sendChatPrivateMessage} /
		 * {@link API.createChatPrivateChannel}
		 */
		export interface WithDetails extends Channel {
			current_user_attributes: {
				can_list_users: boolean
				can_message: boolean
				/**
				 * The reason why messages can't be sent in this channel
				 * @remarks Is null if messages can be sent
				 */
				can_message_error: string | null
				/** @remarks Is null if no message has been read (I think) */
				last_read_id: Message["message_id"] | null
			}
			last_message_id: Message["message_id"]
			/**
			 * The ids of the users that are in the channel
			 * @remarks Is empty for public channels
			 */
			users: IUser["id"][]
		}

		/**
		 * Get a ChatChannel that you have joined, and the users in it if it is a private channel!
		 * @scope {@link Scope"chat.read"}
		 * @param channel The channel in question
		 * @remarks Will 404 if the user has not joined the channel (use `joinChatChannel` for that)
		 */
		export async function getOne(this: API, channel: Channel["channel_id"] | Channel): Promise<Channel.WithDetails> {
			const channel_id = typeof channel === "number" ? channel : channel.channel_id
			const response = await this.request("get", ["chat", "channels", channel_id])
			return response.channel // NOT the only property; `users` is already provided within `channel` so it is useless
		}

		/**
		 * Get a list of all publicly joinable channels!
		 * @scope {@link Scope"chat.read"}
		 */
		export async function getAll(this: API): Promise<Channel[]> {
			return await this.request("get", ["chat", "channels"])
		}

		/**
		 * Mark a certain channel as read up to a given message!
		 * @scope {@link Scope"chat.read"}
		 * @param channel The channel in question
		 * @param message You're marking this and all the messages before it as read!
		 */
		export async function markAsRead(this: API, channel: Channel["channel_id"] | Channel, message: Message["message_id"] | Message): Promise<void> {
			const channel_id = typeof channel === "number" ? channel : channel.channel_id
			const message_id = typeof message === "number" ? message : message.message_id
			return await this.request("put", ["chat", "channels", channel_id, "mark-as-read", message_id], {channel_id, message_id})
		}

		/**
		 * Create/Open/Join a private messages chat channel!
		 * @scope {@link Scope"chat.read"}
		 * @param user_target The other user able to read and send messages in this channel
		 * @returns The newly created channel!
		 */
		export async function createPrivate(this: API, user_target: IUser["id"] | IUser): Promise<Channel.WithRecentmessages> {
			const target_id = typeof user_target === "number" ? user_target : user_target.id
			return await this.request("post", ["chat", "channels"], {type: "PM", target_id})
		}

		/**
		 * Create a new announcement!
		 * @scope {@link Scope"chat.write_manage"}
		 * @param channel Details of the channel you're creating
		 * @param user_targets The people that will receive your message
		 * @param message The message to send with the announcement
		 * @returns The newly created channel!
		 * @remarks From my understanding, this WILL 403 unless the user is kinda special
		 */
		export async function createAnnouncement(this: API, channel: {name: string, description: string}, user_targets: Array<IUser["id"] | IUser>, message: string):
		Promise<Channel> {
			const target_ids = user_targets.map((user) => typeof user === "number" ? user : user.id)
			return await this.request("post", ["chat", "channels"], {type: "ANNOUNCE", channel, target_ids, message})
		}

		/**
		 * Join a public or multiplayer ChatChannel, allowing you to interact with it!
		 * @scope {@link Scope"chat.write_manage"}
		 * @param channel The channel you wanna join
		 * @param user The user joining the channel (defaults to the **presumed authorized user** (api.user))
		 */
		export async function joinOne(this: API, channel: Channel["channel_id"] | Channel, user?: IUser["id"] | IUser): Promise<Channel.WithDetails> {
			const channel_id = typeof channel === "number" ? channel : channel.channel_id
			const user_id = typeof user === "number" ? user : typeof user === "object" ? user.id : this.user!
			return await this.request("put", ["chat", "channels", channel_id, "users", user_id])
		}

		/**
		 * Leave/Close a public ChatChannel!
		 * @scope {@link Scope"chat.write_manage"}
		 * @param channel The channel you wanna leave/close
		 * @param user The user leaving/closing the channel (defaults to the **presumed authorized user** (api.user))
		 */
		export async function leaveOne(this: API, channel: Channel["channel_id"] | Channel, user?: IUser["id"] | IUser): Promise<void> {
			const channel_id = typeof channel === "number" ? channel : channel.channel_id
			const user_id = typeof user === "number" ? user : typeof user === "object" ? user.id : this.user!
			return await this.request("delete", ["chat", "channels", channel_id, "users", user_id])
		}
	}

	/** A normal, basic user, but `last_visit` is a string when not null! */
	export interface User extends Omit<IUser, "last_visit"> {
		/** When not null, it looks like "2025-03-16T14:28:23+00:00" so just run `new Date()` with that */
		last_visit: string | null
	}

	/** @obtainableFrom {@link Chat.Websocket.Event.ChatMessageNew} */
	export interface Message {
		channel_id: Channel["channel_id"]
		content: string
		is_action: boolean
		message_id: number
		sender_id: IUser["id"]
		/** It looks like "2025-03-16T14:28:23Z" so just run `new Date()` with that */
		timestamp: string
		/** Like "action", "markdown", "plain" */
		type: string
		uuid?: string | null
	}

	export namespace Message {
		/**
		 * @obtainableFrom
		 * {@link API.sendChatPrivateMessage} /
		 * {@link API.sendChatMessage} /
		 * {@link API.getChatMessages}
		 */
		export interface WithSender extends Omit<Message, "timestamp"> {
			/** Unlike the `timestamp` of a default `Message`, it is a Date object! */
			timestamp: Date
			sender: IUser
		}

		/**
		 * Get the recent messages of a specific ChatChannel!
		 * @scope {@link Scope"chat.read"}
		 * @param channel The Channel you wanna get the messages from
		 * @param limit The maximum amount of messages you want to get, up to 50! (defaults to **20**)
		 * @param since Get the messages sent after this message
		 * @param until Get the messages sent up to but not including this message
		 */
		export async function getMultiple(this: API, channel: Channel["channel_id"] | Channel, limit: number = 20,
		since?: Message["message_id"] | Message, until?: Message["message_id"] | Message): Promise<Message.WithSender[]> {
			const channel_id = typeof channel === "number" ? channel : channel.channel_id
			since = typeof since === "number" ? since : since?.message_id
			until = typeof until === "number" ? until : until?.message_id
			return await this.request("get", ["chat", "channels", channel_id, "messages"], {limit, since, until})
		}

		/**
		 * Send a message in a ChatChannel!
		 * @scope {@link Scope"chat.write"}
		 * @param channel The channel in which you want to send your message
		 * @param message The message you wanna send
		 * @param is_action Is it a command? Like `/me dances` (defaults to **false**)
		 * @returns The newly sent ChatMessage!
		 */
		export async function send(this: API, channel: Channel["channel_id"] | Channel, message: string, is_action: boolean = false): Promise<Message.WithSender> {
			const channel_id = typeof channel === "number" ? channel : channel.channel_id
			return await this.request("post", ["chat", "channels", channel_id, "messages"], {message, is_action})
		}

		/**
		 * Send a private message to someone!
		 * @scope {@link Scope"chat.write"}
		 * @param user_target The User you wanna send your message to!
		 * @param message The message you wanna send
		 * @param is_action Is it a command? Like `/me dances` (defaults to **false**)
		 * @param uuid A client-side message identifier
		 * @returns The message you sent
		 * @remarks You don't need to use `createChatPrivateChannel` before sending a message
		 */
		export async function sendPrivate(this: API, user_target: IUser["id"] | IUser, message: string, is_action: boolean = false, uuid?: string):
		Promise<{channel: Channel, message: Message.WithSender}> {
			const target_id = typeof user_target === "number" ? user_target : user_target.id
			return await this.request("post", ["chat", "new"], {target_id, message, is_action, uuid})
		}
	}

	/** Everything here is great to use with the WebSocket you can get with {@link API.generateChatWebsocket}! */
	export namespace Websocket {
		/**
		* Use any of those with `socket.send()` to send a command to the WebSocket!
		* @example `socket.send(osu.Chat.Websocket.Command.chatStart)`
		*/
		export namespace Command {
			export const chatStart = JSON.stringify({event: "chat.start"})
			export const chatEnd = JSON.stringify({event: "chat.end"})
		}

		/** Those are what you'll get from WebSocket's `MessageEvent`s! */
		export namespace Event {
			export interface Error {
				error: string
				event: undefined
				data: undefined
			}

			export interface Ready {
				event: "connection.ready"
			}

			export interface ChatChannelJoin {
				event: "chat.channel.join"
				data: Chat.Channel.WithDetails
			}

			export interface ChatChannelLeave {
				event: "chat.channel.part"
				data: Chat.Channel.WithDetails
			}

			export interface ChatMessageNew {
				event: "chat.message.new"
				data: {
					messages: Chat.Message[]
					users: Chat.User[]
				}
			}

			/** That's the type of `JSON.parse(m.toString())` where `m` is a WebSocket's `MessageEvent`! */
			export type Any = Error | Ready | ChatChannelJoin | ChatChannelLeave | ChatMessageNew
		}

		/**
		 * Get the headers you might require in order to create a WebSocket connection!
		 * @returns An object with the proper `Authorization: Bearer` header, in addition to the headers used in other requests,
		 * which are all specified in {@link API.headers}
		 * @remarks Feel free to use this and ignore {@link API.generateChatWebsocket} if for example
		 * you're gonna use a third party package for handling websockets
		 */
		export function getHeaders(this: API): {[key: string]: any} {
			return {...this.headers, Authorization: `${this.token_type} ${this.access_token}`}
		}

		/**
		* Get a WebSocket to get Websocket events from!
		* @param headers The headers that will be used to create the WebSocket (defaults to **running `getChatWebsocketHeaders()`**)
		* @param server The "notification websocket/server" URL (defaults to **wss://notify.ppy.sh**)
		*/
		export function generate(this: API, headers?: {[key: string]: any}, server = "wss://notify.ppy.sh"): WebSocket {
			return new WebSocket(server, {headers: headers ?? this.getChatWebsocketHeaders()})
		}
	}

	/**
	 * Needs to be done periodically to reset chat activity timeout
	 * @scope {@link Scope"chat.read"}
	 * @param since UserSilences that are before that will not be returned!
	 * @returns A list of recent silences
	 * @remarks Every 30 seconds is a good idea
	 */
	export async function keepAlive(this: API, since?: {user_silence?: UserSilence["id"] | UserSilence, message?: Message["message_id"] | Message}):
	Promise<UserSilence[]> {
		const history_since = typeof since?.user_silence === "object" ? since.user_silence.id : since?.user_silence
		const message_since = typeof since?.message === "object" ? since.message.message_id : since?.message
		const response = await this.request("post", ["chat", "ack"], {history_since, since: message_since})
		return response.silences // It's the only property
	}
}
