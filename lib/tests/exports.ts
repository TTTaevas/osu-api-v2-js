import ajv from "ajv"
import tsj from "ts-json-schema-generator"
import util from "util"

export type AR<T extends (...args: any) => any> = Awaited<ReturnType<T>>;
export type Test = Promise<true>;

const generator = tsj.createGenerator({path: "lib/index.ts", additionalProperties: true})

export function validate(object: unknown, schemaName: string): boolean {
	try {
		const schema = fixDate(generator.createSchema(schemaName))
		const ajv_const = new ajv.default({strict: false})
		ajv_const.addFormat("date-time", true)
		const validator = ajv_const.compile(schema)

		if (Array.isArray(object)) {
			for (let i = 0; i < object.length; i++) {
				const result = validator(object[i])
				if (validator.errors) console.error("❌ from validator:\n", validator.errors, "\n...for the following object:\n",
					util.inspect(object[i], {colors: true, compact: true, depth: 100}), "\n\n")
				if (!result) return false
			}
			return true
		} else {
			const result = validator(object)
			if (validator.errors) console.error("❌ from validator:\n", validator.errors, "\n...for the following object:\n",
				util.inspect(object, {colors: true, compact: true, depth: 100}), "\n\n")
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
