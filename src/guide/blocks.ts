import type { ProseKey } from './i18n'
import type { Block } from './types'

/** Prose, looked up in the per-locale catalogs. */
export function text(key: ProseKey): Block {
  return { key }
}

/** A command block. Shared by every locale, so translations cannot make it drift. */
export function cmd(command: string, lang?: string): Block {
  return { cmd: command, lang }
}
