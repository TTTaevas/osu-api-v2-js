import ajv from "ajv"
import tsj from "ts-json-schema-generator"
import util from "util"
import { exec } from "child_process"
import http from "http"
import { API, APIError } from "../index.js";
import { AssertionError } from "assert"

export type AR<T extends (...args: any) => any> = Awaited<ReturnType<T>>;
export type Test = (api: API) => Promise<true>;

const generator = tsj.createGenerator({path: "lib/index.ts", additionalProperties: true, skipTypeCheck: true})

export function validate(obj: unknown, schemaName: string): boolean {
	try {
		const schema = fixDate(generator.createSchema(schemaName))
		const ajv_const = new ajv.default({strict: false})
		ajv_const.addFormat("date-time", true)
		const validator = ajv_const.compile(schema)

		if (Array.isArray(obj)) {
			for (let i = 0; i < obj.length; i++) {
				validator(obj[i])
				if (validator.errors?.length) {
					console.error(obj[i], util.inspect(validator.errors, {colors: true, depth: 5}))
					return false
				}
			}
			return true
		} else {
			validator(obj)
			if (validator.errors?.length) console.error(obj, util.inspect(validator.errors, {colors: true, depth: 5}))
			return validator.errors?.length === undefined
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

export async function getCode(url: string, redirect_uri: string): Promise<string> {
	const httpserver = http.createServer()
	const host = redirect_uri.substring(redirect_uri.indexOf("/") + 2, redirect_uri.lastIndexOf(":"))
	const port = Number(redirect_uri.substring(redirect_uri.lastIndexOf(":") + 1).split("/")[0])
	httpserver.listen({host, port})

	console.log("Waiting for code...")
	const command = (process.platform == "darwin" ? "open" : process.platform == "win32" ? "start" : "xdg-open")
	exec(`${command} "${url}"`)

	const code: string = await new Promise((resolve) => {
		httpserver.on("request", (request, response) => {
			if (request.url) {
				console.log("Received code!")
				response.end("Worked! You may now close this tab.", "utf-8")
				httpserver.close()
				resolve(request.url.substring(request.url.indexOf("code=") + 5))
			}
		})
	})
	return code
}

export const runTests = async (api: API, domains: Test[][]): Promise<void> => {
	const retry_on_timeout = api.retry_on_timeout
	const timeout = api.timeout
	const errors: unknown[] = []

	for (let i = 0; i < domains.length; i++) {
		console.log(`\n---- ${i+1}/${domains.length} ----`)
		const tests = domains[i]

		try {
			for (let e = 0; e < tests.length; e++) {
				const current_test = tests[e]
				console.log("\n" + current_test.name)
				await current_test(api)

				// Reset the settings to expected
				api.retry_on_timeout = retry_on_timeout
				api.timeout = timeout
			}
		} catch(err) {
			console.error(err)
			errors.push(err)

			if (!(err instanceof APIError) && !(err instanceof AssertionError)) {
				console.error("That Error was not an APIError! All Errors need to be APIErrors. Throwing now to stop the tests...")
				throw new Error("Spotted an Error that was not an APIError!")
			}

			if (err instanceof APIError && err.original_error instanceof APIError) {
				console.error("Found an APIError as the `original_error` of another APIError! This behaviour is not desirable. Throwing now to stop the tests...")
				throw new Error("Spotted an APIError as the original_error of another APIError!")
			}
		}
		console.log(`\n---- ${i+1}/${domains.length} ----`)
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
