You are more than welcome to contribute to this package if you feel like it!! If you want to get started with developing this package, fork it, then read below:

```bash
git clone https://github.com/<your_github>/osu-api-v2-js.git # Clone your fork of this package's repository
yarn install # Add its dependencies using Yarn Classic

# Duplicate the .env.example file and rename it .env, then fill it with the details of one of your clients
# Note: the env variables starting with DEV are only used in test_authorized if the server used isn't osu.ppy.sh (and is for example a development server)
# As a reminder, you may find and create your clients at https://osu.ppy.sh/home/account/edit#oauth

yarn run test # Check that everything seems to be in order
```

From this point onwards, you can work on debugging and adding features by customizing the lib/tests/test.ts or lib/tests/test_authorized.ts file!

```bash
yarn run test # Run the lib/tests/test.ts file
yarn run test-authorized # Run the lib/tests/test_authorized.ts file
```
