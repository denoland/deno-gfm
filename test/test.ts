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
