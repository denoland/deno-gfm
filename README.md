# deno-gfm

Server-side GitHub Flavored Markdown rendering for Deno, including GitHub style
CSS, syntax highlighting, and HTML sanitization.

## Usage

```js
import { CSS, render } from "https://deno.land/x/gfm/mod.ts";

const markdown = `
# Hello, world!

| Type | Value |
| ---- | ----- |
| x    | 42    |

\`\`\`js
console.log("Hello, world!");
\`\`\`
`;
const rootUrl = "https://example.com";

const body = render(markdown, rootUrl);

const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      main {
        max-width: 800px;
        margin: 0 auto;
      }
      ${CSS}
    </style>
  </head>
  <body>
    <main data-color-mode="light" data-light-theme="light" data-dark-theme="dark" class="markdown-body">
      ${body}
    </main>
  </body>
</html>
`;
```

### Styling

The GitHub CSS styles (https://primer.style) are used. There are two themes
available: light and dark.

There are three data attributes that can be used to control the theme:

- `data-color-mode`: `light` or `dark` or `auto`.
- `data-light-theme`: the name of the light theme (`light` or `dark`).
- `data-dark-theme`: the name of the dark theme (`light` or `dark`).

For example, if you want to use the dark theme only, set the following:

```html
<div data-color-mode="dark" data-dark-theme="dark" class="markdown-body">
  ... markdown body here ...
</div>
```

If you want to use the light or dark theme depending on the user's browser
preference, set the following:

```html
<div data-color-mode="auto" data-light-theme="light" data-dark-theme="dark" class="markdown-body">
  ... markdown body here ...
</div>
```

Also see the example application in the `example/` directory.

## Extensibility

By default syntax highlighting for JavaScript, Markdown, and HTML is included.
You can include more languages importing them:

```js
import { CSS, render } from "https://deno.land/x/gfm/mod.ts";

// Add support for TypeScript, Bash, and Rust.
import "https://esm.sh/prismjs@1.27.0/components/prism-typescript?no-check";
import "https://esm.sh/prismjs@1.27.0/components/prism-bash?no-check";
import "https://esm.sh/prismjs@1.27.0/components/prism-rust?no-check";
```

A full list of supported languages is available here:
https://unpkg.com/browse/prismjs@1.27.0/components/
