import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

import { CSS, KATEX_CSS, render } from "../mod.ts";

import "https://esm.sh/prismjs@1.29.0/components/prism-jsx?no-check&pin=v57";
import "https://esm.sh/prismjs@1.29.0/components/prism-typescript?no-check&pin=v57";
import "https://esm.sh/prismjs@1.29.0/components/prism-tsx?no-check&pin=v57";
import "https://esm.sh/prismjs@1.29.0/components/prism-bash?no-check&pin=v57";
import "https://esm.sh/prismjs@1.29.0/components/prism-powershell?no-check&pin=v57";
import "https://esm.sh/prismjs@1.29.0/components/prism-json?no-check&pin=v57";
import "https://esm.sh/prismjs@1.29.0/components/prism-diff?no-check&pin=v57";

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

serve(handler, {
  port: 8001,
});
