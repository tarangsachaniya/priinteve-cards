const ALLOWED_TAGS = new Set(["b", "strong", "i", "em", "u", "s", "ul", "ol", "li", "a", "br", "p"]);

function isSafeHref(href: string) {
  return /^(https?:|mailto:)/i.test(href.trim());
}

/**
 * Regex-based allow-list sanitizer for use in Node (no DOM available).
 * Not a full HTML parser — used as a defense-in-depth backstop alongside
 * sanitizeRichTextClient, which does real DOM-based sanitization in the browser.
 */
export function sanitizeRichTextServer(html: string): string {
  if (!html) return "";

  let out = html
    .replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^>]*)?)\/?>/g, (match, rawName: string, attrs: string) => {
    const tagName = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(tagName)) return "";

    const isClosing = match.startsWith("</");
    if (isClosing) return `</${tagName}>`;

    if (tagName === "a") {
      const hrefMatch = /href\s*=\s*"([^"]*)"|href\s*=\s*'([^']*)'/i.exec(attrs);
      const href = hrefMatch ? (hrefMatch[1] ?? hrefMatch[2] ?? "") : "";
      if (!isSafeHref(href)) return "<a>";
      return `<a href="${href.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">`;
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
export function sanitizeRichTextClient(html: string): string {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return sanitizeRichTextServer(html);
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  sanitizeDomNode(doc.body);
  return doc.body.innerHTML;
}

function sanitizeDomNode(node: Node) {
  const children = Array.from(node.childNodes);

  for (const child of children) {
    if (child.nodeType === Node.COMMENT_NODE) {
      node.removeChild(child);
      continue;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) continue;

    const el = child as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tagName)) {
      while (el.firstChild) node.insertBefore(el.firstChild, el);
      node.removeChild(el);
      continue;
    }

    for (const attr of Array.from(el.attributes)) {
      if (tagName === "a" && attr.name === "href") continue;
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

    sanitizeDomNode(el);
  }
}

export function stripHtmlToText(html: string): string {
  return html
    .replace(/<(ul|ol|li|p|br)[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
