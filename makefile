build:
	cd style && npm install && npm run build
	echo "/** @type {string} */\nexport const CSS = \``cat style/dist/main.css`\`;" > style.js

dev:
	deno run --allow-net --allow-read --watch --unstable ./example/main.ts