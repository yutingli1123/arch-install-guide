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
    const lines = code
      .split('\n')
      .map(
        (line, index) =>
          `<span class="cmd-line">` +
          `<span class="cmd-line-number" aria-hidden="true">${index + 1}</span>` +
          `<span class="cmd-line-text">${md.utils.escapeHtml(line)}</span>` +
          `</span>`,
      )
      .join('')
    return (
      `<div class="cmd">` +
      `<pre><code>${lines}</code></pre>` +
      `<button class="cmd-copy" type="button" data-copy="${escaped}">${copyLabel}</button>` +
      `</div>`
    )
  }

  return md
}
