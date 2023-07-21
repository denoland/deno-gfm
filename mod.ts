import {
  emojify,
  gfmHeadingId,
  htmlEscape,
  katex,
  mangle,
  Marked,
  Prism,
  sanitizeHtml,
} from "./deps.ts";
import { CSS, KATEX_CLASSES, KATEX_CSS } from "./style.js";
export { CSS, KATEX_CSS, Marked };

Marked.marked.use(mangle());
Marked.marked.use(gfmHeadingId());

class Renderer extends Marked.Renderer {
  allowMath: boolean;
  customClasses: Partial<customClasses>;

  constructor(options: Marked.marked.MarkedOptions & RenderOptions = {}) {
    super(options);
    this.allowMath = options.allowMath ?? false;
    this.customClasses = options.customClasses ?? {};
  }

  heading(
    text: string,
    level: 1 | 2 | 3 | 4 | 5 | 6,
    raw: string,
    slugger: Marked.Slugger,
  ): string {
    const slug = slugger.slug(raw);
    return `<h${level} ${customClass(this.customClasses.heading)} id="${slug}"><a class="anchor" aria-hidden="true" tabindex="-1" href="#${slug}"><svg class="octicon octicon-link" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"></path></svg></a>${text}</h${level}>`;
  }

  image(src: string, title: string | null, alt: string | null) {
    return `<img ${customClass(this.customClasses.image)} src="${src}" alt="${alt ?? ''}" title="${title ?? ''}" />`;
  }

  code(code: string, language?: string) {
    // a language of `ts, ignore` should really be `ts`
    // and it should be lowercase to ensure it has parity with regular github markdown
    language = language?.split(",")?.[0].toLocaleLowerCase();

    // transform math code blocks into HTML+MathML
    // https://github.blog/changelog/2022-06-28-fenced-block-syntax-for-mathematical-expressions/
    if (language === "math" && this.allowMath) {
      return katex.renderToString(code, { displayMode: true });
    }
    const grammar =
      language && Object.hasOwnProperty.call(Prism.languages, language)
        ? Prism.languages[language]
        : undefined;
    if (grammar === undefined) {
      return `<pre><code ${customClass(this.customClasses.image, 'notranslate')}>${htmlEscape(
        code
      )}</code></pre>`;
    }
    const html = Prism.highlight(code, grammar, language!);
    return `<div ${customClass(this.customClasses.image, 'highlight', `highlight-source-${language}`, 'notranslate')}><pre>${html}</pre></div>`;
  }

  link(href: string, title: string | null, text: string) {
    const titleAttr = title ? ` title="${title}"` : "";
    if (href.startsWith("#")) {
      return `<a href="${href}"${titleAttr}>${text}</a>`;
    }
    if (this.options.baseUrl) {
      try {
        href = new URL(href, this.options.baseUrl).href;
      } catch (_) {
        //
      }
    }
    return `<a ${customClass(this.customClasses.link)} href="${href}"${titleAttr} rel="noopener noreferrer">${text}</a>`;
  }

  blockquote(quote: string) {
    return `<blockquote ${customClass(this.customClasses.blockquote)}>\n${quote}</blockquote>\n`;
  }

  hr() {
    return this.options.xhtml ? `<hr ${customClass(this.customClasses.hr)} />\n` : `<hr ${customClass(this.customClasses.hr)}>\n`;
  }

  list(body: string, ordered: boolean, start: number) {
    const type = ordered ? 'ol' : 'ul',
      startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';
    return '<' + type + startatt + customClass(this.customClasses.list) + '>\n' + body + '</' + type + '>\n';
  }


  listitem(text: string) {
    return `<li ${customClass(this.customClasses.listitem)}>${text}</li>\n`;
  }

  checkbox(checked: boolean) {
    return `<input ${customClass(this.customClasses.checkbox)}`
      + (checked ? 'checked="" ' : '')
      + 'disabled="" type="checkbox"'
      + (this.options.xhtml ? ' /' : '')
      + '> ';
  }

