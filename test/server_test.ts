import { assert, assertEquals } from "@std/assert";
import { browserTest } from "./test_utils.ts";

Deno.test({
  name: "basic md table with dollar signs",
  sanitizeResources: false,
  sanitizeOps: false,
}, async () => {
  await browserTest("basicMarkdownTable", async (page) => {
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
        { args: [row, col] },
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
      property: string & keyof CSSStyleDeclaration,
    ) => {
      return page.evaluate(
        (selector, property) => {
          const element = document.querySelector(selector);
          if (!element) {
            return null;
          }
          const style = globalThis.getComputedStyle(element);
          return style[property];
        },
        { args: [selector, property] },
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

Deno.test(
  { name: "footnote with style", sanitizeResources: false, sanitizeOps: false },
  async () => {
    await browserTest("footnotes", async (page) => {
      // 1. Test page jump on clicking footnote links
      const scrollPositionBefore = await page.evaluate(() =>
        globalThis.scrollY
      );
      await (await page.$("#footnote-ref-1"))!.click(); // click the first footnote link. note that we select by id, not href
      const scrollPositionAfter = await page.evaluate(() => globalThis.scrollY);
      assert(scrollPositionAfter > scrollPositionBefore);

      await (await page.$("#footnote-ref-bignote"))!.click();
      const scrollPositionAfter2 = await page.evaluate(() =>
        globalThis.scrollY
      );
      assert(scrollPositionAfter2 === scrollPositionAfter);

      await (await page.$("#footnote-1 > p > a"))!.click();
      const scrollPositionAfter3 = await page.evaluate(() =>
        globalThis.scrollY
      );
      assert(scrollPositionAfter3 < scrollPositionAfter2);
      assert(scrollPositionAfter3 > scrollPositionBefore);

      // 2. Verify footnote link styling
      const beforeContent = await page.evaluate(() => {
        const element = document.querySelector("#footnote-ref-1");
        if (element) {
          return globalThis.getComputedStyle(element, "::before").content;
        }
        return null;
      });
      const afterContent = await page.evaluate(() => {
        const element = document.querySelector("#footnote-ref-1");
        if (element) {
          return globalThis.getComputedStyle(element, "::after").content;
        }
        return null;
      });
      assertEquals(beforeContent, '"["');
      assertEquals(afterContent, '"]"');

      // 3. Check Visibility of "Footnotes" H2
      const h2Style = await page.evaluate(() => {
        const element = document.querySelector("#footnote-label");
        if (element) {
          const computedStyle = globalThis.getComputedStyle(element);
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
      await (await page.$("#footnote-ref-1"))!.click();
      const footnoteStyle = await page.evaluate(() => {
        const element = document.querySelector("#footnote-1");
        if (element) {
          return globalThis.getComputedStyle(element)
            .outlineColor;
        }
        return null;
      });
      assertEquals(footnoteStyle, "rgb(31, 35, 40)");
    });
  },
);

Deno.test(
  { name: "yaml style", sanitizeResources: false, sanitizeOps: false },
  async () => {
    await browserTest("yaml", async (page) => {
      const nameStyle = await page.evaluate(() => {
        const element = document.querySelector(
          "body > main > div > pre > span:nth-child(1)", // doe in the first line
        );
        if (element) {
          return globalThis.getComputedStyle(element).color;
        }
        return null;
      });
      assertEquals(nameStyle, "rgb(207, 34, 46)");

      const colonStyle = await page.evaluate(() => {
        const element = document.querySelector(
          "body > main > div > pre > span:nth-child(2)", // : in the first line
        );
        if (element) {
          return globalThis.getComputedStyle(element).color;
        }
        return null;
      });
      assertEquals(colonStyle, "rgb(102, 57, 186)");
    });
  },
);
