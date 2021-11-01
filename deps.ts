/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

export { emojify } from "https://deno.land/x/emoji@0.1.2/mod.ts";

// @deno-types="https://cdn.esm.sh/v53/@types/marked@3.0.1/index.d.ts"
export { default as marked } from "https://cdn.esm.sh/v53/marked@3.0.7/deno/marked.js";

// @deno-types="https://cdn.esm.sh/v53/@types/prismjs@1.16.6/index.d.ts"
export * as Prism from "https://cdn.esm.sh/v53/prismjs@1.25.0/deno/prismjs.js";

// @deno-types="https://cdn.esm.sh/v53/@types/sanitize-html@2.5.0/index.d.ts"
export { default as sanitizeHtml } from "https://cdn.esm.sh/v53/sanitize-html@2.5.2/deno/sanitize-html.js";

// @deno-types="https://cdn.esm.sh/v53/@types/he@1.1.2/index.d.ts"
export { escape as htmlEscape } from "https://cdn.esm.sh/v53/he@1.2.0/deno/he.js";
