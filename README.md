# osu-api-v2-js

[**osu-api-v2-js**](https://github.com/TTTaevas/osu-api-v2-js) is a JavaScript & TypeScript package that helps you interact with [osu!api (v2)](https://docs.ppy.sh).

You can find this package's documentation on [osu-v2.taevas.xyz](https://osu-v2.taevas.xyz) if needed!

## How to install and get started

Before installing, if using Node.js, check if you're running version 18 or above:

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
    const api = await osu.API.createAsync("<client_id>", "<client_secret>") // with id as a number

    const user = await api.getUser(username) // We need to get the id of the user in order to request what we want
    const score = (await api.getUserScores(user, "best", osu.Ruleset.osu, {lazer: false}, {limit: 1}))[0] // Specifying the Ruleset is optional
    const beatmapDifficulty = await api.getBeatmapDifficultyAttributesOsu(score.beatmap, score.mods) // Specifying the mods so the SR is adapted to them

    const x = `${score.beatmapset.artist} - ${score.beatmapset.title} [${score.beatmap.version}]`
    const y = `+${score.mods.map((m) => m.acronym).toString()} (${beatmapDifficulty.star_rating.toFixed(2)}*)`
    console.log(`${username}'s top play is on: ${x} ${y}`)
    // Doomsday fanboy's top play is on: Erio o Kamattechan - os-Uchuujin(Asterisk Makina Remix) [Mattress Actress] +DT,CL (8.85*)
}

logUserTopPlayBeatmap("Doomsday fanboy")
```

### Authorization flow
A simple guide on how to do extra fancy stuff

#### The part where the user says they're okay with using your application

If your application is meant to act on behalf of a user after they've clicked on a button to say they consent to your application identifying them and reading public data on their behalf and some other stuff maybe, then things will work differently

Let's take it step by step! First, this package comes with [`generateAuthorizationURL()`](https://osu-v2.taevas.xyz/functions/generateAuthorizationURL.html), which will generate for you a link so users can click on it and allow your application to do stuff on their behalf

This function requires you to specify [scopes](https://osu-v2.taevas.xyz/types/Scope.html)... well, just know that **`identify` is always implicitly specified**, that **`public` is almost always implicitly required**, and that **functions that require other scopes are explicit about it!**

Please note: It is the user who ultimately decides which scopes they allow, so you can't assume they allowed all the scopes you specified...
Thankfully though, you can check at any time the allowed scopes with the `scopes` property of your `api` object!

#### The part where your application hears the user when the user says okay

The user clicked your link and authorized your application! ...Now what?

When a user authorizes your application, they get redirected to your `Application Callback URL` with a *huge* code as a GET parameter (the name of the parameter is `code`), and it is this very code that will allow you to proceed with the authorization flow! So make sure that somehow, you retrieve this code!

With this code, thanks to the [`createAsync()`](https://osu-v2.taevas.xyz/classes/API.html#createasync) method, you're able to create your [`api`](https://osu-v2.taevas.xyz/classes/API.html) object:
```typescript
const api = await osu.API.createAsync("<client_id>", "<client_secret>", {code: "<code>", redirect_uri: "<application_callback_url>"})
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
import * as http from "http"
import { exec } from "child_process"

// This should be from an application registered on https://osu.ppy.sh/home/account/edit#oauth
const id = "<client_id>" // as a number
const secret = "<client_secret>"
const redirect_uri = "<application_callback_url>" // assuming localhost with any port for convenience

// Because we need to act as an authenticated user, we need to go through the authorization procedure
// This function largely takes care of it by itself
async function getCode(authorization_url: string): Promise<string> {
	// Open a temporary server to receive the code when the browser is sent to the redirect_uri after confirming authorization
	const httpserver = http.createServer()
	const host = redirect_uri.substring(redirect_uri.indexOf("/") + 2, redirect_uri.lastIndexOf(":"))
	const port = Number(redirect_uri.substring(redirect_uri.lastIndexOf(":") + 1).split("/")[0])
	httpserver.listen({host, port})

	// Open the browser to the page on osu!web where you click a button to say you authorize your application
	console.log("Waiting for code...")
	const command = (process.platform == "darwin" ? "open" : process.platform == "win32" ? "start" : "xdg-open")
	exec(`${command} "${authorization_url}"`)

	// Check the URL for a `code` GET parameter, get it if it's there
	const code: string = await new Promise((resolve) => {
		httpserver.on("request", (request, response) => {
			if (request.url) {
				console.log("Received code!")
				response.end("Worked! You may now close this tab.", "utf-8")
				httpserver.close() // Close the temporary server as it is no longer needed
				resolve(request.url.substring(request.url.indexOf("code=") + 5))
			}
		})
	})
	return code
}

