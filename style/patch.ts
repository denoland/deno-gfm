import { expandGlobSync } from "https://deno.land/std@0.172.0/fs/mod.ts";

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
  args: ["parce", "build", "main.scss", "--no-source-maps"],
});
await command.output();

// KATEX

console.log("Fetching katex styles");
const req = await fetch(
  "https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.css",
);
const KATEX_CSS = await req.text();

console.log("Extracting katex classes");
const classRegex = /\.([\w-]+)/g;
let classes = [];

let match;
while ((match = classRegex.exec(KATEX_CSS)) !== null) {
  classes.push(match[1]);
}

// de-duplicate classes
classes = [...new Set(classes)];

// remove things that aren't classes but are extracted because I'm bad at regex
classes = classes.filter((c) => !["woff2", "woff", "ttf"].includes(c));

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
