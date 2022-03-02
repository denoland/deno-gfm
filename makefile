build:
	rm -rf style/node_modules/@primer/primitives
	cd style && npm install && npm run build
	echo "/** @type {string} */\nexport const CSS = \``cat style/dist/main.css`\`;" > style.js

dev:
	deno run --allow-net --allow-read --unstable --watch --no-check ./example/main.ts