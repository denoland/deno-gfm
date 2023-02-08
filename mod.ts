import {
  emojify,
  htmlEscape,
  katex,
  Marked,
  Prism,
  sanitizeHtml,
} from "./deps.ts";
import { CSS, KATEX_CSS } from "./style.js";
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
      return katex.renderToString(code);
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

export interface RenderOptions {
  baseUrl?: string;
  mediaBaseUrl?: string;
  allowIframes?: boolean;
  disableHtmlSanitization?: boolean;
}

export function render(markdown: string, opts: RenderOptions = {}): string {
  opts.mediaBaseUrl ??= opts.baseUrl;
  markdown = emojify(markdown);

  const html = Marked.marked(markdown, {
    baseUrl: opts.baseUrl,
    gfm: true,
    renderer: new Renderer(),
  });

  if (opts.disableHtmlSanitization) {
    return html;
  }

  const allowedTags = sanitizeHtml.defaults.allowedTags.concat([
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
  if (opts.allowIframes) {
    allowedTags.push("iframe");
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
      span: ["aria-hidden", "style"],
      h1: ["id"],
      h2: ["id"],
      h3: ["id"],
      h4: ["id"],
      h5: ["id"],
      h6: ["id"],
      iframe: ["src", "width", "height"], // Only used when iframe tags are allowed in the first place.
      math: ["xmlns"],
      annotation: ["encoding"],
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
        "03889em",
        "049em",
        "04em",
        "05714286em",
        "07333333em",
        "074em",
        "08em",
        "1",
        "11111111em",
        "11em",
        "125em",
        "12em",
        "14285714em",
        "14666667em",
        "148em",
        "16",
        "16666667em",
        "16em",
        "19961427em",
        "2",
        "20023148em",
        "20096463em",
        "21em",
        "24108004em",
        "24115756em",
        "25em",
        "27777778em",
        "27778em",
        "28135048em",
        "28571429em",
        "28929605em",
        "28935185em",
        "2em",
        "30444444em",
        "32154341em",
        "33333333em",
        "33751205em",
        "34722222em",
        "36173633em",
        "38572806em",
        "3em",
        "4",
        "40192926em",
        "40509259em",
        "41666667em",
        "42857143em",
        "43394407em",
        "43981481em",
        "44027778em",
        "44em",
        "45666667em",
        "456em",
        "46296296em",
        "46857143em",
        "48216008em",
        "48231511em",
        "48611111em",
        "488em",
        "4em",
        "52083333em",
        "55428571em",
        "55555556em",
        "55556em",
        "57859209em",
        "5787037em",
        "57877814em",
        "58333333em",
        "5925em",
        "5em",
        "625em",
        "66666667em",
        "69431051em",
        "69444444em",
        "69453376em",
        "6em",
        "71428571em",
        "72777778em",
        "72833333em",
        "728em",
        "75em",
        "76444444em",
        "77777778em",
        "7em",
        "83317261em",
        "83333333em",
        "83360129em",
        "85714286em",
        "875em",
        "88888889em",
        "88em",
        "8em",
        "92em",
        "96285714em",
        "976em",
        "9em",
        "accent",
        "accent-body",
        "accent-full",
        "amsrm",
        "angl",
        "anglpad",
        "arraycolsep",
        "base",
        "boldsymbol",
        "boxpad",
        "brace-center",
        "brace-left",
        "brace-right",
        "cancel-lap",
        "cancel-pad",
        "cd-arrow-pad",
        "cd-label-left",
        "cd-label-right",
        "cd-vert-arrow",
        "clap",
        "col-align-c",
        "col-align-l",
        "col-align-r",
        "delim-size1",
        "delim-size4",
        "delimcenter",
        "delimsizing",
        "eqn-num",
        "fbox",
        "fcolorbox",
        "fix",
        "fleqn",
        "fontsize-ensurer",
        "frac-line",
        "halfarrow-left",
        "halfarrow-right",
        "hbox",
        "hdashline",
        "hide-tail",
        "hline",
        "inner",
        "katex",
        "katex-display",
        "katex-html",
        "katex-mathml",
        "katex-version",
        "large-op",
        "leqno",
        "llap",
        "mainrm",
        "mathbb",
        "mathbf",
        "mathboldsf",
        "mathcal",
        "mathfrak",
        "mathit",
        "mathitsf",
        "mathnormal",
        "mathrm",
        "mathscr",
        "mathsf",
        "mathtt",
        "mfrac",
        "mml-eqn-num",
        "mover",
        "mspace",
        "msupsub",
        "mtable",
        "mtr-glue",
        "mult",
        "munder",
        "newline",
        "nulldelimiter",
        "op-limits",
        "op-symbol",
        "overlay",
        "overline",
        "overline-line",
        "pstrut",
        "reset-size1",
        "reset-size10",
        "reset-size11",
        "reset-size2",
        "reset-size3",
        "reset-size4",
        "reset-size5",
        "reset-size6",
        "reset-size7",
        "reset-size8",
        "reset-size9",
        "rlap",
        "root",
        "rule",
        "size1",
        "size10",
        "size11",
        "size2",
        "size3",
        "size4",
        "size5",
        "size6",
        "size7",
        "size8",
        "size9",
        "sizing",
        "small-op",
        "sout",
        "sqrt",
        "stretchy",
        "strut",
        "svg-align",
        "tag",
        "textbb",
        "textbf",
        "textboldsf",
        "textfrak",
        "textit",
        "textitsf",
        "textrm",
        "textscr",
        "textsf",
        "texttt",
        "thinbox",
        "ttf",
        "underline",
        "underline-line",
        "vbox",
        "vertical-separator",
        "vlist",
        "vlist-r",
        "vlist-s",
        "vlist-t",
        "vlist-t2",
        "x-arrow",
        "x-arrow-pad",
      ],
      a: ["anchor"],
      svg: ["octicon", "octicon-link"],
    },
    allowProtocolRelative: false,
  });
}
