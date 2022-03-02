patch:
	mkdir -p dist
	# Extract variables used by Markdown
	grep -Eoh  -- "--[[:alnum:]-]+" node_modules/@primer/css/markdown/*.scss | sort -u > dist/variables
	# Extract variables used by ourselves
	grep -Eoh  -- "--[[:alnum:]-]+" main.scss | sort -u >> dist/variables
	# Patch light colors
	echo "@mixin primer-colors-light {\n  & {\n`grep -f dist/variables node_modules/@primer/primitives/dist/scss/colors/_light.scss`\n  }\n}" > node_modules/@primer/primitives/dist/scss/colors/_light.scss
	# Patch dark colors
	echo "@mixin primer-colors-dark {\n  & {\n`grep -f dist/variables node_modules/@primer/primitives/dist/scss/colors/_dark.scss`\n  }\n}" > node_modules/@primer/primitives/dist/scss/colors/_dark.scss