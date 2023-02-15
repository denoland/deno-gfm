build:
	rm -f ./style.js
	rm -rf style/node_modules/@primer/primitives
	cd style && npm install && deno run --allow-read=. --allow-write=. --allow-net --allow-run --unstable patch.ts
	mv ./style/style.js ./style.js

dev:
	deno run -A --unstable --watch --no-check ./example/main.ts