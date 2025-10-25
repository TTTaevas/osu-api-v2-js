// This file hosts important functions that are too big or unreadable to belong in another file

/**
 * When using `fetch()` for a GET request, you can't just give the parameters the same way you'd give them for a POST request!
 * @param parameters The parameters as they'd be for a POST request (prior to using `JSON.stringify`)
 * @returns Parameters adapted for a GET request
 */
export function adaptParametersForGETRequests(parameters: {[k: string]: any}): {[k: string]: any} {
	// If a parameter is an empty string or is undefined, remove it
	Object.entries(parameters).forEach(([key, value]) => {
		if (!String(value).length || value === undefined) {
			delete parameters[key]
		}
	})

	// If a parameter is an Array, add "[]" to its name, so the server understands the request properly
	Object.entries(parameters).forEach(([key, value]) => {
		if (Array.isArray(value) && !key.includes("[]")) {
			parameters[`${key}[]`] = value
			delete parameters[key]
		}
	})

	// If a parameter is an object, add its properties in "[]" such as "cursor[id]=5&cursor[score]=36.234"
	const parameters_to_add: {[k: string]: any} = {}
	Object.entries(parameters).forEach(([key, value]) => {
		if (typeof value === "object" && !Array.isArray(value) && value !== null) { 
			Object.entries(value).forEach(([key2, value2]) => {
				parameters_to_add[`${key}[${key2}]`] = value2
			})
			delete parameters[key]
		}
	})
	Object.entries(parameters_to_add).forEach(([key, value]) => {
		parameters[key] = value
	})

	// If a parameter is a date, make it a string
	Object.entries(parameters).forEach(([key, value]) => {
		if (value instanceof Date) {
			parameters[key] = value.toISOString()
		}
	})

	return parameters
}

/**
 * Some stuff doesn't have the right type to begin with, such as dates, which are being returned as strings, this fixes that
 * @param x Anything, but should be a string, an array that contains a string, or an object which has a string
 * @param force_string Should `x` be as much as a string as it can? (defaults to false)
 * @returns x, but with it (or what it contains) now having the correct type
 */
export function correctType(x: any, force_string?: boolean): any {
	// Apply this very function to all elements of the array, with `force_string` on if previously turned on
	if (Array.isArray(x)) {
		return x.map((e) => correctType(e, force_string))
	}

	// Objects have depth, we need to run this very function on all of their values
	if (typeof x === "object" && x !== null) {
		const keys = Object.keys(x)
		const vals = Object.values(x)

		// If a key is any of those, the value is expected to be a string, so we use `force_string` to make correctType convert them to string for us
		const unconvertables: string[] = [
			"artist", "artist_unicode", "title", "title_unicode", "tags", "location", "interests", "occupation", "twitter", "discord", "category",
			"beatmap_version", "version", "display_version", "author", "raw", "bbcode", "message", "creator", "source",
		]
		const unconvertables_substrings: string[] = ["string", "name"] // or if the key contains any of those substrings
		for (let i = 0; i < keys.length; i++) {
			x[keys[i]] = correctType(vals[i], unconvertables.some((p) => keys[i] === p) || unconvertables_substrings.some((s) => keys[i].toLowerCase().includes(s)))
		}

		return x
	}

	// If `force_string` is on and is applicable, convert to a string (even if already string)
	if (force_string && typeof x !== "object") {
		return String(x)
	}

	// Responses by the API have their dates as strings in different formats, convert those strings to Date objects
	if (/^[+-[0-9][0-9]+-[0-9]{2}-[0-9]{2}($|[ T].*)/.test(x)) {
		// Before converting, force all dates into UTC+0 (to avoid differences depending of which timezone you run `new Date()` in)
		if (/[0-9]{2}:[0-9]{2}:[0-9]{2}$/.test(x)) x += "Z"
		if (/[0-9]{2}:[0-9]{2}:[0-9]{2}\+[0-9]{2}:[0-9]{2}$/.test(x)) x = x.substring(0, x.indexOf("+")) + "Z"
		return new Date(x)
	}

	// If the string can be converted to a number and isn't `force_string`ed, convert it (namely because of user cover id and few others)
	if (!isNaN(x) && x !== "" && x !== null && typeof x !== "boolean") {
		return Number(x)
	}

	return x
}
