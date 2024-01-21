import { assert } from "./test_deps.ts";
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
