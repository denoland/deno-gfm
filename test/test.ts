import { assertEquals } from "https://deno.land/std@0.178.0/testing/asserts.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.35-alpha/deno-dom-wasm.ts";
import { render } from "../mod.ts";

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
