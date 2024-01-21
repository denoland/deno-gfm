import { Page, puppeteer } from "./test_deps.ts";
import { CSS } from "../mod.ts";

export async function browserTest(
  htmlContent: string,
  fn: (page: Page, address: string) => Promise<void>,
  port = 8000,
) {
  const { serverProcess, address } = await startServer(htmlContent, port);

  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox"],
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await fn(page, address);
    } finally {
      await browser.close();
    }
  } finally {
    serverProcess.shutdown();
  }
}

function startServer(htmlContent: string, port: number) {
  const serverProcess = Deno.serve({ port }, (_req) => {
    return new Response(htmlContent, {
      headers: { "Content-Type": "text/html" },
    });
  });

  const hostname = "localhost";
  const address = `http://${hostname}:${port}`;

  console.log(`Server running at ${address}`);

  return { serverProcess, address };
}

export function setupHtmlWithCss(bodyContent: string): string {
  return `<!DOCTYPE html>
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
        ${bodyContent}
      </main>
    </body>
  </html>
`;
}
