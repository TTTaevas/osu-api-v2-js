import { Chat } from "./chat.js"
import { User } from "./user.js"

export namespace WebSocketEvent {
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
			users: User[]
		}
	}

	export type Any = ChatChannelJoin | ChatChannelLeave | ChatMessageNew
}