async function readChat() {
    // Somehow get the code so the application can read the messages as your osu! user
	const url = osu.generateAuthorizationURL(id, redirect_uri, ["public", "chat.read"]) // "chat.read" is 100% needed in our case
	const code = await getCode(url)
	const api = await osu.API.createAsync(id, secret, {code, redirect_uri}, {verbose: "errors"})

    // Get a WebSocket object to interact with and get messages from
	const socket = api.generateWebSocket()

    // Tell the server you want to know whenever there's are chat messages
	socket.on("open", () => {
		socket.send(osu.WebSocket.Command.chatStart) // osu.WebSocket.Command.chatStart is simply JSON.stringify({event: "chat.start"}) but easier to remember
		api.keepChatAlive()
		setInterval(() => api.keepChatAlive(), 30 * 1000) // Tell the server every 30 seconds that you're still listening to the incoming messages
	})

    // Listen for chat messages (and other stuff)
	socket.on("message", (m) => { // Mind you, "message" doesn't mean "chat message" here, it's more like a raw event
		const parsed: osu.WebSocket.Event.Any = JSON.parse(m.toString())

		if (!parsed.event) { // Should only mean we've gotten an error message
			throw new Error((parsed as osu.WebSocket.Event.Error).error) // Assertion in case of false positive TS2339 error at build time
		} else if (parsed.event === "chat.message.new") { // Filter out things that aren't new chat messages and get type safety
			const message = parsed.data.messages.map((message) => message.content).join(" | ")
			const user = parsed.data.users.map((user) => user.username).join(" | ")
			console.log(`${user}: ${message}`)
		}
	})
}

