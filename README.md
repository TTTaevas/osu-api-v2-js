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
- [x] `GET /beatmaps/packs` -> getBeatmapPacks()
- [x] `GET /beatmaps/packs/{pack}` -> getBeatmapPack()

### Beatmaps
- [x] `GET /beatmaps/lookup` -> lookupBeatmap()
- [x] `GET /beatmaps/{beatmap}/scores/users/{user}` -> getBeatmapUserScore()
- [x] `GET /beatmaps/{beatmap}/scores/users/{user}/all` -> getBeatmapUserScores()
- [x] `GET /beatmaps/{beatmap}/scores` -> getBeatmapScores()
- [x] `GET /beatmaps/{beatmap}/solo-scores` -> getBeatmapSoloScores()
- [x] `GET /beatmaps` -> getBeatmaps()
- [x] `GET /beatmaps/{beatmap}` -> getBeatmap()
- [x] `POST /beatmaps/{beatmap}/attributes` -> getBeatmapDifficultyAttributes()

### Beatmapset Discussions
- [ ] `GET /beatmapsets/discussions/posts`
- [ ] `GET /beatmapsets/discussions/votes`
- [ ] `GET /beatmapsets/discussions`

### Beatmapsets
- [ ] `GET /beatmapsets/search`
- [ ] `GET /beatmapsets/lookup`
- [x] `GET /beatmapsets/{beatmapset}` -> getBeatmapset()
- [ ] `GET /beatmapsets/events`

### Changelog
- [x] `GET /changelog/{stream}/{build}` -> getChangelogBuild()
- [x] `GET /changelog` -> getChangelogBuilds() / getChangelogStreams() (removing `search`, putting `builds` behind getChangelogBuilds(), and `streams` behind getChangelogStreams())
- [x] `GET /changelog/{changelog}` -> lookupChangelogBuild()

### Chat
- [x] `POST /chat/ack` -> keepChatAlive()
- [x] `POST /chat/new` -> sendChatPrivateMessage()
- [x] `GET /chat/channels/{channel}/messages` -> getChatMessages()
- [x] `POST /chat/channels/{channel}/messages` -> sendChatMessage()
- [x] `PUT /chat/channels/{channel}/users/{user}` -> joinChatChannel()
- [x] `DELETE /chat/channels/{channel}/users/{user}` -> leaveChatChannel()
- [x] `PUT /chat/channels/{channel}/mark-as-read/{message}` -> markChatChannelAsRead()
- [x] `GET /chat/channels` -> getChatChannels()
- [x] `POST /chat/channels` -> createChatPrivateChannel() / createChatAnnouncementChannel()
- [x] `GET /chat/channels/{channel}` -> getChatChannel() (without `users` because `channel` would already have this property)

### Comments
- [ ] `GET /comments`
- [ ] `GET /comments/{comment}`

### Events
- [ ] `GET /events`

### Forum
- [x] `POST /forums/topics/{topic}/reply` -> replyForumTopic()
- [x] `POST /forums/topics` -> createForumTopic()
- [x] `GET /forums/topics/{topic}` -> getForumTopicAndPosts() (removing `search` for simplicity)
- [x] `PUT /forums/topics/{topic}` -> editForumTopicTitle()
- [x] `PUT /forums/posts/{post}` -> editForumPost()

### Home
- [x] `GET /search` -> searchUser() / searchWiki()

### Multiplayer
- [x] `GET /rooms/{room}/playlist/{playlist}/scores` -> getPlaylistItemScores()
- [x] `GET /rooms` -> getRooms()
- [x] `GET /matches` -> getMatches()
- [x] `GET /matches/{match}` -> getMatch()
- [x] `GET /rooms/{room}` -> getRoom()
- [x] `GET /rooms/{room}/leaderboard` -> getRoomLeaderboard()

### News
- [x] `GET /news` -> getNewsPosts() (removing everything except `news_sidebar.news_posts`)
- [x] `GET /news/{news}` -> getNewsPost()

### Ranking
- [x] `GET /rankings/kudosu` -> getKudosuRanking()
- [x] `GET /rankings/{mode}/{type}` -> getUserRanking() / getCountryRanking() / getSpotlightRanking()
- [x] `GET /spotlights` -> getSpotlights()

### Users
- [x] `GET /me/{mode?}` -> getResourceOwner()
- [x] `GET /users/{user}/kudosu` -> getUserKudosu()
- [x] `GET /users/{user}/scores/{type}` -> getUserScores()
- [x] `GET /users/{user}/beatmapsets/{type}` -> getUserBeatmaps() / getUserMostPlayed()
- [x] `GET /users/{user}/recent_activity` -> getUserRecentActivity()
- [x] `GET /users/{user}/{mode?}` -> getUser()
- [x] `GET /users` -> getUsers()
- [x] `GET /friends` -> getFriends()

### Wiki
- [x] `GET /wiki/{locale}/{path}` -> getWikiPage()

### Misc Undocumented Stuff
- [ ] `GET /seasonal-backgrounds`
- [x] `GET /scores/{score}/download` -> getReplay()
- [ ] `GET /scores/{rulesetOrScore}/{score}/download`
- [ ] `GET /scores/{rulesetOrScore}/{score?}`
