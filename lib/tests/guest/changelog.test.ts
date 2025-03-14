import { expect } from "chai"
import { validate, Test } from "../exports.js"

const lookupChangelogBuild: Test = async(api) => {
	const build = await api.lookupChangelogBuild(7156)
	expect(build.id).to.equal(7156)
	expect(build.display_version).to.equal("2023.1008.1")
	expect(build.youtube_id).to.be.null
	expect(validate(build, "Changelog.Build.WithChangelogentriesVersions")).to.be.true
	return true
}

const getChangelogBuild: Test = async(api) => {
	const build = await api.getChangelogBuild("lazer", "2023.1008.1")
	expect(build.display_version).to.equal("2023.1008.1")
	expect(build.id).to.equal(7156)
	expect(build.youtube_id).to.be.null
	expect(validate(build, "Changelog.Build.WithChangelogentriesVersions")).to.be.true
	return true
}

const getChangelogBuilds: Test = async(api) => {
	const builds = await api.getChangelogBuilds(undefined, {from: "2023.1031.0", to: 7184}, ["markdown"])
	expect(builds).to.have.lengthOf(4)
	builds.forEach((build) => expect(build.created_at).to.be.lessThan(new Date("2024")))
	builds.forEach((build) => build.changelog_entries.forEach((entry) => expect(entry.message).to.not.be.undefined))
	builds.forEach((build) => build.changelog_entries.forEach((entry) => expect(entry.message_html).to.be.undefined))
	expect(validate(builds, "Changelog.Build.WithUpdatestreamsChangelogentries")).to.be.true
	return true
}

const getChangelogStreams: Test = async(api) => {
	const streams = await api.getChangelogStreams()
	expect(streams).to.have.length.greaterThan(2)
	expect(validate(streams, "Changelog.UpdateStream.WithLatestbuildUsercount")).to.be.true
	return true
}

export const tests = [
	lookupChangelogBuild,
	getChangelogBuild,
	getChangelogBuilds,
	getChangelogStreams,
]