  paragraph(text:string) {
    return `<p ${customClass(this.customClasses.paragraph)}>${text}</p>\n`;
  }

  table(header: string, body: string) {
    if (body) body = `<tbody>${body}</tbody>`;

    return '<table'+ customClass(this.customClasses.table) +'>\n'
      + '<thead>\n'
      + header
      + '</thead>\n'
      + body
      + '</table>\n';
  }

  tablerow(content: string) {
    return `<tr ${customClass(this.customClasses.tablerow)}>\n${content}</tr>\n`;
  }

  tablecell(content: string, flags: any) {
    const className = customClass(this.customClasses.tablecell);
    const type = flags.header ? 'th' : 'td';
    const tag = flags.align
      ? `<${type} ${className} align="${flags.align}">`
      : `<${type} ${className}>`;
    return tag + content + `</${type}>\n`;
  }

  strong(text: string) {
    return `<strong ${customClass(this.customClasses.strong)}>${text}</strong>`;
  }

  em(text: string) {
    return `<em ${customClass(this.customClasses.em)}>${text}</em>`;
  }

  codespan(text: string) {
    return `<code ${customClass(this.customClasses.codespan)}>${text}</code>`;
  }

  del(text: string) {
    return `<del ${customClass(this.customClasses.del)}>${text}</del>`;
  }
}

/** Convert inline and block math to katex */
function mathify(markdown: string) {
  // Deal with block math
  markdown = markdown.replace(/\$\$\s(.+?)\s\$\$/g, (match, p1) => {
    try {
      return katex.renderToString(p1.trim(), { displayMode: true });
    } catch (e) {
      console.warn(e);
      // Don't replace the math if there's an error
      return match;
    }
  });

  // Deal with inline math
  markdown = markdown.replace(/\s\$((?=\S).*?(?=\S))\$/g, (match, p1) => {
    try {
      return " " + katex.renderToString(p1, { displayMode: false });
    } catch (e) {
      console.warn(e);
      // Don't replace the math if there's an error
      return match;
    }
  });

  return markdown;
}

const customClass = (classStr?: string[], ...staticClasses: string[]) =>
  classStr ? ` class="${classStr.concat(staticClasses).join(' ')}" ` : '';

export interface RenderOptions {
  baseUrl?: string;
  mediaBaseUrl?: string;
  inline?: boolean;
  allowIframes?: boolean;
  allowMath?: boolean;
  disableHtmlSanitization?: boolean;
  customClasses?: Partial<customClasses>;
}

interface customClasses {
  // Block
  code: string[];
  blockquote: string[];
  heading: string[];
  hr: string[];
  list: string[];
  listitem: string[];
  checkbox: string[];
  paragraph: string[];
  table: string[];
  tablerow: string[];
  tablecell: string[];
  // Inline
  strong: string[];
  em: string[];
  codespan: string[];
  del: string[];
  link: string[];
  image: string[];
}

export function render(this: any, markdown: string, opts: RenderOptions = {}): string {
  opts.mediaBaseUrl ??= opts.baseUrl;
  markdown = emojify(markdown);
  if (opts.allowMath) {
    markdown = mathify(markdown);
  }

  const marked_opts = {
    baseUrl: opts.baseUrl,
    gfm: true,
    renderer: new Renderer(opts),
  };

  const html = opts.inline
    ? Marked.marked.parseInline(markdown, marked_opts)
    : Marked.marked.parse(markdown, marked_opts);

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
    allowedTags.push('iframe');
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

  const allCustomClasses = [];
  if (opts.customClasses) {
    for (const [_key, value] of Object.entries(opts.customClasses)) {
      allCustomClasses.push(...(value as string[]));
    }
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
        "poster",
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
      '*': allCustomClasses,
    },
    allowProtocolRelative: false,
  });
}
