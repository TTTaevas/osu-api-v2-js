If you feel like contributing to this project, then please, go ahead!

To get started with development, you should begin by forking this project and running `git clone` on your fork. After that's done, you should install all of its dependencies, add an API key to run tests with, and see if everything works as intended:

```bash
npm install # Add the package's dependencies using npm

# Rename the .env.example file to .env, then:
# - If your client was created on osu.ppy.sh, fill `ID`, `SECRET`, and `REDIRECT_URL` (you may find and create your clients at https://osu.ppy.sh/home/account/edit#oauth)
# - Or if your client was created on dev.ppy.sh, fill `DEV_ID`, `DEV_SECRET` and `REDIRECT_URL`

# Although you may customize the tests as you see fit, by default, all methods that require authenticating are tested on dev.ppy.sh
npm run test-authenticated # Runs those tests specifically (/lib/tests/authenticated.ts)

# Still by default, all methods that DO NOT require authenticating (so where you act as a guest user) are tested on osu.ppy.sh
npm run test # Runs these tests specifically (/lib/tests/guest.ts)

# There is a test designed specifically to check the package's WebSocket capacities against the chat on osu.ppy.sh
npm run test-websocket # Runs the WebSocket test (/lib/tests/websocket.ts)
```

In other words, methods that require authentication are not tested when testing methods that don't require authentication, and vice-versa.

The commands that run tests actually compile all of the files that are in `lib` into JavaScript and puts them in `dist`, to then run the generated test file. After it is done running, it automatically revokes your token for the sake of security!

Happy developing, and thank you for your interest in this project!
