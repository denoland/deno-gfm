import $ from "https://deno.land/x/dax@0.27.0/mod.ts";
import css from "npm:css";

await $`rm -rf style/node_modules/@primer/primitives`;
await $`npm install`.cwd("./style");

const colorVariables = new Set<string>();
const variableRegex = /--[\w-]+/g;

const cwd = $.path(".");
const scssFiles = [
  cwd.join("./style/main.scss"),
  ...Array.from(
    cwd.expandGlobSync("node_modules/@primer/css/markdown/*.scss"),
  ).map((e) => e.path),
];

for (const pathRef of scssFiles) {
  const file = pathRef.textSync();

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
  const primitiveFile =
    `./style/node_modules/@primer/primitives/dist/scss/colors/_${mode}.scss`;
  $.logStep("Patching", primitiveFile);
  const colorPrimitive = Deno.readTextFileSync(
    primitiveFile,
  );
  const matchedColors = colorPrimitive.match(colorRegex) ?? [];

  Deno.writeTextFileSync(
    primitiveFile,
    `@mixin primer-colors-${mode} {
  & {${matchedColors.join("")}
  }
}`,
  );
}

await $`npx parcel build main.scss --no-source-maps`.cwd("./style").quiet();

// KATEX

$.logStep("Fetching katex styles");
const KATEX_BASE_URL = "https://cdn.jsdelivr.net/npm/katex@0.16.4/dist";
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

$.logStep("Writing the final style.js");
const CSS = await Deno.readTextFile("./style/dist/main.css");

await Deno.writeTextFile(
  "./style.js",
  `/** @type {string} */
export const CSS = \`${CSS}\`;

/** @type {string} */
export const KATEX_CSS = \`${KATEX_CSS}\`;

export const KATEX_CLASSES = ${JSON.stringify(classes)};
`,
);
