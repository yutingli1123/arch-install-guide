import type { Context, Locale } from '../types'
import { en } from './en'
import { zh } from './zh'

/** A prose entry is a plain string, or a function when it interpolates the configuration. */
export type Prose = string | ((ctx: Context, t: (key: string) => string) => string)

export type ProseKey = keyof typeof zh

/** Locales other than `zh` may leave an entry out; it then falls back to the Chinese one. */
export type ProseCatalog = Partial<Record<ProseKey, Prose>>

const catalogs: Record<Locale, ProseCatalog> = { zh, en }

export function prose(key: ProseKey, locale: Locale, ctx: Context): string {
  const entry: Prose | undefined = catalogs[locale]?.[key] ?? zh[key]
  // Keys resolved through `t` are plain strings, so a typo has to fail here.
  if (entry === undefined) throw new Error(`missing prose: ${key}`)
  return typeof entry === 'function' ? entry(ctx, (other) => prose(other as ProseKey, locale, ctx)) : entry
}
