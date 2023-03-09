import { assertEquals } from "https://deno.land/std@0.178.0/testing/asserts.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.35-alpha/deno-dom-wasm.ts";
import { render } from "../mod.ts";

Deno.test("Basic markdown", async () => {
  const markdown = await Deno.readTextFile("./test/fixtures/basic.md");
  const expected = await Deno.readTextFile("./test/fixtures/basic.html");
  const html = render(markdown);
  assertEquals(html, expected);

  const document = new DOMParser().parseFromString(
    html,
    "text/html",
  );
  assertEquals(document?.querySelector("h1")?.textContent, "Heading");
  assertEquals(document?.querySelectorAll("li")?.length, 3);
});

Deno.test("Math rendering", async () => {
  const math = await Deno.readTextFile("./test/fixtures/math.md");
  const html = render(math, { allowMath: true });
  const document = new DOMParser().parseFromString(
    html,
    "text/html",
  );
  assertEquals(
    document?.querySelector(".katex-mathml")?.textContent,
    "y=x2y = x^2",
  );
});
