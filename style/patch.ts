import { expandGlobSync } from "https://deno.land/std@0.172.0/fs/mod.ts";
import css from "npm:css";

const colorVariables = new Set<string>();
const variableRegex = /--[\w-]+/g;

for (
  const { path } of [
    { path: "main.scss" },
    ...expandGlobSync("node_modules/@primer/css/markdown/*.scss"),
  ]
) {
  const file = Deno.readTextFileSync(path);

  for (const variable of file.match(variableRegex) ?? []) {
    colorVariables.add(variable);
  }
}

console.log("Extracted color variables", colorVariables);

const colorRegex = new RegExp(
  [...colorVariables].map((colorVariable) => `\\s+${colorVariable}.+`).join(
    "|",
  ),
  "g",
);

for (const mode of ["light", "dark"]) {
  const primitiveFile =
    `node_modules/@primer/primitives/dist/scss/colors/_${mode}.scss`;
  console.log("Patching", primitiveFile);
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

const command = new Deno.Command("npx", {
  args: ["parcel", "build", "main.scss", "--no-source-maps"],
});
await command.output();

// KATEX

console.log("Fetching katex styles");
const KATEX_BASE_URL = "https://cdn.jsdelivr.net/npm/katex@0.16.4/dist";
const req = await fetch(`${KATEX_BASE_URL}/katex.min.css`);
let KATEX_CSS = await req.text();

// Replace url of fonts with a cdn since we aren't packaging these
KATEX_CSS = KATEX_CSS.replaceAll("fonts/", `${KATEX_BASE_URL}/fonts/`);

console.log("Extracting katex classes");
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

console.log("Writing the final style.js");
const CSS = await Deno.readTextFile("./dist/main.css");

await Deno.writeTextFile(
  "style.js",
  `/** @type {string} */
export const CSS = \`${CSS}\`;

/** @type {string} */
export const KATEX_CSS = \`${KATEX_CSS}\`;

export const KATEX_CLASSES = ${JSON.stringify(classes)};
`,
);
