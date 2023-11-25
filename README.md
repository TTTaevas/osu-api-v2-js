# osu-api-v2-js

[**osu-api-v2-js**](https://github.com/TTTaevas/osu-api-v2-js) is a JavaScript & TypeScript package that helps you interact with [osu!api (v2)](https://docs.ppy.sh).

It is currently a bit unstable as it's under development, but you can find documentation on [osu-v2.taevas.xyz](https://osu-v2.taevas.xyz) if needed!

## How to install and get started

To install the package, use a command from your package manager:

```bash
npm i osu-api-v2-js # if using npm
yarn add osu-api-v2-js # if using yarn
pnpm add osu-api-v2-js # if using pnpm
bun a osu-api-v2-js # if using bun
```

You will want to create your own OAuth application: https://osu.ppy.sh/home/account/edit#oauth
To use (import) the package in your project and start interacting with the API, you may do something like that:

```typescript
// TypeScript
import * as osu from "osu-api-v2-js"

async function logUserTopPlayBeatmap(username: string) {
    // Because of how the API server works, it's more convenient to use `osu.API.createAsync()` instead of `new osu.API()`!
    // In a proper application, you'd use this function as soon as the app starts so you can use that object everywhere
    // (or if it acts as a user, you'd use this function at the end of the authorization flow)
    const api = await osu.API.createAsync({id: "<client_id>", secret: "<client_secret>"})

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

### Authorization flow
A simple guide on how to do extra fancy stuff

#### The part where the user says they're okay with using your application

If your application is meant to act on behalf of a user after they've clicked on a button to say they consent to your application identifying them and reading public data on their behalf and some other stuff maybe, then things will work differently

Let's take it step by step! First, this package comes with `generateAuthorizationURL()`, which will generate for you a link so users can click on it and allow your application to do stuff on their behalf
This function requires you to specify scopes... well, just know that **`identify` is always implicitly specified**, that **`public` is almost always implicitly required**, and that **functions that require other scopes are explicit about it!**

Please note: It is the user who ultimately decides which scopes they allow, so you can't assume they allowed all the scopes you specified...
Thankfully though, you can check at any time the allowed scopes with the `scopes` property of your `api` object!

#### The part where your application hears the user when the user says okay

The user clicked your link and authorized your application! ...Now what?

When a user authorizes your application, they get redirected to your `Application Callback URL` with a *huge* code as a GET parameter (the name of the parameter is `code`), and it is this very code that will allow you to proceed with the authorization flow! So make sure that somehow, you retrieve this code!

With this code, you're able to create your `api` object:
```typescript
const api = await osu.API.createAsync({id: "<client_id>", secret: "<client_secret>"}, {code: "<code>", redirect_uri: "<application_callback_url>"})
```

#### The part where you make it so your application works without the user saying okay every 2 minutes

Congrats on making your `api` object! Now you should do something in order to not lose it, or not need a new one in order to request more data!

Do note that your `api` object has lots of practical properties: `user` allows you to know which user it acts on behalf of, `expires` allows you to know when your requests with your current `access_token` will fail, and `refresh_token` is your key to getting a new `access_token` without asking the user again!
Although, you should not need to access them often, because your `api` object has a function to use that refresh token which you can call at any given time, and it **will** call it itself if, upon requesting something, it notices the date the `access_token` `expires` is in the past!

Your `refresh_token` can actually also expire at a (purposefully) unknown time, so depending of how your application works, you could use it at some point around the date of expiration, or you could throw away your `api` object while waiting for a user to start the authorization flow again

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
- [x] Get Channel Messages
- [x] Send Message to Channel
- [x] Join Channel
- [x] Leave Channel
- [ ] Mark Channel as Read
- [x] Get Channel List
- [ ] Create Channel
- [x] Get Channel

### Comments
- [ ] Get Comments
- [ ] Get a Comment

### Events
- [ ] Get Events

### Forum
- [x] Reply Topic
- [x] Create Topic
- [x] Get Topic and Posts // removing `search` for simplicity
- [x] Edit Topic
- [x] Edit Post

### Home
- [x] Search // split between searchUser() and searchWiki()

### Multiplayer
- [x] Get Scores
- [x] Get Multiplayer Rooms
- [x] /matches
- [x] /matches/{match}
- [x] /rooms/{room}
- [x] /rooms/{room}/leaderboard

### News
- [x] Get News Listing // removing everything except `news_sidebar.news_posts`
- [x] Get News Post

### Ranking
- [x] Get Kudosu Ranking
- [x] Get Ranking
- [x] Get Spotlights

### Users
- [x] Get Own Data
- [x] Get User Kudosu
- [x] Get User Scores
- [x] Get User Beatmaps // split between getUserBeatmaps() and getUserMostPlayed()
- [x] Get User Recent Activity
- [x] Get User
- [x] Get Users
- [x] /friends

### Wiki
- [x] Get Wiki Page

### Misc Undocumented Stuff
- [ ] /seasonal-backgrounds
- [ ] /scores/{score}/download
- [ ] /scores/{rulesetOrScore}/{score}/download
- [ ] /scores/{rulesetOrScore}/{score?}
