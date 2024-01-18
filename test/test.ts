import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.211.0/assert/mod.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import { CSS, render, Renderer } from "../mod.ts";

Deno.test("Basic markdown", async () => {
  const markdown = await Deno.readTextFile("./test/fixtures/basic.md");
  const expected = await Deno.readTextFile("./test/fixtures/basic.html");
  const html = render(markdown);
  assertEquals(html, expected);

  const document = new DOMParser().parseFromString(html, "text/html");
  assertEquals(document?.querySelector("h1")?.textContent, "Heading");
  assertEquals(document?.querySelectorAll("li")?.length, 3);
});

Deno.test("Math rendering", async () => {
  const math = await Deno.readTextFile("./test/fixtures/math.md");
  const expected = await Deno.readTextFile("./test/fixtures/math.html");
  const html = render(math, { allowMath: true });
  assertEquals(html, expected);
  const document = new DOMParser().parseFromString(html, "text/html");
  assertEquals(
    document?.querySelector(".katex-mathml")?.textContent,
    "y=x2y = x^2",
  );
});

Deno.test("Math rendering doesn't throw on invalid katex input", () => {
  render("$$ & $$");
  render(" $&$");
});

Deno.test("When allowMath is not specified, make sure math is not rendered", () => {
  const markdown = "This is a test $$y=x^2$$";
  const expected = `<p>This is a test $$y=x^2$$</p>\n`;
  const html = render(markdown);
  assertEquals(html, expected);
});

Deno.test("When allowMath is not specified, make sure math code block is not rendered", () => {
  const markdown = "```math\ny=x^2\n```";
  const expected = `<pre><code>y=x^2</code></pre>`;
  const html = render(markdown);
  assertEquals(html, expected);
});

Deno.test("bug #61 generate a tag", () => {
  const markdown = "[link](https://example.com)";
  const expected =
    `<p><a href="https://example.com" rel="noopener noreferrer">link</a></p>\n`;
  const html = render(markdown);
  assertEquals(html, expected);
});

Deno.test("bug #61 generate a tag with disableHtmlSanitization", () => {
  const markdown = "[link](https://example.com)";
  const expected =
    `<p><a href="https://example.com" rel="noopener noreferrer">link</a></p>\n`;
  const html = render(markdown, { disableHtmlSanitization: true });
  assertEquals(html, expected);
});

Deno.test(
  "bug #61 generate an in-page link with disableHtmlSanitization",
  () => {
    const markdown = "[link](#example)";
    const expected = `<p><a href="#example">link</a></p>\n`;
    const html = render(markdown, { disableHtmlSanitization: true });
    assertEquals(html, expected);
  },
);

Deno.test(
  "<td> in table supports align, rowspan, and colspan",
  async () => {
    const markdown = await Deno.readTextFile("./test/fixtures/table.md");
    const expected = await Deno.readTextFile("./test/fixtures/table.html");
    const html = render(markdown);
    assertEquals(html, expected);
  },
);

Deno.test(
  "custom renderer",
  () => {
    const markdown = `# hello world`;
    const expected = `<h1 id="custom-renderer">hello world</h1>`;

    class CustomRenderer extends Renderer {
      heading(text: string, level: 1 | 2 | 3 | 4 | 5 | 6): string {
        return `<h${level} id="custom-renderer">${text}</h${level}>`;
      }
    }

    const html = render(markdown, { renderer: new CustomRenderer({}) });
    assertEquals(html, expected);
  },
);

Deno.test(
  "alerts rendering",
  async () => {
    const markdown = await Deno.readTextFile("./test/fixtures/alerts.md");
    const expected = await Deno.readTextFile("./test/fixtures/alerts.html");
    const html = render(markdown);
    assertEquals(html, expected);
  },
);

Deno.test("Iframe rendering", () => {
  const markdown =
    'Here is an iframe:\n\n<iframe src="https://example.com" width="300" height="200"></iframe>';
  const expected =
    `<p>Here is an iframe:</p>\n<iframe src="https://example.com" width="300" height="200"></iframe>`;

  const html = render(markdown, { allowIframes: true });
  assertEquals(html, expected);
});

Deno.test("Iframe rendering disabled", () => {
  const markdown =
    'Here is an iframe:\n\n<iframe src="https://example.com" width="300" height="200"></iframe>';
  const expectedWithoutIframe = `<p>Here is an iframe:</p>\n`;

  const html = render(markdown);
  assertEquals(html, expectedWithoutIframe);
});

Deno.test("Media URL transformation", () => {
  const markdown = "![Image](image.jpg)\n\n![Video](video.mp4)";
  const mediaBaseUrl = "https://cdn.example.com/";
  const expected =
    `<p><img src="https://cdn.example.com/image.jpg" alt="Image" /></p>\n<p><img src="https://cdn.example.com/video.mp4" alt="Video" /></p>\n`;

  const html = render(markdown, { mediaBaseUrl: mediaBaseUrl });
  assertEquals(html, expected);
});

Deno.test("Media URL transformation without base URL", () => {
  const markdown = "![Image](image.jpg)\n\n![Video](video.mp4)";
  const expectedWithoutTransformation =
    `<p><img src="image.jpg" alt="Image" /></p>\n<p><img src="video.mp4" alt="Video" /></p>\n`;

  const html = render(markdown);
  assertEquals(html, expectedWithoutTransformation);
});

Deno.test("Media URL transformation with invalid URL", () => {
  const markdown = "![Image](invalid-url)";
  const mediaBaseUrl = "this is an invalid url";
  const expected = `<p><img alt="Image" /></p>\n`;

  const html = render(markdown, { mediaBaseUrl: mediaBaseUrl });
  assertEquals(html, expected);
});

