import { Chat } from "../../index.js"
import { expect } from "chai"
import { validate, Test } from "../exports.js"

let test_channel: Chat.Channel | undefined
let pm_channel: Chat.Channel | undefined

const getChatChannels: Test = async(api) => {
	const channels = await api.getChatChannels()
	expect(channels).to.have.length.greaterThan(0)
	expect(validate(channels, "Chat.Channel")).to.be.true

	test_channel = channels[Math.floor(Math.random() * channels.length)]
	console.log("| Further Chat tests will be made on Chat.Channel", test_channel.name, "with id", test_channel.channel_id)
	return true
}

const joinChatChannel: Test = async(api) => {
	const channel = await api.joinChatChannel(test_channel ?? 14)
	if (test_channel) {
		Object.keys(test_channel).forEach((k) => {
			console.log("| Comparing key:", k)
			expect(test_channel![k as keyof Chat.Channel]).to.equal(channel[k as keyof Chat.Channel])
		})
	} else {console.warn("⚠️ No test_channel to compare channel with")}
	expect(validate(channel, "Chat.Channel.WithDetails")).to.be.true
	return true
}

const getChatChannel: Test = async(api) => {
	const channel = await api.getChatChannel(test_channel ?? 14)
	if (test_channel) {
		Object.keys(test_channel).forEach((k) => {
			console.log("| Comparing key:", k)
			expect(test_channel![k as keyof Chat.Channel]).to.equal(channel[k as keyof Chat.Channel])
		})
	} else {console.warn("⚠️ No test_channel to compare channel with")}
	expect(validate(channel, "Chat.Channel.WithDetails")).to.be.true
	return true
}

const sendChatMessage: Test = async(api) => {
	const message = await api.sendChatMessage(test_channel ?? 14, "hello, just testing something")
	expect(message.channel_id).to.equal(test_channel?.channel_id ?? 14)
	expect(message.sender_id).to.equal(api.user)
	expect(message.sender.id).to.equal(api.user)
	expect(message.content).to.equal("hello, just testing something")
	expect(message.is_action).to.be.false
	expect(validate(message, "Chat.Message")).to.be.true
	return true
}

const getChatMessages: Test = async(api) => {
	const messages = await api.getChatMessages(test_channel ?? 14)
	expect(messages).to.have.length.greaterThan(0)
	messages.forEach((message) => expect(message.channel_id).to.equal(test_channel?.channel_id ?? 14))
	messages.forEach((message) => expect(message.sender_id).to.equal(message.sender.id))
	expect(validate(messages, "Chat.Message")).to.be.true
	return true
}

const createChatPrivateChannel: Test = async(api) => {
	const channel = await api.createChatPrivateChannel(3)
	expect(channel.type).to.equal("PM")
	expect(validate(channel, "Chat.Channel")).to.be.true

	pm_channel = channel
	console.log("| Further Chat tests will be made on PM Chat.Channel", pm_channel.name, "with channel_id", pm_channel.channel_id)
	return true
}

const sendChatPrivateMessage: Test = async(api) => {
	const response = await api.sendChatPrivateMessage(3, "hello")
	expect(response.message.content).to.equal("hello")
	expect(response.message.sender_id).to.equal(api.user)
	expect(response.message.sender.id).to.equal(api.user)

	if (pm_channel) {
		expect(response.message.channel_id).to.equal(pm_channel.channel_id)
		Object.keys(pm_channel).forEach((k) => {
			if (k !== "recent_messages") {
				console.log("| Comparing key:", k)
				expect(pm_channel![k as keyof Chat.Channel]).to.equal(response.channel[k as keyof Chat.Channel])
			}
		})
	} else {console.warn("⚠️ No pm_channel to compare channel with")}

	expect(validate(response.message, "Chat.Message")).to.be.true
	expect(validate(response.channel, "Chat.Channel")).to.be.true
	return true
}

const leaveChatChannel: Test = async(api) => {
	console.log("| PUBLIC")
	const response_public = await api.leaveChatChannel(test_channel ?? 14)
	expect(response_public).to.be.undefined
	console.log("| PM")
	const response_pm = await api.leaveChatChannel(pm_channel ?? 0)
	expect(response_pm).to.be.undefined
	return true
}

const keepChatAlive: Test = async(api) => {
	const silences = await api.keepChatAlive()
	if (silences.length < 1) {console.log("⚠️ Note: Empty array received, no silence to check")}
	expect(validate(silences, "Chat.UserSilence")).to.be.true
	return true
}

export const tests = [
	getChatChannels,
	joinChatChannel,
	getChatChannel,
	sendChatMessage,
	getChatMessages,
	createChatPrivateChannel,
	sendChatPrivateMessage,
	leaveChatChannel,
	keepChatAlive,
]
