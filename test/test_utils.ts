import {
  default as puppeteer,
  type Page,
} from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { CSS, render, type RenderOptions } from "../mod.ts";

type TestCase = {
  markdown: string;
  renderOptions?: RenderOptions;
};

export type TestCases = "basicMarkdownTable" | "footnotes" | "yaml";

export const testCases: Record<TestCases, TestCase> = {
  "basicMarkdownTable": {
    markdown: `| Fruit Name | Quantity | Unit Cost per Item | Subtotal |
|------------|----------|--------------------|----------|
| Apple      | 1        | $1.50              | $1.50    |
| Pear       | 2        | $2.00              | $4.00    |
| Orange     | 3        | $2.50              | $7.50    |
| Grape      | 60       | $0.05              | $3.00    |
| Total      |          |                    | $16.00   |`,
  },
  "footnotes": {
    markdown: Deno.readTextFileSync("./test/fixtures/footnote.md"),
  },
  "yaml": {
    markdown: Deno.readTextFileSync("./test/fixtures/yaml.md"),
  },
};

export async function browserTest(
  test: TestCases,
  fn: (page: Page) => Promise<void>,
) {
  const { serverProcess, address } = await startServer();

  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox"],
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.goto(`${address}/${test}`);
      await fn(page);
    } finally {
      await browser.close();
    }
  } finally {
    serverProcess.shutdown();
  }
}

export function startServer() {
  const serverProcess = Deno.serve((req) => {
    const route = req.url.replace("http://localhost:8000/", "");
    let body = "";
    if (isTestCase(route)) {
      const testCase = testCases[route];
      body = render(testCase.markdown, testCase.renderOptions);
    } else if (route === "") {
      body = render(generateIndexMarkdown());
    } else if (route === "favicon.ico") {
      // swallow
    } else {
      console.log(route);
      throw new Error("Invalid route specified");
    }
    const htmlContent = wrapBody(body);

    return new Response(htmlContent, {
      headers: { "Content-Type": "text/html" },
    });
  });

  const address = `http://localhost:8000`;

  return { serverProcess, address };
}

function wrapBody(bodyContent: string) {
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

function generateIndexMarkdown() {
  let markdown = "# Deno GFM Server Tests\n";
  markdown += Object.keys(testCases).map((testCase) => {
    return `- [${testCase}](http://localhost:8000/${testCase})`;
  }).join("\n");
  return markdown;
}

function isTestCase(route: string): route is TestCases {
  return route in testCases;
}
