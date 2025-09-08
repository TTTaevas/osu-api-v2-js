# osu-api-v2-js

[![Node.js Test CI](https://github.com/TTTaevas/osu-api-v2-js/actions/workflows/test.yml/badge.svg)](https://github.com/TTTaevas/osu-api-v2-js/actions/workflows/test.yml)
[![Chat on Matrix](https://matrix.to/img/matrix-badge.svg)](https://matrix.to/#/!UDoTSsVxLnywpVCGmE:matrix.org)
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V4J78L0)

[**osu-api-v2-js**](https://github.com/TTTaevas/osu-api-v2-js) is a JavaScript & TypeScript package that helps you interact with [osu!api (v2)](https://docs.ppy.sh).

The documentation for the latest version of this package can be found at any time on [osu-v2.taevas.xyz](https://osu-v2.taevas.xyz)!

## How to install and get started

Before installing, if using Node.js, check if you're running version 20 or above:

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
    // You may wish to make it so you can use your `api` object multiple times instead of creating multiple `api` objects
    const api = await osu.API.createAsync("<client_id>", "<client_secret>") // id as a number, secret as a string

    const user = await api.getUser(username) // We need to get the id of the user in order to request what we want
    const scores = await api.getUserScores(user, "best", osu.Ruleset.osu, {lazer: false}, {limit: 1}) // Specifying the Ruleset is optional
    const score = scores[0] // Array is already sorted
    const beatmapDifficulty = await api.getBeatmapDifficultyAttributesOsu(score.beatmap, score.mods) // Specify the mods to get the appropriate SR

    const x = `${score.beatmapset.artist} - ${score.beatmapset.title} [${score.beatmap.version}]`
    const y = `+${score.mods.map((m) => m.acronym).toString()} (${beatmapDifficulty.star_rating.toFixed(2)}*)`
    console.log(`${username}'s top play is on: ${x} ${y}`)
    // Doomsday fanboy's top play is on: Erio o Kamattechan - os-Uchuujin(Asterisk Makina Remix) [Mattress Actress] +DT,CL (8.87*)
}

logUserTopPlayBeatmap("Doomsday fanboy")
```

### Authorization flow
A simple guide on how to do extra fancy stuff

#### Create and share the authorization link with your users

If your application is meant to act on behalf of a user after they've clicked on a button to say they **"consent to your application identifying them and reading public data on their behalf and some other stuff maybe"**, then you will need to take a slightly different approach to create your `api` object.

Let's take it step by step! First, this package comes with [`generateAuthorizationURL()`](https://osu-v2.taevas.xyz/functions/generateAuthorizationURL.html), which will create a link for you that you can share so users can click on it and allow your application to do stuff on their behalf.

This function requires you to specify [scopes](https://osu-v2.taevas.xyz/types/Scope.html). Here are some useful things to know about scopes:
- `identify` is always **implicitly SPECIFIED**, so you should always use it
- `public` is always **implicitely REQUIRED**, so you should (basically) always use it
- when a method requires another scope, it will be **explicit** about it in its documentation
- ultimately, **the user is the one who decides which scopes they allow**, so code assuming they may have allowed no scope at all
- scopes that have been allowed **can be checked at any time** through [the `scopes` property of your `api` object](https://osu-v2.taevas.xyz/classes/API.html#scopes)

The TLDR of scopes: Use `identify` and `public`, add other scopes on top of that when necessary!

#### Have a server ready to receive the authorization

The user clicked your link and authorized your application! ...Now what?

When a user authorizes your application, they get redirected to your `Application Callback URL` with a *huge* code as a GET parameter (the name of the parameter is `code`), and it is this very code that will allow you to proceed with the authorization flow! So make sure that somehow, you retrieve this code!

With this code, thanks to the [`createAsync()`](https://osu-v2.taevas.xyz/classes/API.html#createasync) method, you're able to create your [`api`](https://osu-v2.taevas.xyz/classes/API.html) object:
```typescript
const api = await osu.API.createAsync("<client_id>", "<client_secret>", {code: "<code>", redirect_uri: "<application_callback_url>"})
```

#### Keep your api object somewhere safe

Congrats on making your `api` object! As you may have seen from glancing at the documentation, it is pretty important as it holds a lot of information, such as:
- the [`access_token`](https://osu-v2.taevas.xyz/classes/API.html#access_token) used for all requests and the [`refresh_token`](https://osu-v2.taevas.xyz/classes/API.html#refresh_token) used to get a new `access_token` without asking the user for consent again
- [`expires`](https://osu-v2.taevas.xyz/classes/API.html#expires), which tells you when your `access_token` will expire
- [`user`](https://osu-v2.taevas.xyz/classes/API.html#user), which is the id of the osu! user who has gone through that whole authorization thingie

It is important to note that it has features you can change or turn off, they are all listed in the documentation but those worth noting are:
- [`refresh_token_on_expires`](https://osu-v2.taevas.xyz/classes/API.html#refresh_token_on_expires), automatically refresh the token when the expiration date is reached
- [`refresh_token_on_401`](https://osu-v2.taevas.xyz/classes/API.html#refresh_token_on_401), automatically refresh the token upon encountering a 401 (usual sign of an expired token)
- [`retry_on_automatic_token_refresh`](https://osu-v2.taevas.xyz/classes/API.html#retry_on_automatic_token_refresh), automatically retry the request that had 401d after successfully refreshing the token

Finally, do note that you can use the `refresh_token` yourself using [refreshToken()](https://osu-v2.taevas.xyz/classes/API.html#refreshtoken)!

#### Full example

Here's a full example where you will launch a server that will:
- listen for an authorization code
- create the authorization URL and open it in your browser
- create the api object with the authorization code it has received
- get your user id and username from that

```typescript
// TypeScript
import * as osu from "osu-api-v2-js"
import * as http from "http"
import { exec } from "child_process"

// This should be from an application registered on https://osu.ppy.sh/home/account/edit#oauth
const id = 0 // replace with your client id
const secret = "<client_secret>"
const redirect_uri = "<application_callback_url>" // assuming localhost with any unused port for convenience (like http://localhost:7272/)

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

async function getSelf() {
	// Get the code needed for the api object
	const url = osu.generateAuthorizationURL(id, redirect_uri, ["public", "identify"])
	const code = await getCode(url)
	const api = await osu.API.createAsync(id, secret, {code, redirect_uri}, {verbose: "all"})
	
	// Use the `me` endpoint, which gives information about the authorized user!
	const me = await api.getResourceOwner()
	console.log("My id is", me.id, "but I'm better known as", me.username)
	
	// If you're not gonna use the token anymore, might as well revoke it for the sake of security
	await api.revokeToken().then(() => console.log("Revoked the token, it can no longer be used!"))
}

getSelf()
```

If you're looking for an example that involves WebSockets, you might wanna take a look at `lib/tests/websocket.ts` in the package's repository!

### Calling the functions, but literally

This package's functions can be accessed both through the api object and through namespaces! It essentially means that for convenience's sake, there are two ways to do anything:

```typescript
// Obtaining a match, assuming an `api` object already exists and everything from the package is imported as `osu`
const match_1 = await api.getMatch(103845156) // through the api object
const match_2 = await osu.Match.getOne.call(api, 103845156) // through the namespaces
// `match_1` and `match_2` are the same, because they're essentially using the same function!

// The same, but for obtaining multiple lazer updates
const builds_1 = await api.getChangelogBuilds("lazer")
const builds_2 = await osu.Changelog.Build.getMultiple.call(api, "lazer")
// `build_1` and `build_2` are also the same!
```

As you may have noticed, when calling the functions through the namespaces, instead of doing something like `getOne()`, we instead do `getOne.call()` and use [the call() method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call) in order to provide a `this` value; the api object!

Of course, using [the apply() method](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply) would also work, so just do things the way you prefer or the way that is more intuitive to you!

## List of implemented endpoints

In the same order as on [the API's official documentation](https://osu.ppy.sh/docs/):

### Account
- `GET /me/beatmapset-favourites` -> [getFavouriteBeatmapsetsIds()](https://osu-v2.taevas.xyz/classes/API.html#getfavouritebeatmapsetsids)

### Beatmap Packs
- `GET /beatmaps/packs` -> [getBeatmapPacks()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmappacks)
- `GET /beatmaps/packs/{pack}` -> [getBeatmapPack()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmappack)

### Beatmaps
- `GET /beatmaps/lookup` -> [lookupBeatmap()](https://osu-v2.taevas.xyz/classes/API.html#lookupbeatmap)
- `GET /beatmaps/{beatmap}/scores/users/{user}` -> [getBeatmapUserScore()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmapuserscore)
- `GET /beatmaps/{beatmap}/scores/users/{user}/all` -> [getBeatmapUserScores()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmapuserscores)
- `GET /beatmaps/{beatmap}/scores` -> [getBeatmapScores()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmapscores)
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
- While other relevant endpoints exist, they are only officially supported through the osu! client (lazer)

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
- `GET /forums/topics/{topic}` -> [getForumTopic()](https://osu-v2.taevas.xyz/classes/API.html#getforum) (removing `search` for simplicity)
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
- While other relevant endpoints exist, they are only officially supported through the osu! client (lazer)

### News
- `GET /news` -> [getNewsPosts()](https://osu-v2.taevas.xyz/classes/API.html#getnewsposts) (removing everything except `news_sidebar.news_posts`)
- `GET /news/{news}` -> [getNewsPost()](https://osu-v2.taevas.xyz/classes/API.html#getnewspost)

### Ranking
- `GET /rankings/kudosu` -> [getKudosuRanking()](https://osu-v2.taevas.xyz/classes/API.html#getkudosuranking)
- `GET /rankings/{mode}/{type}` -> [getUserRanking()](https://osu-v2.taevas.xyz/classes/API.html#getuserranking) and [getCountryRanking()](https://osu-v2.taevas.xyz/classes/API.html#getcountryranking) and [getSpotlightRanking()](https://osu-v2.taevas.xyz/classes/API.html#getspotlightranking)
- `GET /spotlights` -> [getSpotlights()](https://osu-v2.taevas.xyz/classes/API.html#getspotlights)

### Scores
- `GET /scores` -> [getScores()](https://osu-v2.taevas.xyz/classes/API.html#getscores)

### Under "Undocumented" or missing from docs
- `GET /beatmapsets/events` -> [getBeatmapsetEvents()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmapsetevents)
- `GET /seasonal-backgrounds` -> [getSeasonalBackgrounds()](https://osu-v2.taevas.xyz/classes/API.html#getseasonalbackgrounds)
- `GET /rooms/{room}` -> [getRoom()](https://osu-v2.taevas.xyz/classes/API.html#getroom)
- `GET /rooms/{room}/leaderboard` -> [getRoomLeaderboard()](https://osu-v2.taevas.xyz/classes/API.html#getroomleaderboard)
- `GET /rooms/{room}/events` -> [getRoomEvents()](https://osu-v2.taevas.xyz/classes/API.html#getroomevents)
- `GET /scores/{score}/download` -> [getReplay()](https://osu-v2.taevas.xyz/classes/API.html#getreplay)
- `GET /scores/{rulesetOrScore}/{score?}` -> [getScore()](https://osu-v2.taevas.xyz/classes/API.html#getscore)
- `GET /users/lookup` -> [lookupUsers()](https://osu-v2.taevas.xyz/classes/API.html#lookupusers)
- `GET /friends` -> [getFriends()](https://osu-v2.taevas.xyz/classes/API.html#getfriends)
- `GET /tags` -> [getBeatmapUserTags()](https://osu-v2.taevas.xyz/classes/API.html#getbeatmapusertags)

### Users
- `GET /users/{user}/kudosu` -> [getUserKudosuHistory()](https://osu-v2.taevas.xyz/classes/API.html#getuserkudosuhistory)
- `GET /users/{user}/scores/{type}` -> [getUserScores()](https://osu-v2.taevas.xyz/classes/API.html#getuserscores)
- `GET /users/{user}/beatmapsets/{type}` -> [getUserBeatmaps()](https://osu-v2.taevas.xyz/classes/API.html#getuserbeatmaps) and [getUserMostPlayed()](https://osu-v2.taevas.xyz/classes/API.html#getusermostplayed)
- `GET /users/{user}/recent_activity` -> [getUserRecentActivity()](https://osu-v2.taevas.xyz/classes/API.html#getuserrecentactivity)
- `GET /users/{user}/beatmaps-passed` -> [getUserPassedBeatmaps()](https://osu-v2.taevas.xyz/classes/API.html#getuserpassedbeatmaps)
- `GET /users/{user}/{mode?}` -> [getUser()](https://osu-v2.taevas.xyz/classes/API.html#getuser)
- `GET /users` -> [getUsers()](https://osu-v2.taevas.xyz/classes/API.html#getusers)
- `GET /me/{mode?}` -> [getResourceOwner()](https://osu-v2.taevas.xyz/classes/API.html#getresourceowner)

### Wiki
- `GET /wiki/{locale}/{path}` -> [getWikiPage()](https://osu-v2.taevas.xyz/classes/API.html#getwikipage)
