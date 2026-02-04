// deno-lint-ignore no-import-prefix
import $ from "jsr:@david/dax@^0.45.0";
import css from "css";

await $`rm -rf style/node_modules/@primer/primitives style/.parcel-cache style/dist`;
await $`npm install`.cwd("./style");

const colorVariables = new Set<string>();
const variableRegex = /--[\w-]+/g;

const cwd = $.path("./style");
const markdownScssDir = cwd.join("node_modules/@primer/css/markdown");
const scssFiles = [
  cwd.join("main.scss"),
  ...Array.from(Deno.readDirSync(markdownScssDir.toString()))
    .filter((e) => e.isFile && e.name.endsWith(".scss"))
    .map((e) => markdownScssDir.join(e.name)),
];

for (const pathRef of scssFiles) {
  const file = pathRef.readTextSync();

  for (const variable of file.match(variableRegex) ?? []) {
    colorVariables.add(variable);
  }
}

$.logStep("Extracted color variables", Deno.inspect(colorVariables));

const colorRegex = new RegExp(
  [...colorVariables].map((colorVariable) => `\\s+${colorVariable}.+`).join(
    "|",
  ),
  "g",
);

for (const mode of ["light", "dark"]) {
  const primitiveFile = cwd.join(
    `node_modules/@primer/primitives/dist/scss/colors/_${mode}.scss`,
  );
  $.logStep("Patching", primitiveFile);
  const colorPrimitive = primitiveFile.readTextSync();
  const matchedColors = colorPrimitive.match(colorRegex) ?? [];

  primitiveFile.writeTextSync(`@mixin primer-colors-${mode} {
    & {${matchedColors.join("")}
    }
  }`);
}

await $`npx parcel build main.scss --no-source-maps`.cwd("./style").quiet();

// KATEX

$.logStep("Fetching katex styles");
const KATEX_BASE_URL = "https://cdn.jsdelivr.net/npm/katex@0.16.28/dist";
let KATEX_CSS = await $.request(`${KATEX_BASE_URL}/katex.min.css`).text();

// Replace url of fonts with a cdn since we aren't packaging these
KATEX_CSS = KATEX_CSS.replaceAll("fonts/", `${KATEX_BASE_URL}/fonts/`);

$.logStep("Extracting katex classes");
const KATEX_CSS_AST = css.parse(KATEX_CSS);
const KATEX_CSS_RULES = KATEX_CSS_AST.stylesheet.rules.filter((
  rule: { type: string },
) => rule.type === "rule");
const KATEX_CSS_SELECTORS = KATEX_CSS_RULES.reduce(
  (acc: string[], cur: { selectors: string[] }) => [...acc, ...cur.selectors],
  [],
);

const classRegex = /\.([\w-]+)/g;
let classes = [];

for (const selector of KATEX_CSS_SELECTORS) {
  let match;
  while ((match = classRegex.exec(selector)) !== null) {
    classes.push(match[1]);
  }
}

// de-duplicate classes
classes = [...new Set(classes)];

$.logStep("Writing the final style.ts");
const CSS = cwd.join("dist/main.css").readTextSync();

await cwd.join("../style.ts").writeText(`
export const CSS: string = \`${CSS}\`;

export const KATEX_CSS: string = \`${KATEX_CSS}\`;

export const KATEX_CLASSES: string[] = ${JSON.stringify(classes)};
`);
