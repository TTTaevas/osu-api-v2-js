/**
 * The Authorization Code way
 * The token is considered by the API as myself
 */

import "dotenv/config"
import promptSync from "prompt-sync"
import { exec } from "child_process"
import util from "util"
import * as osu from "../index.js"

const prompt = promptSync({sigint: true})

async function test(id: string | undefined, secret: string | undefined, redirect_uri: string | undefined) {
	if (id === undefined) {throw new Error("no ID env var")}
	if (secret === undefined) {throw new Error("no SECRET env var")}
	if (redirect_uri === undefined) {throw new Error("no REDIRECT_URI env var")}

	let url = osu.generateAuthorizationURL(Number(id), redirect_uri, ["public"])
	exec(`xdg-open "${url}"`)
	let code = prompt(`What code do you get from: ${url}\n\n`)

	let api = await osu.API.createAsync({id: Number(id), secret}, {code, redirect_uri}, "all")
	if (api) {
		let d1 = await api.getRanking(osu.Rulesets.osu, "performance", 1, "friends")
		if (d1) {
			d1.ranking = [d1.ranking[0]]
			console.log(d1)
		}
	}
}

test(process.env.ID, process.env.SECRET, process.env.REDIRECT_URI)
