const ALLOWED_TAGS = new Set(["b", "strong", "i", "em", "u", "s", "ul", "ol", "li", "a", "br", "p"]);

/** Superset of ALLOWED_TAGS used only for the Custom HTML section type. */
const CUSTOM_HTML_ALLOWED_TAGS = new Set([
  "b", "strong", "i", "em", "u", "s", "ul", "ol", "li", "a", "br", "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "div",
  "span",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
  "hr",
  "blockquote",
  "code",
  "pre",
]);

function isSafeHref(href: string) {
  return /^(https?:|mailto:)/i.test(href.trim());
}

function isSafeImgSrc(src: string) {
  return /^https:/i.test(src.trim());
}

/**
 * Regex-based allow-list sanitizer for use in Node (no DOM available).
 * Not a full HTML parser — used as a defense-in-depth backstop alongside
 * sanitizeRichTextClient, which does real DOM-based sanitization in the browser.
 */
export function sanitizeRichTextServer(html: string, options?: { allowCustomHtmlTags?: boolean }): string {
  if (!html) return "";

  const allowedTags = options?.allowCustomHtmlTags ? CUSTOM_HTML_ALLOWED_TAGS : ALLOWED_TAGS;

  let out = html
    .replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^>]*)?)\/?>/g, (match, rawName: string, attrs: string) => {
    const tagName = rawName.toLowerCase();
    if (!allowedTags.has(tagName)) return "";

    const isClosing = match.startsWith("</");
    if (isClosing) return `</${tagName}>`;

    if (tagName === "a") {
      const hrefMatch = /href\s*=\s*"([^"]*)"|href\s*=\s*'([^']*)'/i.exec(attrs);
      const href = hrefMatch ? (hrefMatch[1] ?? hrefMatch[2] ?? "") : "";
      if (!isSafeHref(href)) return "<a>";
      return `<a href="${href.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">`;
    }

    if (tagName === "img") {
      const srcMatch = /src\s*=\s*"([^"]*)"|src\s*=\s*'([^']*)'/i.exec(attrs);
      const src = srcMatch ? (srcMatch[1] ?? srcMatch[2] ?? "") : "";
      if (!isSafeImgSrc(src)) return "";
      const altMatch = /alt\s*=\s*"([^"]*)"|alt\s*=\s*'([^']*)'/i.exec(attrs);
      const alt = altMatch ? (altMatch[1] ?? altMatch[2] ?? "") : "";
      return `<img src="${src.replace(/"/g, "&quot;")}" alt="${alt.replace(/"/g, "&quot;")}" />`;
    }

    return `<${tagName}>`;
  });

  return out.trim();
}

/**
 * DOM-based allow-list sanitizer for use in the browser. This is the primary
 * defense — sanitizeRichTextServer above is a regex-based backstop applied
 * again when the value is persisted.
 */
export function sanitizeRichTextClient(html: string, options?: { allowCustomHtmlTags?: boolean }): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return sanitizeRichTextServer(html, options);
  }

  const allowedTags = options?.allowCustomHtmlTags ? CUSTOM_HTML_ALLOWED_TAGS : ALLOWED_TAGS;
  const doc = new DOMParser().parseFromString(html, "text/html");
  sanitizeDomNode(doc.body, allowedTags);
  return doc.body.innerHTML;
}

function sanitizeDomNode(node: Node, allowedTags: Set<string>) {
  const children = Array.from(node.childNodes);

  for (const child of children) {
    if (child.nodeType === Node.COMMENT_NODE) {
      node.removeChild(child);
      continue;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) continue;

    const el = child as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    if (!allowedTags.has(tagName)) {
      while (el.firstChild) node.insertBefore(el.firstChild, el);
      node.removeChild(el);
      continue;
    }

    for (const attr of Array.from(el.attributes)) {
      if (tagName === "a" && attr.name === "href") continue;
      if (tagName === "img" && (attr.name === "src" || attr.name === "alt")) continue;
      el.removeAttribute(attr.name);
    }

    if (tagName === "a") {
      const href = el.getAttribute("href") ?? "";
      if (!isSafeHref(href)) {
        el.removeAttribute("href");
      } else {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      }
    }

    if (tagName === "img") {
      const src = el.getAttribute("src") ?? "";
      if (!isSafeImgSrc(src)) {
        el.remove();
        continue;
      }
    }

    sanitizeDomNode(el, allowedTags);
  }
}

export function stripHtmlToText(html: string): string {
  return html
    .replace(/<(ul|ol|li|p|br)[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
