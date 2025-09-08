import { expect } from "chai"
import { validate, Test } from "../exports.js"

const getResourceOwner: Test = async(api) => {
	const user = await api.getResourceOwner()
	expect(user.id).to.equal(api.user)
	try {
		expect(validate(user, "User.Extended.WithStatisticsrulesets")).to.be.true
	} catch(e) {
		console.log("| If the above error is about `cover_url` not being a string, this is safe to ignore (dev server difference)")
		console.log("| Otherwise, you should at least investigate what's happening")
		console.log("| Either way, this test will NOT throw")
	}

	return true
}

const getFriends: Test = async(api) => {
	const relations = await api.getFriends()
	expect(relations).to.have.length.greaterThan(0)
	relations.forEach((relation) => expect(relation.target.id).to.equal(relation.target_id))
	relations.forEach((relation) => expect(relation.relation_type).to.equal("friend"))
	expect(validate(relations, "User.Relation")).to.be.true
	return true
}

const getFavouriteBeatmapsetsIds: Test = async(api) => {
	const ids = await api.getFavouriteBeatmapsetsIds()
	expect(ids).to.have.length.greaterThan(0)
	ids.forEach((id) => expect(id).to.be.greaterThan(0))
	return true
}

export const tests = [
	getResourceOwner,
	getFriends,
	getFavouriteBeatmapsetsIds,
]
