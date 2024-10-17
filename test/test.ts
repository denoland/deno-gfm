import { assertEquals, assertStringIncludes } from "@std/assert";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import { render, Renderer, strip, stripSplitBySections } from "../mod.ts";

Deno.test("Basic markdown", async () => {
  const markdown = await Deno.readTextFile("./test/fixtures/basic.md");
  const expectedHTML = await Deno.readTextFile("./test/fixtures/basic.html");
  const expectedStrip = await Deno.readTextFile("./test/fixtures/basic.strip");
  const html = render(markdown);
  assertEquals(html, expectedHTML);
  assertEquals(strip(markdown), expectedStrip);

  const document = new DOMParser().parseFromString(html, "text/html");
  assertEquals(document?.querySelector("h1")?.textContent, "Heading");
  assertEquals(document?.querySelectorAll("li")?.length, 3);
});

Deno.test("Math rendering", async () => {
  const math = await Deno.readTextFile("./test/fixtures/math.md");
  const expected = await Deno.readTextFile("./test/fixtures/math.html");
  const expectedStrip = await Deno.readTextFile("./test/fixtures/math.strip");
  const html = render(math, { allowMath: true });
  assertEquals(html, expected);
  assertEquals(strip(math), expectedStrip);

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

Deno.test(
  "When allowMath is not specified, make sure math is not rendered",
  () => {
    const markdown = "This is a test $$y=x^2$$";
    const expected = `<p>This is a test $$y=x^2$$</p>\n`;
    const html = render(markdown);
    assertEquals(html, expected);
  },
);

Deno.test(
  "When allowMath is not specified, make sure math code block is not rendered",
  () => {
    const markdown = "```math\ny=x^2\n```";
    const expected = `<pre><code>y=x^2</code></pre>`;
    const html = render(markdown);
    assertEquals(html, expected);
  },
);

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

Deno.test("<td> in table supports align, rowspan, and colspan", async () => {
  const markdown = await Deno.readTextFile("./test/fixtures/table.md");
  const expected = await Deno.readTextFile("./test/fixtures/table.html");
  const html = render(markdown);
  assertEquals(html, expected);
});

Deno.test("custom renderer", () => {
  const markdown = `# hello world`;
  const expected = `<h1 id="custom-renderer">hello world</h1>`;

  class CustomRenderer extends Renderer {
    override heading(text: string, level: 1 | 2 | 3 | 4 | 5 | 6): string {
      return `<h${level} id="custom-renderer">${text}</h${level}>`;
    }
  }

  const html = render(markdown, { renderer: new CustomRenderer({}) });
  assertEquals(html, expected);
});

Deno.test("alerts rendering", async () => {
  const markdown = await Deno.readTextFile("./test/fixtures/alerts.md");
  const expectedHTML = await Deno.readTextFile("./test/fixtures/alerts.html");
  const expectedStrip = await Deno.readTextFile("./test/fixtures/alerts.strip");
  const html = render(markdown);
  assertEquals(html, expectedHTML);
  assertEquals(strip(html), expectedStrip);
});

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

Deno.test("simple img test", () => {
  const markdown = "![asdf](image.jpg)";
  const result = `<p><img src="image.jpg" alt="asdf" /></p>\n`;

  const html = render(markdown);
  assertEquals(html, result);
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

Deno.test("custom allowed classes", async () => {
  const markdown = await Deno.readTextFile(
    "./test/fixtures/customAllowedClasses.md",
  );
  const expected = await Deno.readTextFile(
    "./test/fixtures/customAllowedClasses.html",
  );
  class CustomRenderer extends Renderer {
    override list(body: string, ordered: boolean): string {
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
});

Deno.test("image title and no alt", () => {
  const markdown = `![](image.jpg "best title")`;
  const expected = `<p><img src="image.jpg" alt="" title="best title" /></p>\n`;

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

Deno.test("code fence with a title", () => {
  const markdown = "```js title=\"index.ts\"\nconst foo = 'bar';\n```";
  const expected =
    `<div class="highlight highlight-source-js notranslate"><div class="markdown-code-title">index.ts</div><pre><span class="token keyword">const</span> foo <span class="token operator">=</span> <span class="token string">'bar'</span><span class="token punctuation">;</span></pre></div>`;

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

Deno.test("render github-slugger not reused", function () {
  for (let i = 0; i < 2; i++) {
    const html = render("## Hello");
    const expected =
      `<h2 id="hello"><a class="anchor" aria-hidden="true" tabindex="-1" href="#hello"><svg class="octicon octicon-link" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"></path></svg></a>Hello</h2>\n`;
    assertEquals(html, expected);
  }
});

Deno.test("footnotes", () => {
  const markdown = Deno.readTextFileSync("./test/fixtures/footnote.md");
  const expected = Deno.readTextFileSync("./test/fixtures/footnote.html");

  const html = render(markdown);
  assertEquals(html, expected);
});

Deno.test("hard line breaks", () => {
  const markdown = Deno.readTextFileSync("./test/fixtures/lineBreaks.md");
  const expected = Deno.readTextFileSync("./test/fixtures/lineBreaks.html");

  const html = render(markdown, { breaks: true });
  assertEquals(html, expected);
});

Deno.test("custom allowed tags and attributes", () => {
  const markdown = Deno.readTextFileSync(
    "./test/fixtures/customAllowedTags.md",
  );
  const expected = Deno.readTextFileSync(
    "./test/fixtures/customAllowedTags.html",
  );

  const html = render(markdown, {
    allowedTags: ["meter"],
    allowedAttributes: { meter: ["value", "optimum"], a: ["hreflang"] },
  });
  assertEquals(html, expected);
});

Deno.test("details, summary, and del", () => {
  const markdown = `Example

<details open>
<summary>Shopping list</summary>

* Vegetables
* Fruits
* Fish
* <del>tofu</del>

</details>
`;
  const expectedHTML = Deno.readTextFileSync(
    "./test/fixtures/detailsSummaryDel.html",
  );
  const expectedStrip = Deno.readTextFileSync(
    "./test/fixtures/detailsSummaryDel.strip",
  );

  const html = render(markdown);
  assertEquals(html, expectedHTML);
  assertEquals(strip(markdown), expectedStrip);
});

Deno.test("del tag test", () => {
  const markdown = "<del>tofu</del>";
  const result = `<p><del>tofu</del></p>\n`;

  const html = render(markdown);
  assertEquals(html, result);
  assertEquals(strip(markdown), "tofu\n");
});

Deno.test("h1 test", () => {
  const markdown = "# Hello";
  const result =
    `<h1 id="hello"><a class="anchor" aria-hidden="true" tabindex="-1" href="#hello"><svg class="octicon octicon-link" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"></path></svg></a>Hello</h1>\n`;

  const html = render(markdown);
  assertEquals(html, result);
  assertEquals(strip(markdown), "Hello\n");
});

Deno.test("svg test", () => {
  const markdown = `<svg viewBox="foo"></svg>`;
  const result = `<p><svg viewBox="foo"></svg></p>\n`;

  const html = render(markdown);
  assertEquals(html, result);
  assertEquals(strip(markdown), "\n");
});

Deno.test("task list", () => {
  const markdown = `- Normal list
- [x] done
- [ ] not done`;
  const expectedHTML = Deno.readTextFileSync("./test/fixtures/taskList.html");
  const expectedStrip = Deno.readTextFileSync("./test/fixtures/taskList.strip");

  const html = render(markdown);
  assertEquals(html, expectedHTML);
  assertEquals(strip(markdown), expectedStrip);
});

Deno.test("anchor test raw", () => {
  const markdown =
    `<a class="anchor" aria-hidden="true" tabindex="-1" href="#hello">foo</a>`;
  const result =
    `<p><a class="anchor" aria-hidden="true" tabindex="-1" href="#hello">foo</a></p>\n`;

  const html = render(markdown);
  assertEquals(html, result);
});

Deno.test("anchor test", () => {
  const markdown = `[asdf](#hello)`;
  const result = `<p><a href="#hello">asdf</a></p>\n`;

  const html = render(markdown);
  assertEquals(html, result);
});

Deno.test("example file", () => {
  const markdown = Deno.readTextFileSync("./example/content.md");
  const expectedHTML = Deno.readTextFileSync("./test/fixtures/example.html");
  const expectedStrip = Deno.readTextFileSync("./test/fixtures/example.strip");
  const expectedJSON = JSON.parse(
    Deno.readTextFileSync("./test/fixtures/example.json"),
  );

  assertEquals(render(markdown), expectedHTML);
  assertEquals(strip(markdown), expectedStrip);
  assertEquals(stripSplitBySections(markdown), expectedJSON);
});

Deno.test("yaml unit", () => {
  const markdown = Deno.readTextFileSync("./test/fixtures/yaml.md");
  const expected = Deno.readTextFileSync("./test/fixtures/yaml.html");

  const html = render(markdown);
  assertEquals(html, expected.trim());
});
