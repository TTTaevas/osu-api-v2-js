import { API } from "../../index.js"
import { expect } from "chai"
import { validate, Test } from "../exports.js"

let api: API = new API({retry_on_timeout: true})

const getSpotlights: Test = async(api: API) => {
	const spotlights = await api.getSpotlights()
	expect(spotlights).to.have.length.greaterThanOrEqual(132)
	expect(validate(spotlights, "Spotlight")).to.be.true
	return true
}

export const tests = [
	getSpotlights,
]
