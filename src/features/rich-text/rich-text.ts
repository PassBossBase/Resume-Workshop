const allowedTags = new Set([
  "P",
  "BR",
  "STRONG",
  "B",
  "U",
  "EM",
  "S",
  "UL",
  "OL",
  "LI",
  "A",
  "SPAN",
]);

const allowedStyleProperties = new Set([
  "color",
  "text-align",
  "text-indent",
]);

const dangerousLinkProtocolPattern = /^(javascript|data|vbscript):/i;

/** 转义 HTML 特殊字符 */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** 清洗 HTML：白名单标签、样式、链接，规范化后存入数据库 */
export function normalizeRichText(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "<p></p>";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return sanitizeRichText(trimmed);
  return trimmed
    .split(/\r?\n/)
    .map((line) => `<p>${escapeHtml(line) || "<br>"}</p>`)
    .join("");
}

/** 渲染前再次消毒富文本，移除未授权标签 */
export function sanitizeRichText(value: string): string {
  if (typeof DOMParser === "undefined") {
    return value
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
      .replace(/\son\w+=(?:"[^"]*"|'[^']*')/gi, "")
      .replace(
        /\shref=(?:"\s*(javascript|data|vbscript):[^"]*"|'\s*(javascript|data|vbscript):[^']*'|\s*(javascript|data|vbscript):[^\s>]*)/gi,
        "",
      );
  }

  const documentValue = new DOMParser().parseFromString(value, "text/html");
  sanitizeChildren(documentValue.body);
  return documentValue.body.innerHTML;
}

function sanitizeChildren(parent: ParentNode): void {
  Array.from(parent.childNodes).forEach((node) => {
    if (node.nodeType !== 1) return;
    const element = node as HTMLElement;
    sanitizeChildren(element);

    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      if (attribute.name === "style") return;
      if (element.tagName === "A" && attribute.name === "href") return;
      element.removeAttribute(attribute.name);
    });

    if (element.tagName === "A") {
      const href = element.getAttribute("href") ?? "";
      if (!isSafeRichTextHref(href)) {
        element.removeAttribute("href");
      } else {
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noopener noreferrer");
      }
    }

    const styles = (element.getAttribute("style") ?? "")
      .split(";")
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .map((declaration) => {
        const [property, ...valueParts] = declaration.split(":");
        const normalizedProperty = property.trim().toLowerCase();
        const normalizedValue = valueParts.join(":").trim();
        if (!allowedStyleProperties.has(normalizedProperty)) return "";
        if (
          normalizedProperty === "color" &&
          !/^(#[0-9a-f]{3,8}|rgb(a)?\([\d\s,.%]+\)|[a-z]+)$/i.test(
            normalizedValue,
          )
        ) {
          return "";
        }
        if (
          normalizedProperty === "text-align" &&
          !/^(left|center|right|justify)$/.test(normalizedValue)
        ) {
          return "";
        }
        if (
          normalizedProperty === "text-indent" &&
          !/^-?\d+(\.\d+)?(em|px|ch)$/.test(normalizedValue)
        ) {
          return "";
        }
        return `${normalizedProperty}: ${normalizedValue}`;
      })
      .filter(Boolean);

    if (styles.length) {
      element.setAttribute("style", styles.join("; "));
    } else {
      element.removeAttribute("style");
    }
  });
}

function isSafeRichTextHref(value: string): boolean {
  const compactHref = value.trim().replace(/[\u0000-\u0020]+/g, "");
  return Boolean(compactHref) && !dangerousLinkProtocolPattern.test(compactHref);
}

/** 富文本转纯文本，用于分页高度估算 */
export function richTextToPlainText(value: string): string {
  const normalized = normalizeRichText(value);
  if (typeof DOMParser === "undefined") {
    return normalized
      .replace(/<\/(p|li)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{2,}/g, "\n")
      .trim();
  }
  const documentValue = new DOMParser().parseFromString(normalized, "text/html");
  return Array.from(
    documentValue.body.querySelectorAll("p, li"),
    (element) => element.textContent?.trim() ?? "",
  )
    .filter(Boolean)
    .join("\n");
}