readChat()
```

Above is the code I've written to listen to incoming chat messages by using the API's WebSocket!

Using the WebSocket namespace this package provides, it's relatively easy to send commands (anything under [`osu.WebSocket.Command`](https://osu-v2.taevas.xyz/modules/WebSocket.Command.html)) and you can have 100% type safety with events (anything under [`osu.Websocket.Event`](https://osu-v2.taevas.xyz/modules/WebSocket.Event.html)) simply by checking what the `event` property is! With that, anything in the `data` property is yours to play with!

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

## List of implemented endpoints

In the same order as on the API's official documentation:

### Beatmap Packs
- `GET /beatmaps/packs` -> [getBeatmapPacks()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmappacks)
- `GET /beatmaps/packs/{pack}` -> [getBeatmapPack()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmappack)

### Beatmaps
- `GET /beatmaps/lookup` -> [lookupBeatmap()](https://osu-v2.taevas.xyz/classes/API.html#lookupbeatmap)
- `GET /beatmaps/{beatmap}/scores/users/{user}` -> [getBeatmapUserScore()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmapuserscore)
- `GET /beatmaps/{beatmap}/scores/users/{user}/all` -> [getBeatmapUserScores()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmapuserscores)
- `GET /beatmaps/{beatmap}/scores` -> [getBeatmapScores()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmapscores)
- `GET /beatmaps/{beatmap}/solo-scores` -> [getBeatmapSoloScores()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmapsoloscores)
- `GET /beatmaps` -> [getBeatmaps()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmaps)
- `GET /beatmaps/{beatmap}` -> [getBeatmap()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmap)
- `POST /beatmaps/{beatmap}/attributes` -> [getBeatmapDifficultyAttributes()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmapdifficultyattributes)

### Beatmapset Discussions
- `GET /beatmapsets/discussions/posts` -> [getBeatmapsetDiscussionPosts()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmapsetdiscussionposts)
- `GET /beatmapsets/discussions/votes` -> [getBeatmapsetDiscussionVotes()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmapsetdiscussionvotes)
- `GET /beatmapsets/discussions` -> [getBeatmapsetDiscussions()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmapsetdiscussions)

### Beatmapsets
- `GET /beatmapsets/search` -> [searchBeatmapset()](https://osu-v2.taevas.xyz/classes/API.html#searchbeatmapsets)
- `GET /beatmapsets/lookup` -> [lookupBeatmapset()](https://osu-v2.taevas.xyz/classes/API.html#lookupbeatmapset)
- `GET /beatmapsets/{beatmapset}` -> [getBeatmapset()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmapset)
- `GET /beatmapsets/events` -> [getBeatmapsetEvents()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmapsetevents)

### Changelog
- `GET /changelog/{stream}/{build}` -> [getChangelogBuild()](https://osu-v2.taevas.xyz/classes/API.html#getchangelogbuild)
- `GET /changelog` -> [getChangelogBuilds()](https://osu-v2.taevas.xyz/classes/API.html#getchangelogbuilds) and [getChangelogStreams()](https://osu-v2.taevas.xyz/classes/API.html#getchangelogstreams) (removing `search`, putting `builds` behind getChangelogBuilds(), and `streams` behind getChangelogStreams())
- `GET /changelog/{changelog}` -> [lookupChangelogBuild()](https://osu-v2.taevas.xyz/classes/API.html#lookupchangelogbuild)

### Chat
- `POST /chat/ack` -> [keepChatAlive()](https://osu-v2.taevas.xyz/classes/API.html#keepchatalive)
- `POST /chat/new` -> [sendChatPrivateMessage()](https://osu-v2.taevas.xyz/classes/API.html#sendchatprivatemessage)
- `GET /chat/channels/{channel}/messages` -> [getChatMessages()](https://osu-v2.taevas.xyz/classes/API.html#getchatmessages)
- `POST /chat/channels/{channel}/messages` -> [sendChatMessage()](https://osu-v2.taevas.xyz/classes/API.html#sendchatmessage)
- `PUT /chat/channels/{channel}/users/{user}` -> [joinChatChannel()](https://osu-v2.taevas.xyz/classes/API.html#joinchatchannel)
- `DELETE /chat/channels/{channel}/users/{user}` -> [leaveChatChannel()](https://osu-v2.taevas.xyz/classes/API.html#leavechatchannel)
- `PUT /chat/channels/{channel}/mark-as-read/{message}` -> [markChatChannelAsRead()](https://osu-v2.taevas.xyz/classes/API.html#markchatchannelasread)
- `GET /chat/channels` -> [getChatChannels()](https://osu-v2.taevas.xyz/classes/API.html#getchatchannels)
- `POST /chat/channels` -> [createChatPrivateChannel()](https://osu-v2.taevas.xyz/classes/API.html#createchatprivatechannel) and [createChatAnnouncementChannel()](https://osu-v2.taevas.xyz/classes/API.html#createchatannouncementchannel)
- `GET /chat/channels/{channel}` -> [getChatChannel()](https://osu-v2.taevas.xyz/classes/API.html#getchatchannel) (without `users` because `channel` would already have this property)

### Comments
- `GET /comments` -> [getComments()](https://osu-v2.taevas.xyz/classes/API.html#getcomments)
- `GET /comments/{comment}` -> [getComment()](https://osu-v2.taevas.xyz/classes/API.html#getcomment)
- While other relevant endpoints exist, they are only officially supported through the osu! client (lazer)

### Events
- `GET /events` -> [getEvents()](https://osu-v2.taevas.xyz/classes/API.html#getevents)

### Forum
- `POST /forums/topics/{topic}/reply` -> [replyForumTopic()](https://osu-v2.taevas.xyz/classes/API.html#replyforumtopic)
- `GET /forums/topics` -> [getForumTopics()](https://osu-v2.taevas.xyz/classes/API.html#getforumtopics)
- `POST /forums/topics` -> [createForumTopic()](https://osu-v2.taevas.xyz/classes/API.html#createforumtopic)
- `GET /forums/topics/{topic}` -> [getForumTopicAndPosts()](https://osu-v2.taevas.xyz/classes/API.html#getforumtopicandposts) (removing `search` for simplicity)
- `PUT /forums/topics/{topic}` -> [editForumTopicTitle()](https://osu-v2.taevas.xyz/classes/API.html#editforumtopictitle)
- `PUT /forums/posts/{post}` -> [editForumPost()](https://osu-v2.taevas.xyz/classes/API.html#editforumpost)
- `GET /forums` -> [getForums()](https://osu-v2.taevas.xyz/classes/API.html#getforums)
- `GET /forums/{forum}` -> [getForum()](https://osu-v2.taevas.xyz/classes/API.html#getforum)

### Home
- `GET /search` -> [searchUser()](https://osu-v2.taevas.xyz/classes/API.html#searchuser) and [searchWiki()](https://osu-v2.taevas.xyz/classes/API.html#searchwiki)

### Matches
- `GET /matches` -> [getMatches()](https://osu-v2.taevas.xyz/classes/API.html#getmatches)
- `GET /matches/{match}` -> [getMatch()](https://osu-v2.taevas.xyz/classes/API.html#getmatch)

### Multiplayer
- `GET /rooms/{room}/playlist/{playlist}/scores` -> [getPlaylistItemScores()](https://osu-v2.taevas.xyz/classes/API.html#getplaylistitemscores)
- `GET /rooms` -> [getRooms()](https://osu-v2.taevas.xyz/classes/API.html#getrooms)
- `GET /rooms/{room}` -> [getRoom()](https://osu-v2.taevas.xyz/classes/API.html#getroom)
- `GET /rooms/{room}/leaderboard` -> [getRoomLeaderboard()](https://osu-v2.taevas.xyz/classes/API.html#getroomleaderboard)
- While other relevant endpoints exist, they are only officially supported through the osu! client (lazer)

### News
- `GET /news` -> [getNewsPosts()](https://osu-v2.taevas.xyz/classes/API.html#getnewsposts) (removing everything except `news_sidebar.news_posts`)
- `GET /news/{news}` -> [getNewsPost()](https://osu-v2.taevas.xyz/classes/API.html#getnewspost)

### Ranking
- `GET /rankings/kudosu` -> [getKudosuRanking()](https://osu-v2.taevas.xyz/classes/API.html#getkudosuranking)
- `GET /rankings/{mode}/{type}` -> [getUserRanking()](https://osu-v2.taevas.xyz/classes/API.html#getuserranking) and [getCountryRanking()](https://osu-v2.taevas.xyz/classes/API.html#getcountryranking) and [getSpotlightRanking()](https://osu-v2.taevas.xyz/classes/API.html#getspotlightranking)
- `GET /spotlights` -> [getSpotlights()](https://osu-v2.taevas.xyz/classes/API.html#getspotlights)

### Users
- `GET /me/{mode?}` -> [getResourceOwner()](https://osu-v2.taevas.xyz/classes/API.html#getresourceowner)
- `GET /users/{user}/kudosu` -> [getUserKudosu()](https://osu-v2.taevas.xyz/classes/API.html#getuserkudosu)
- `GET /users/{user}/scores/{type}` -> [getUserScores()](https://osu-v2.taevas.xyz/classes/API.html#getuserscores)
- `GET /users/{user}/beatmapsets/{type}` -> [getUserBeatmaps()](https://osu-v2.taevas.xyz/classes/API.html#getuserbeatmaps) and [getUserMostPlayed()](https://osu-v2.taevas.xyz/classes/API.html#getusermostplayed)
- `GET /users/{user}/recent_activity` -> [getUserRecentActivity()](https://osu-v2.taevas.xyz/classes/API.html#getuserrecentactivity)
- `GET /users/{user}/{mode?}` -> [getUser()](https://osu-v2.taevas.xyz/classes/API.html#getuser)
- `GET /users` -> [getUsers()](https://osu-v2.taevas.xyz/classes/API.html#getusers)
- `GET /friends` -> [getFriends()](https://osu-v2.taevas.xyz/classes/API.html#getfriends)

### Wiki
- `GET /wiki/{locale}/{path}` -> [getWikiPage()](https://osu-v2.taevas.xyz/classes/API.html#getwikipage)

### Misc Undocumented Stuff
- `GET /seasonal-backgrounds` -> [getSeasonalBackgrounds()](https://osu-v2.taevas.xyz/classes/API.html#getseasonalbackgrounds)
- `GET /scores/{score}/download` -> [getReplay()](https://osu-v2.taevas.xyz/classes/API.html#getreplay)
- `GET /tags` -> [getBeatmapUserTags()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmapusertags)
