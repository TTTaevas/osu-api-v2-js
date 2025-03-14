import ajv from "ajv"
import tsj from "ts-json-schema-generator"
import util from "util"
import { API } from "../index.js";

export type AR<T extends (...args: any) => any> = Awaited<ReturnType<T>>;
export type Test = (api: API) => Promise<true>;

const generator = tsj.createGenerator({path: "lib/index.ts", additionalProperties: true})

export function validate(obj: unknown, schemaName: string): boolean {
	try {
		const schema = fixDate(generator.createSchema(schemaName))
		const ajv_const = new ajv.default({strict: false})
		ajv_const.addFormat("date-time", true)
		const validator = ajv_const.compile(schema)

		if (Array.isArray(obj)) {
			for (let i = 0; i < obj.length; i++) {
				const result = validator(obj[i])
				if (validator.errors) console.error(obj[i], util.inspect(validator.errors, {colors: true, depth: 5}))
				if (!result) return false
			}
			return true
		} else {
			const result = validator(obj)
			if (validator.errors) console.error(obj, util.inspect(validator.errors, {colors: true, depth: 5}))
			return result
		}
	} catch(err) {
		console.log(err)
		return false
	}
}

/** ajv will not work properly if type is not changed from string to object where format is date-time */
export function fixDate(arg: any) {
	if (typeof arg === "object" && arg !== null) {
		if (arg["format"] && arg["format"] === "date-time" && arg["type"] && arg["type"] === "string") {
			arg["type"] = "object"
		}

		const keys = Object.keys(arg)
		const value = Object.values(arg)
		for (let i = 0; i < keys.length; i++) {
			arg[keys[i]] = fixDate(value[i])
		}
	}

	return arg
}

/** cool for automatically coming up with the latest x-api-verison */
export function getCurrentDateString(): string {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0") // Months are zero-based
    const day = String(today.getDate()).padStart(2, "0")

	const str = `${year}${month}${day}`
	console.log("Using the following x-api-version:", str)
    return str
}

export const runTests = async (api: API, domains: Test[][]): Promise<void> => {
	const errors: unknown[] = []

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
		errors.forEach((err, i) => console.error(`̀#${i+1}:`, err, "\n"))
		throw new Error("❌ Things didn't go as expected...")
	}
}
