import "dotenv/config"
import { API } from "../index.js"
import { Test } from "./exports.js"

import * as Beatmap from "./guest/beatmap.test.js"
import * as Beatmapset from "./guest/beatmapset.test.js"
import * as Changelog from "./guest/changelog.test.js"
import * as Comment from "./guest/comment.test.js"
import * as Event from "./guest/event.test.js"
import * as Forum from "./guest/forum.test.js"
import * as Home from "./guest/home.test.js"
import * as Multiplayer from "./guest/multiplayer.test.js"
import * as News from "./guest/news.test.js"
import * as Ranking from "./guest/ranking.test.js"
import * as Spotlight from "./guest/spotlight.test.js"
import * as User from "./guest/user.test.js"
import * as Wiki from "./guest/wiki.test.js"
import * as Uncategorized from "./guest/uncategorized.test.js"

const domains: Test[][] = [
	Beatmap.tests,
	Beatmapset.tests,
	Changelog.tests,
	Comment.tests,
	Event.tests,
	Forum.tests,
	Home.tests,
	Multiplayer.tests,
	News.tests,
	Ranking.tests,
	Spotlight.tests,
	User.tests,
	Wiki.tests,
	Uncategorized.tests,
]

const runTests = async (id: number, secret: string): Promise<void> => {
	const errors: unknown[] = []
	const api = await API.createAsync(id, secret, undefined, {server: "https://osu.ppy.sh", retry_on_timeout: true})
	// api = api.withSettings({headers: {"x-api-version": getCurrentDateString()}})

	for (let i = 0; i < domains.length; i++) {
		console.log(`\n---- ${i+1}/${domains.length} ----\n`)
		const tests = domains[i]

		try {
			for (let e = 0; e < tests.length; e++) {
				const current_test = tests[e]
				console.log(current_test.name)
				await current_test(api)
			}
		} catch(err) {
			console.error(err)
			errors.push(err)
		}
		console.log(`\n---- ${i+1}/${domains.length} ----\n`)
	}
	await api.revokeToken()

	if (!errors.length) {
		console.log("✔️ Looks like the tests went well!")
	} else {
		console.log(`❌ ${errors.length} test(s) went wrong, here's some information:\n`)
		errors.forEach((err, i) => console.error(`̀#${i}:`, err, "\n"))
		throw new Error("❌ Things didn't go as expected...")
	}
}

if (process.env.ID === undefined) {throw new Error("❌ The ID has not been defined in the environment variables!")}
if (process.env.SECRET === undefined) {throw new Error("❌ The SECRET has not been defined in the environment variables!")}
runTests(Number(process.env.ID), process.env.SECRET)
