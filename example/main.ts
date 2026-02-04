import { CSS, KATEX_CSS, render } from "../mod.ts";

import "prismjs-jsx";
import "prismjs-typescript";
import "prismjs-tsx";
import "prismjs-bash";
import "prismjs-powershell";
import "prismjs-json";
import "prismjs-diff";

const CONTENT_PATH = new URL("./content.md", import.meta.url);

async function handler(_req: Request): Promise<Response> {
  try {
    const markdown = await (await fetch(CONTENT_PATH)).text();

    const body = render(markdown, {
      allowIframes: true,
      allowMath: true,
    });
    const html = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          margin: 0;
          background-color: var(--color-canvas-default);
          color: var(--color-fg-default);
        }
        main {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
        ${CSS}
        ${KATEX_CSS}
      </style>
    </head>
    <body data-color-mode="auto" data-light-theme="light" data-dark-theme="dark">
      <main class="markdown-body">
        ${body}
      </main>
    </body>
  </html>`;
    return new Response(html, {
      headers: {
        "content-type": "text/html;charset=utf-8",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response((err as Error).message, { status: 500 });
  }
}

Deno.serve({ port: 8001 }, handler);
