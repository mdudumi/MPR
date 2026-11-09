const allowedTags = new Set(['P', 'UL', 'OL', 'LI', 'STRONG', 'B', 'EM', 'I', 'BR'])

/** Converts stored editor HTML into a small, safe subset for the official report. */
export function sanitizeNarrative(value: unknown): string {
  const html = typeof value === 'object' && value && 'html' in value && typeof value.html === 'string' ? value.html : ''
  if (!html || typeof DOMParser === 'undefined') return ''
  const document = new DOMParser().parseFromString(html, 'text/html')
  const clean = (node: Node): void => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType !== Node.ELEMENT_NODE) continue
      const element = child as HTMLElement
      if (!allowedTags.has(element.tagName)) { child.replaceWith(...[...child.childNodes]); continue }
      for (const attribute of [...element.attributes]) element.removeAttribute(attribute.name)
      clean(element)
    }
  }
  clean(document.body)
  return document.body.innerHTML
}
