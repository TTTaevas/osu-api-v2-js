import "dotenv/config"
import { API } from "../index.js"

import * as Beatmap from "./beatmap.test.js"
import * as Beatmapset from "./beatmapset.test.js"
import * as Changelog from "./changelog.test.js"
import * as Comment from "./comment.test.js"
import * as Event from "./event.test.js"
import * as Forum from "./forum.test.js"
import * as Home from "./home.test.js"
import * as Multiplayer from "./multiplayer.test.js"

const test = async (id: number, secret: string): Promise<void> => {
	const api = await API.createAsync(id, secret, undefined, {server: "https://osu.ppy.sh"})
	// api = api.withSettings({headers: {"x-api-version": getCurrentDateString()}})

	const tests = [
		Beatmap.testBeatmap,
		Beatmapset.testBeatmapset,
		Changelog.testChangelog,
		Comment.testComment,
		Event.testEvent,
		Forum.testForum,
		Home.testHome,
		Multiplayer.testMultiplayer,
	]

	const results: {test_name: string, passed: boolean}[] = []
	for (let i = 0; i < tests.length; i++) {
		console.log("\n===>", tests[i].name)
		results.push({test_name: tests[i].name, passed: await tests[i](api.access_token)})
	}

	console.log("\n", ...results.map((r) => `${r.test_name}: ${r.passed ? "✔️" : "❌"}\n`))
	await api.revokeToken()

	if (!results.find((r) => !r.passed)) {
		console.log("✔️ Looks like the test went well!")
	} else {
		throw new Error("❌ Something in the test went wrong...")
	}
}

if (process.env.ID === undefined) {throw new Error("❌ The ID has not been defined in the environment variables!")}
if (process.env.SECRET === undefined) {throw new Error("❌ The SECRET has not been defined in the environment variables!")}
test(Number(process.env.ID), process.env.SECRET)
