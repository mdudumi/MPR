const allowedTags = new Set(['P', 'UL', 'OL', 'LI', 'STRONG', 'B', 'EM', 'I', 'BR'])

/** Converts editor lines into the bullet layout used by the report. */
export function normalizeNarrativeHtml(html: string): string {
  if (!html || typeof DOMParser === 'undefined') return html
  const document = new DOMParser().parseFromString(html, 'text/html')
  if (document.body.querySelector('ul,ol')) return document.body.innerHTML
  const lines = Array.from(document.body.querySelectorAll('p,div')).map(node => (node.textContent ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean)
  const fallback = lines.length ? lines : (document.body.textContent ?? '').split(/\n+/).map(line => line.trim()).filter(Boolean)
  if (!fallback.length) return ''
  const list = document.createElement('ul')
  fallback.forEach(line => { const item = document.createElement('li'); item.textContent = line; list.appendChild(item) })
  return list.outerHTML
}

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
  return normalizeNarrativeHtml(document.body.innerHTML)
}
