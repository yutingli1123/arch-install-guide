import type { Block, Localized } from './types'

/** Prose, one translation per locale. Markdown, without fenced blocks. */
export function text(zh: string, en?: string): Block {
  return { prose: (en === undefined ? { zh } : { zh, en }) as Localized<string> }
}

/** A command block. Shared by every locale, so translations cannot make it drift. */
export function cmd(command: string, lang?: string): Block {
  return { cmd: command, lang }
}
