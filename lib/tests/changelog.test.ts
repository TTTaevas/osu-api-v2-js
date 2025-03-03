import { API } from "../index.js"
import { expect } from "chai"
import { validate, Test } from "./exports.js"

let api: API = new API({retry_on_timeout: true})

const lookupChangelogBuild = async(): Test => {
	const build = await api.lookupChangelogBuild(7156)
	expect(build.id).to.equal(7156)
	expect(build.display_version).to.equal("2023.1008.1")
	expect(build.youtube_id).to.be.null
	expect(validate(build, "Changelog.Build.WithChangelogentriesVersions"))
	return true
}

const getChangelogBuild = async(): Test => {
	const build = await api.getChangelogBuild("lazer", "2023.1008.1")
	expect(build.display_version).to.equal("2023.1008.1")
	expect(build.id).to.equal(7156)
	expect(build.youtube_id).to.be.null
	expect(validate(build, "Changelog.Build.WithChangelogentriesVersions"))
	return true
}

const getChangelogBuilds = async(): Test => {
	const builds = await api.getChangelogBuilds(undefined, {from: "2023.1031.0", to: 7184}, ["markdown"])
	expect(builds).to.have.lengthOf(4)
	builds.forEach((build) => expect(build.created_at).to.be.lessThan(new Date("2024")))
	builds.forEach((build) => build.changelog_entries.forEach((entry) => expect(entry.message).to.not.be.undefined))
	builds.forEach((build) => build.changelog_entries.forEach((entry) => expect(entry.message_html).to.be.undefined))
	expect(validate(builds, "Changelog.Build.WithUpdatestreamsChangelogentries"))
	return true
}

const getChangelogStreams = async(): Test => {
	const streams = await api.getChangelogStreams()
	expect(streams).to.have.length.greaterThan(2)
	expect(validate(streams, "Changelog.UpdateStream.WithLatestbuildUsercount"))
	return true
}

export const tests = [
	lookupChangelogBuild,
	getChangelogBuild,
	getChangelogBuilds,
	getChangelogStreams,
]

export async function testChangelog(token: API["_access_token"]) {
	api.access_token = token
	for (let i = 0; i < tests.length; i++) {
		try {
			console.log(tests[i].name)
			await tests[i]()
		} catch(e) {
			console.error(e)
			return false
		}
	}
	return true
}
