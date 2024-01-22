import { assert, assertEquals } from "./test_deps.ts";
import { render } from "../mod.ts";
import { browserTest, setupHtmlWithCss } from "./test_utils.ts";

Deno.test("basic md table with dollar signs", async () => {
  const markdown = `| Fruit Name | Quantity | Unit Cost per Item | Subtotal |
  |------------|----------|--------------------|----------|
  | Apple      | 1        | $1.50              | $1.50    |
  | Pear       | 2        | $2.00              | $4.00    |
  | Orange     | 3        | $2.50              | $7.50    |
  | Grape      | 60       | $0.05              | $3.00    |
  | Total      |          |                    | $16.00   |`;

  const body = render(markdown);
  const html = setupHtmlWithCss(body);

  await browserTest(html, async (page, address) => {
    await page.goto(`${address}`);

    await page.waitForSelector("table", { timeout: 1000 });
    const tableExists = await page.evaluate(() => {
      const table = document.querySelector("table");
      return table !== null;
    });
    assert(tableExists, "Table should be rendered");

    const getCellText = (row: number, col: number) => {
      return page.evaluate(
        (row, col) => {
          const cell = document.querySelector(
            `table tr:nth-child(${row}) td:nth-child(${col})`,
          );
          return cell ? cell.textContent?.trim() : null;
        },
        row,
        col,
      );
    };

    assert(
      await getCellText(1, 1) === "Apple",
      "First row, first column should be 'Apple'",
    );
    assert(
      await getCellText(2, 2) === "2",
      "Second row, second column should be '2'",
    );
    assert(
      await getCellText(2, 3) === "$2.00",
      "Second row, third column should be '$2.00'",
    );
    assert(
      await getCellText(5, 4) === "$16.00",
      "Fifth row, fourth column should be '$16.00'",
    );

    const getComputedStyle = (
      selector: string,
      property: keyof CSSStyleDeclaration,
    ) => {
      return page.evaluate(
        (selector, property) => {
          const element = document.querySelector(selector);
          if (!element) {
            return null;
          }
          const style = window.getComputedStyle(element);
          return style[property];
        },
        selector,
        property,
      );
    };

    const firstRowBgColor = await getComputedStyle(
      "body > main > table > tbody > tr:nth-child(1)",
      "backgroundColor",
    );
    assert(
      firstRowBgColor === "rgb(255, 255, 255)",
      "Table background color should be white",
    );

    const secondRowBgColor = await getComputedStyle(
      "body > main > table > tbody > tr:nth-child(2)",
      "backgroundColor",
    );
    assert(
      secondRowBgColor === "rgb(246, 248, 250)",
      "Table background color should be white",
    );
  });
});

Deno.test("footnote with style", async () => {
  const markdown = Deno.readTextFileSync("./test/fixtures/footnote.md");

  const body = render(markdown);
  const html = setupHtmlWithCss(body);

  await browserTest(html, async (page, address) => {
    await page.goto(`${address}`);

    // 1. Test page jump on clicking footnote links
    const scrollPositionBefore = await page.evaluate(() => window.scrollY);
    await page.click("#footnote-ref-1"); // click the first footnote link. note that we select by id, not href
    const scrollPositionAfter = await page.evaluate(() => window.scrollY);
    assert(scrollPositionAfter > scrollPositionBefore);

    await page.click("#footnote-ref-bignote");
    const scrollPositionAfter2 = await page.evaluate(() => window.scrollY);
    assert(scrollPositionAfter2 === scrollPositionAfter);

    await page.click("#footnote-1 > p > a");
    const scrollPositionAfter3 = await page.evaluate(() => window.scrollY);
    assert(scrollPositionAfter3 < scrollPositionAfter2);
    assert(scrollPositionAfter3 > scrollPositionBefore);

    // 2. Verify footnote link styling
    const beforeContent = await page.evaluate(() => {
      const element = document.querySelector("#footnote-ref-1");
      if (element) {
        return window.getComputedStyle(element, "::before").content;
      }
      return null;
    });
    const afterContent = await page.evaluate(() => {
      const element = document.querySelector("#footnote-ref-1");
      if (element) {
        return window.getComputedStyle(element, "::after").content;
      }
      return null;
    });
    assertEquals(beforeContent, '"["');
    assertEquals(afterContent, '"]"');

    // 3. Check Visibility of "Footnotes" H2
    const h2Style = await page.evaluate(() => {
      const element = document.querySelector("#footnote-label");
      if (element) {
        const computedStyle = window.getComputedStyle(element);
        return {
          position: computedStyle.position,
          width: computedStyle.width,
          height: computedStyle.height,
          overflow: computedStyle.overflow,
          clip: computedStyle.clip,
          wordWrap: computedStyle.wordWrap,
          border: computedStyle.border,
        };
      }
      return null;
    });
    assert(h2Style);
    assertEquals(h2Style.position, "absolute");
    assertEquals(h2Style.width, "1px");
    assertEquals(h2Style.height, "1px");
    assertEquals(h2Style.overflow, "hidden");
    assertEquals(h2Style.clip, "rect(0px, 0px, 0px, 0px)");
    assertEquals(h2Style.wordWrap, "normal");
    assertEquals(h2Style.border, "");

    // 4. Verify blue box around the footnote after clicking
    await page.click("#footnote-ref-1");
    const footnoteStyle = await page.evaluate(() => {
      const element = document.querySelector("#footnote-1");
      if (element) {
        return window.getComputedStyle(element)
          .outlineColor;
      }
      return null;
    });
    assertEquals(footnoteStyle, "rgb(31, 35, 40)");
  });
});
