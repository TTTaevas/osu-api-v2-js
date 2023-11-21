# osu-api-v2-js

[**osu-api-v2-js**](https://github.com/TTTaevas/osu-api-v2-js) is a JavaScript & TypeScript package that helps you interact with [osu!api (v2)](https://docs.ppy.sh).

It is currently unstable as it's under development, but you can find documentation on [osu-v2.taevas.xyz](https://osu-v2.taevas.xyz/) if needed!

## How to install and get started

To install the package, use a command from your package manager:

```bash
npm i osu-api-v2-js # if using npm
yarn add osu-api-v2-js # if using yarn
pnpm add osu-api-v2-js # if using pnpm
bun a osu-api-v2-js # if using bun
```

Make sure to add `"type": "module"` to your `package.json`!

To use (import) the package in your project and start interacting with the API, you may do something like that:

```typescript
// TypeScript
import * as osu from "osu-api-v2-js"

async function logUserTopPlayBeatmap(username: string) {
    // Because of how the API server works, it's more convenient to use `osu.API.createAsync()` instead of `new osu.API()`!
    // In a proper application, you'd use this function as soon as the app starts so you can use that object everywhere
	const api = await osu.API.createAsync({id: "<client_id>", "<client_secret>"})

    const user = await api.getUser({username}) // We need to get the id of the user in order to request what we want
    const score = (await api.getUserScores(user, "best", 1, osu.Rulesets.osu))[0] // Specifying the Ruleset is optional
    const beatmapDifficulty = await api.getBeatmapDifficultyAttributesOsu(score.beatmap, score.mods) // Specifying the mods so the SR is adapted to them

    let x = `${score.beatmapset.artist} - ${score.beatmapset.title} [${score.beatmap.version}]`
	let y = `+${score.mods.toString()} (${beatmapDifficulty.star_rating.toFixed(2)}*)`
	console.log(`${username}'s top play is on: ${x} ${y}`)
	// Doomsday fanboy's top play is on: xi - FREEDOM DiVE [FOUR DIMENSIONS] +HR (8.07*)
}

logUserTopPlayBeatmap("Doomsday fanboy")
```
