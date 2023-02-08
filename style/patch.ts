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

// KATEX

// Download the file and write it to disk
const req = await fetch(
  "https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.css",
);
const text = await req.text();
await Deno.writeTextFile("katex.css", text);