Deno.test("Inline rendering", () => {
  const markdown = "My [Deno](https://deno.land) Blog";
  const expected =
    `My <a href="https://deno.land" rel="noopener noreferrer">Deno</a> Blog`;

  const html = render(markdown, { inline: true });
  assertEquals(html, expected);
});

Deno.test("Inline rendering false", () => {
  const markdown = "My [Deno](https://deno.land) Blog";
  const expected =
    `<p>My <a href="https://deno.land" rel="noopener noreferrer">Deno</a> Blog</p>\n`;

  const html = render(markdown, { inline: false });
  assertEquals(html, expected);
});

Deno.test("Link URL resolution with base URL", () => {
  const markdown = "[Test Link](/path/to/resource)";
  const baseUrl = "https://example.com/";
  const expected =
    `<p><a href="https://example.com/path/to/resource" rel="noopener noreferrer">Test Link</a></p>\n`;

  const html = render(markdown, { baseUrl: baseUrl });
  assertEquals(html, expected);
});

Deno.test("Link URL resolution without base URL", () => {
  const markdown = "[Test Link](/path/to/resource)";
  const expected =
    `<p><a href="/path/to/resource" rel="noopener noreferrer">Test Link</a></p>\n`;

  const html = render(markdown);
  assertEquals(html, expected);
});

Deno.test("Link URL resolution with invalid URL and base URL", () => {
  const markdown = "[Test Link](/path/to/resource)";
  const baseUrl = "this is an invalid url";
  const expected =
    `<p><a href="/path/to/resource" rel="noopener noreferrer">Test Link</a></p>\n`;

  const html = render(markdown, { baseUrl: baseUrl });
  assertEquals(html, expected);
});

Deno.test("Math rendering in code block", () => {
  const markdown = "```math\ny = mx + b\n```";
  const expected = Deno.readTextFileSync("./test/fixtures/codeMath.html");

  const html = render(markdown, { allowMath: true });
  assertEquals(html, expected);
});

Deno.test(
  "custom allowed classes",
  async () => {
    const markdown = await Deno.readTextFile(
      "./test/fixtures/customAllowedClasses.md",
    );
    const expected = await Deno.readTextFile(
      "./test/fixtures/customAllowedClasses.html",
    );
    class CustomRenderer extends Renderer {
      list(body: string, ordered: boolean): string {
        const type = ordered ? "list-decimal" : "list-disc";
        const tag = ordered ? "ol" : "ul";
        return `<${tag} class="${type}">${body}</${tag}>`;
      }
    }
    const html = render(markdown, {
      renderer: new CustomRenderer({}),
      allowedClasses: { ul: ["list-disc"], ol: ["list-decimal"] },
    });
    assertEquals(html, expected.trim());
  },
);

Deno.test("image title and no alt", () => {
  const markdown = `![](image.jpg "best title")`;
  const expected = `<p><img src="image.jpg" title="best title" /></p>\n`;

  const html = render(markdown);
  assertEquals(html, expected);
});

Deno.test("js language", () => {
  const markdown = "```js\nconst foo = 'bar';\n```";
  const expected =
    `<div class="highlight highlight-source-js notranslate"><pre><span class="token keyword">const</span> foo <span class="token operator">=</span> <span class="token string">'bar'</span><span class="token punctuation">;</span></pre></div>`;

  const html = render(markdown);
  assertEquals(html, expected);
});

Deno.test("link with title", () => {
  const markdown = `[link](https://example.com "asdf")`;
  const expected =
    `<p><a href="https://example.com" title="asdf" rel="noopener noreferrer">link</a></p>\n`;
  const html = render(markdown);
  assertEquals(html, expected);
});

Deno.test("expect console warning from invalid math", () => {
  const originalWarn = console.warn;
  const warnCalls: string[] = [];
  console.warn = (...args) => {
    warnCalls.push(args[0].message);
  };

  const html = render("$$ +& $$", { allowMath: true });
  const expected =
    `<p>$$ +&amp; <span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow></mrow><annotation encoding="application/x-tex"></annotation></semantics></math></span><span class="katex-html" aria-hidden="true"></span></span></p>\n`;
  assertEquals(html, expected);
  assertStringIncludes(
    warnCalls[0],
    "KaTeX parse error: Expected 'EOF', got '&' at position 2: +&̲",
  );

  const html2 = render(" $&$", { allowMath: true });
  const expected2 = `<p> $&amp;$</p>\n`;
  assertEquals(html2, expected2);
  assertStringIncludes(
    warnCalls[1],
    "KaTeX parse error: Expected 'EOF', got '&' at position 1: &̲",
  );

  console.warn = originalWarn;
});

Deno.test("basic md table with dollar signs", () => {
  const markdown = `| Fruit Name | Quantity | Unit Cost per Item | Subtotal |
  |------------|----------|--------------------|----------|
  | Apple      | 1        | $1.50              | $1.50    |
  | Pear       | 2        | $2.00              | $4.00    |
  | Orange     | 3        | $2.50              | $7.50    |
  | Grape      | 60       | $0.05              | $3.00    |
  | Total      |          |                    | $16.00   |`;

  const body = render(markdown);
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
  // uncomment to update the fixture when the css changes
  // Deno.writeTextFileSync("./test/fixtures/basic_md_table.html", html);

  const expected = Deno.readTextFileSync("./test/fixtures/basic_md_table.html");
  assertEquals(html, expected);
});
