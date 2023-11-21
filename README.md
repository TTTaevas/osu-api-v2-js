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

## Implemented endpoints

### Beatmap Packs
- [x] Get Beatmap Packs
- [x] Get Beatmap Pack

### Beatmaps
- [ ] Lookup Beatmap // won't implement because Get Beatmap exists
- [x] Get a User Beatmap score
- [x] Get a User Beatmap scores
- [x] Get Beamtap scores
- [ ] Get Beamtap scores (temp) // won't implement because this endpoint will disappear
- [x] Get Beatmaps
- [x] Get Beatmap
- [x] Get Beatmap Attributes

### Beatmapset Discussions
- [ ] Get Beatmapset Discussion Posts // low priority because "The response of this endpoint is likely to change soon!"
- [ ] Get Beatmapset Discussion Votes // low priority because "The response of this endpoint is likely to change soon!"
- [ ] Get Beatmapset Discussions // low priority because "The response of this endpoint is likely to change soon!"

### Beatmapsets
- [ ] /beatmapsets/search // low priority because no documentation
- [ ] /beatmapsets/lookup // low priority because no documentation (and won't implement if it's like Lookup Beatmap)
- [x] /beatmapsets/{beatmapset}
- [ ] /beatmapsets/events // low priority because no documentation (it's literally in Undocumented)

### Changelog
- [x] Get Changelog Build
- [x] Get Changelog Listing // removing `search`, putting `builds` behind getChangelogBuilds(), and `streams` behind getChangelogStreams()
- [ ] Lookup Changelog Build // likely won't implement unless I get convinced it's worth the confusion with Get Changelog Build

### Chat
- [ ] Chat Keepalive
- [ ] Create New PM
- [ ] Get Channel Messages
- [ ] Send Message to Channel
- [ ] Join Channel
- [ ] Leave Channel
- [ ] Mark Channel as Read
- [ ] Get Channel List
- [ ] Create Channel
- [ ] Get Channel

### Comments
- [ ] Get Comments
- [ ] Get a Comment

### Events
- [ ] Get Events

### Forum
- [ ] Reply Topic
- [ ] Create Topic
- [ ] Get Topic and Posts
- [ ] Edit Topic
- [ ] Edit Post

### Home
- [x] Search // split between searchUser() and searchWiki()

### Multiplayer
- [x] Get Scores
- [x] Get Multiplayer Rooms
- [x] /matches
- [x] /matches/{match}
- [x] /rooms/{room}
- [x] /rooms/{room}/leaderboard

### News
- [ ] Get News Listing
- [ ] Get News Post

### Ranking
- [x] Get Kudosu Ranking
- [x] Get Ranking
- [x] Get Spotlights

### Users
- [x] Get Own Data
- [x] Get User Kudosu
- [x] Get User Scores
- [ ] Get User Beatmaps
- [ ] Get User Recent Activity
- [x] Get User
- [x] Get Users
- [x] /friends

### Wiki
- [ ] Get Wiki Page

### Misc Undocumented Stuff
- [ ] /seasonal-backgrounds
- [ ] /scores/{score}/download
- [ ] /scores/{rulesetOrScore}/{score}/download
- [ ] /scores/{rulesetOrScore}/{score?}
