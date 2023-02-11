import {
  emojify,
  htmlEscape,
  katex,
  Marked,
  Prism,
  sanitizeHtml,
} from "./deps.ts";
import { CSS, KATEX_CLASSES, KATEX_CSS } from "./style.js";
export { CSS, KATEX_CSS };

class Renderer extends Marked.Renderer {
  heading(
    text: string,
    level: 1 | 2 | 3 | 4 | 5 | 6,
    raw: string,
    slugger: Marked.Slugger,
  ): string {
    const slug = slugger.slug(raw);
    return `<h${level} id="${slug}"><a class="anchor" aria-hidden="true" tabindex="-1" href="#${slug}"><svg class="octicon octicon-link" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"></path></svg></a>${text}</h${level}>`;
  }

  image(src: string, title: string | null, alt: string | null) {
    return `<img src="${src}" alt="${alt ?? ""}" title="${title ?? ""}" />`;
  }

  code(code: string, language?: string) {
    // a language of `ts, ignore` should really be `ts`
    // and it should be lowercase to ensure it has parity with regular github markdown
    language = language?.split(",")?.[0].toLocaleLowerCase();

    // transform math code blocks into HTML+MathML
    // https://github.blog/changelog/2022-06-28-fenced-block-syntax-for-mathematical-expressions/
    if (language === "math") {
      return katex.renderToString(code, { displayMode: true });
    }
    const grammar =
      language && Object.hasOwnProperty.call(Prism.languages, language)
        ? Prism.languages[language]
        : undefined;
    if (grammar === undefined) {
      return `<pre><code class="notranslate">${htmlEscape(code)}</code></pre>`;
    }
    const html = Prism.highlight(code, grammar, language!);
    return `<div class="highlight highlight-source-${language} notranslate"><pre>${html}</pre></div>`;
  }

  link(href: string, title: string, text: string) {
    if (href.startsWith("#")) {
      return `<a href="${href}" title="${title}">${text}</a>`;
    }
    if (this.options.baseUrl) {
      href = new URL(href, this.options.baseUrl).href;
    }
    return `<a href="${href}" title="${title}" rel="noopener noreferrer">${text}</a>`;
  }
}

/** Convert inline and block math to katex */
function mathify(markdown: string) {
  // Deal with block math
  const blockMath = /\$\$\s(.+?)\s\$\$/s;
  let match;
  while ((match = blockMath.exec(markdown)) !== null) {
    markdown = markdown.replace(
      blockMath,
      katex.renderToString(match[1].trim(), { displayMode: true }),
    );
  }

  // Deal with inline math
  const inlineMath = /\s\$(\S.+?\S)\$/;
  while ((match = inlineMath.exec(markdown)) !== null) {
    markdown = markdown.replace(
      inlineMath,
      " " + katex.renderToString(match[1], { displayMode: false }),
    );
  }

  return markdown;
}

export interface RenderOptions {
  baseUrl?: string;
  mediaBaseUrl?: string;
  allowIframes?: boolean;
  allowMath?: boolean;
  disableHtmlSanitization?: boolean;
}

export function render(markdown: string, opts: RenderOptions = {}): string {
  opts.mediaBaseUrl ??= opts.baseUrl;
  markdown = emojify(markdown);
  markdown = mathify(markdown);

  const html = Marked.marked.parse(markdown, {
    baseUrl: opts.baseUrl,
    gfm: true,
    renderer: new Renderer(),
  });

  if (opts.disableHtmlSanitization) {
    return html;
  }

  let allowedTags = sanitizeHtml.defaults.allowedTags.concat([
    "img",
    "video",
    "svg",
    "path",
    "circle",
    "figure",
    "figcaption",
    "del",
    "details",
    "summary",
  ]);
  if (opts.allowIframes) {
    allowedTags.push("iframe");
  }
  if (opts.allowMath) {
    allowedTags = allowedTags.concat([
      "math",
      "maction",
      "annotation",
      "annotation-xml",
      "menclose",
      "merror",
      "mfenced",
      "mfrac",
      "mi",
      "mmultiscripts",
      "mn",
      "mo",
      "mover",
      "mpadded",
      "mphantom",
      "mprescripts",
      "mroot",
      "mrow",
      "ms",
      "semantics",
      "mspace",
      "msqrt",
      "mstyle",
      "msub",
      "msup",
      "msubsup",
      "mtable",
      "mtd",
      "mtext",
      "mtr",
    ]);
  }

  function transformMedia(tagName: string, attribs: sanitizeHtml.Attributes) {
    if (opts.mediaBaseUrl && attribs.src) {
      try {
        attribs.src = new URL(attribs.src, opts.mediaBaseUrl).href;
      } catch {
        delete attribs.src;
      }
    }
    return { tagName, attribs };
  }

  return sanitizeHtml(html, {
    transformTags: {
      img: transformMedia,
      video: transformMedia,
    },
    allowedTags,
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "height", "width", "align"],
      video: [
        "src",
        "alt",
        "height",
        "width",
        "autoplay",
        "muted",
        "loop",
        "playsinline",
      ],
      a: ["id", "aria-hidden", "href", "tabindex", "rel", "target"],
      svg: ["viewbox", "width", "height", "aria-hidden", "background"],
      path: ["fill-rule", "d"],
      circle: ["cx", "cy", "r", "stroke", "stroke-width", "fill", "alpha"],
      span: opts.allowMath ? ["aria-hidden", "style"] : [],
      h1: ["id"],
      h2: ["id"],
      h3: ["id"],
      h4: ["id"],
      h5: ["id"],
      h6: ["id"],
      iframe: ["src", "width", "height"], // Only used when iframe tags are allowed in the first place.
      math: ["xmlns"], // Only enabled when math is enabled
      annotation: ["encoding"], // Only enabled when math is enabled
    },
    allowedClasses: {
      div: ["highlight", "highlight-source-*", "notranslate"],
      span: [
        "token",
        "keyword",
        "operator",
        "number",
        "boolean",
        "function",
        "string",
        "comment",
        "class-name",
        "regex",
        "regex-delimiter",
        "tag",
        "attr-name",
        "punctuation",
        "script-punctuation",
        "script",
        "plain-text",
        "property",
        "prefix",
        "line",
        "deleted",
        "inserted",
        ...(opts.allowMath ? KATEX_CLASSES : []),
      ],
      a: ["anchor"],
      svg: ["octicon", "octicon-link"],
    },
    allowProtocolRelative: false,
  });
}
