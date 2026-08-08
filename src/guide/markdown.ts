import MarkdownIt from 'markdown-it'

/**
 * Renders fenced blocks as command blocks carrying their own text in `data-copy`,
 * so a single delegated handler can copy them without per-block components.
 */
export function createMarkdown(copyLabel: string) {
  const md = new MarkdownIt({ html: false, linkify: true })

  md.renderer.rules.fence = (tokens, idx) => {
    const code = (tokens[idx]?.content ?? '').replace(/\n+$/, '')
    const escaped = md.utils.escapeHtml(code)
    return (
      `<div class="cmd">` +
      `<pre><code>${escaped}</code></pre>` +
      `<button class="cmd-copy" type="button" data-copy="${escaped}">${copyLabel}</button>` +
      `</div>`
    )
  }

  return md
}
