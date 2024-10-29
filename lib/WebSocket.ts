import { WebSocket as WebSocketType } from "ws"
import { API, Chat, User } from "./index.js"

/** Everything here is great to use with the WebSocket you can get with {@link API.generateWebSocket}! */
export namespace WebSocket {
	/** 
	 * Use any of those with `socket.send()` to send a command to the WebSocket!
	 * @example `socket.send(osu.WebSocket.Command.chatStart)`
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

		/** That's the type of `JSON.parse(m.toString())` where `m` is a WebSocket's `MessageEvent`! */
		export type Any = Error | ChatChannelJoin | ChatChannelLeave | ChatMessageNew
	}

	/** 
	 * Get a websocket to get WebSocket events from!
	 * @param server The "notification websocket/server" URL (defaults to **wss://notify.ppy.sh**)
	*/
	export function generate(this: API, server = "wss://notify.ppy.sh"): WebSocketType {
		return new WebSocketType(server, [], {
			headers: {
				"User-Agent": "osu-api-v2-js (https://github.com/TTTaevas/osu-api-v2-js)",
				Authorization: `${this.token_type} ${this.access_token}`
			}
		})
	}
}
