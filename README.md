# osu-api-v2-js

[**osu-api-v2-js**](https://github.com/TTTaevas/osu-api-v2-js) is a JavaScript & TypeScript package that helps you interact with [osu!api (v2)](https://docs.ppy.sh).

You can find this package's documentation on [osu-v2.taevas.xyz](https://osu-v2.taevas.xyz) if needed!

## How to install and get started

Before installing, if using Node.js, check if you're running version 16 or above:

```bash
node -v # displays your version of node.js
```

Then to install the package, use a command from your package manager:

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
    // It's more convenient to use `osu.API.createAsync()` instead of `new osu.API()` as it doesn't require you to directly provide an access_token!
    // In a proper application, you'd use this function as soon as the app starts so you can use that object everywhere
    // (or if it acts as a user, you'd use this function at the end of the authorization flow)
    const api = await osu.API.createAsync({id: "<client_id>", secret: "<client_secret>"})

    const user = await api.getUser(username) // We need to get the id of the user in order to request what we want
    const score = (await api.getUserScores(user, "best", osu.Ruleset.osu, {lazer: false}, {limit: 1}))[0] // Specifying the Ruleset is optional
    const beatmapDifficulty = await api.getBeatmapDifficultyAttributesOsu(score.beatmap, score.mods) // Specifying the mods so the SR is adapted to them

    const x = `${score.beatmapset.artist} - ${score.beatmapset.title} [${score.beatmap.version}]`
    const y = `+${score.mods.toString()} (${beatmapDifficulty.star_rating.toFixed(2)}*)`
    console.log(`${username}'s top play is on: ${x} ${y}`)
    // Doomsday fanboy's top play is on: Yamajet feat. Hiura Masako - Sunglow [Harmony] +DT (8.72*)
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
Although, you should not need to access them often, because your `api` object has a function to use that refresh token which you can call at any given time, and by default, the object will call that function on its own right before the expiration date or when a request seems to fail because of the `access_token` being invalid! (those are features you can deactivate if needed)

Your `refresh_token` can actually also expire at a (purposefully) unknown time, so depending of how your application works, you could use it at some point around the date of expiration, or you could throw away your `api` object while waiting for a user to start the authorization flow again

### Reading all incoming messages

```typescript
// TypeScript
import * as osu from "osu-api-v2-js"
import promptSync from "prompt-sync"

const prompt = promptSync({sigint: true})

const id = "<client_id>"
const secret = "<client_secret>"
const redirect_uri = "<application_callback_url>"

async function readChat() {
    // Somehow get the code so the application can read the messages as your osu! user
	const url = osu.generateAuthorizationURL(id, redirect_uri, ["public", "chat.read"]) // "chat.read" is 100% needed in our case
	const code = prompt(`Paste the "code" in the URL you're redicted to by accessing: ${url}\n\n`)
	const api = await osu.API.createAsync({id, secret}, {code, redirect_uri}, "errors")

    // Get a WebSocket object to interact with and get messages from
	const socket = api.generateWebSocket()

    // Tell the server you want to know whenever there's are chat messages
	socket.on("open", () => {
		socket.send(osu.WebSocket.Command.chatStart) // osu.WebSocket.Command.chatStart is simply JSON.stringify({event: "chat.start"}) but easier to remember
		api.keepChatAlive()
		setInterval(() => api.keepChatAlive(), 30 * 1000) // Tell the server every 30 seconds that you're still listening to the incoming messages
	})

    // Listen for chat messages (and other stuff)
	socket.on("message", (m: MessageEvent) => { // Mind you, "message" doesn't mean "chat message" here, it's more like a raw event
		const event: osu.WebSocket.Event.Any = JSON.parse(m.toString())
		if (event.event === "chat.message.new") { // Filter out things that aren't new chat messages and get type safety
			const message = event.data.messages.map((message) => message.content).join(" | ")
			const user = event.data.users.map((user) => user.username).join(" | ")
			console.log(`${user}: ${message}`)
		}
	})
}

readChat()
```

Above is the code I've written to listen to incoming chat messages by using the API's WebSocket!

Using the WebSocket namespace this package provides, it's relatively easy to send commands (anything under `osu.WebSocket.Command`) and you can have 100% type safety with events (anything under `osu.Websocket.Event`) simply by checking what the `event` property is! With that, anything in the `data` property is yours to play with!

### Calling the functions, but literally

This package's functions can be accessed both through the api object and through namespaces! It essentially means that for convenience's sake, there are two ways to do anything:

```typescript
// Obtaining a match, assuming an `api` object already exists and everything from the package is imported as `osu`
const match_1 = await api.getMatch(103845156) // through the api object
const match_2 = await osu.Multiplayer.Match.getOne.call(api, 103845156) // through the namespaces
// `match_1` and `match_2` are the same, because they're essentially using the same function!

// The same, but for obtaining multiple lazer updates
const builds_1 = await api.getChangelogBuilds("lazer")
const builds_2 = await osu.Changelog.Build.getMultiple.call(api, "lazer")
// `build_1` and `build_2` are also the same!
```

As you may have noticed, when calling the functions through the namespaces, instead of doing something like `getOne()`, we instead do `getOne.call()` and use [the call() method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call) in order to provide a `this` value; the api object!

Of course, using [the apply() method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply) would also work, so just do things the way you prefer or the way that is more intuitive to you!

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
- [x] `GET /beatmapsets/discussions/posts` -> getBeatmapsetDiscussionPosts()
- [x] `GET /beatmapsets/discussions/votes` -> getBeatmapsetDiscussionVotes()
- [x] `GET /beatmapsets/discussions` -> getBeatmapsetDiscussions()

### Beatmapsets
- [x] `GET /beatmapsets/search` -> searchBeatmapset()
- [x] `GET /beatmapsets/lookup` -> lookupBeatmapset()
- [x] `GET /beatmapsets/{beatmapset}` -> getBeatmapset()
- [x] `GET /beatmapsets/events` -> getBeatmapsetEvents()

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
- [x] `GET /comments` -> getComments()
- [x] `GET /comments/{comment}` -> getComment()

### Events
- [x] `GET /events` -> getEvents()

### Forum
- [x] `POST /forums/topics/{topic}/reply` -> replyForumTopic()
- [x] `POST /forums/topics` -> createForumTopic()
- [x] `GET /forums/topics/{topic}` -> getForumTopicAndPosts() (removing `search` for simplicity)
- [x] `PUT /forums/topics/{topic}` -> editForumTopicTitle()
- [x] `PUT /forums/posts/{post}` -> editForumPost()

### Home
- [x] `GET /search` -> searchUser() / searchWiki()

### Matches
- [x] `GET /matches` -> getMatches()
- [x] `GET /matches/{match}` -> getMatch()

### Multiplayer
- [x] `GET /rooms/{room}/playlist/{playlist}/scores` -> getPlaylistItemScores()
- [x] `GET /rooms` -> getRooms()
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
- [x] `GET /seasonal-backgrounds` -> getSeasonalBackgrounds()
- [x] `GET /scores/{score}/download` -> getReplay()
