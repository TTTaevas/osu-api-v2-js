// pssst, if you're worried about this, you can set `umami.disabled` to `1` in your localstorage to not get your data collected
// for the sake of transparency, I don't mind if you see that data for yourself, you'll see it's nothing big
// https://visitors.taevas.xyz/share/a9dXwulX0dVR3UTz/osu-v2.taevas.xyz

import { Application, JSX, ParameterType } from "typedoc";

export function load(app: Application) {
	app.options.addDeclaration({
		name: "visitors",
		help: "Set the script from visitors.taevas.xyz",
		type: ParameterType.String,
	});

	app.renderer.hooks.on("head.end", () => {
		return JSX.createElement(JSX.Fragment, null, [
			JSX.createElement("script", {
				defer: true,
				"data-website-id": "02d78ab3-89d2-463a-8a2c-a4552dfea57a",
				src: "https://visitors.taevas.xyz/script.js"
			}),
		])
	})
}
