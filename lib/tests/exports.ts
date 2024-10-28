export type AR<T extends (...args: any) => any> = Awaited<ReturnType<T>>;

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
