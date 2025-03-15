import { expect } from "chai"
import { Test } from "../exports.js"

/** The awkward thing about this method is that it requires authentication AND that dev.ppy.sh stores no replays */
const getReplay: Test = async(api) => {
	if (api.server !== "https://osu.ppy.sh") {
		console.log("| ⚠️ Skipping getReplay, unable to do this test on this server")
		return true
	}

	const replay = await api.getReplay(393079484)
	expect(replay).to.be("string")
	expect(replay).to.have.lengthOf(119546)
	return true
}

export const tests = [
	getReplay,
]
