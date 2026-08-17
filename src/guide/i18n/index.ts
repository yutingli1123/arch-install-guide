import type { Context, Locale, Localized } from '../types'
import * as en from './en'
import * as zh from './zh'

/** A prose entry is a plain string, or a function when it interpolates the configuration. */
export type Prose = string | ((ctx: Context, t: (key: string) => string) => string)

export type ProseKey = keyof typeof zh.prose

/** Locales other than `zh` may leave an entry out; it then falls back to the Chinese one. */
export type ProseCatalog = Partial<Record<ProseKey, Prose>>

/** The Chinese tables define the shape; every other locale fills in what it translates. */
export type UiCatalog = Partial<typeof zh.ui>
export type ChoiceCatalog = { [K in keyof typeof zh.choices]?: Partial<(typeof zh.choices)[K]> }
export type DescriptionCatalog = {
  [K in keyof typeof zh.choiceDescriptions]?: Partial<(typeof zh.choiceDescriptions)[K]>
}

const catalogs: Record<Locale, ProseCatalog> = { zh: zh.prose, en: en.prose }

export function prose(key: ProseKey, locale: Locale, ctx: Context): string {
  const entry: Prose | undefined = catalogs[locale]?.[key] ?? zh.prose[key]
  // Keys resolved through `t` are plain strings, so a typo has to fail here.
  if (entry === undefined) throw new Error(`missing prose: ${key}`)
  return typeof entry === 'function'
    ? entry(ctx, (other) => prose(other as ProseKey, locale, ctx))
    : entry
}

export function pick<T>(value: Localized<T>, locale: Locale): T {
  return value[locale] ?? value.zh
}

/** Pairs each Chinese entry with its translations, so one lookup covers every locale. */
function merge<T extends Record<string, unknown>>(
  base: T,
  ...translations: [Locale, Partial<T>][]
): { [K in keyof T]: Localized<T[K]> } {
  const merged = Object.fromEntries(
    Object.entries(base).map(([key, value]) => [
      key,
      Object.fromEntries([
        ['zh', value],
        ...translations.map(([locale, table]) => [locale, table[key]]),
      ]),
    ]),
  )
  return merged as { [K in keyof T]: Localized<T[K]> }
}

function mergeGroups<T extends Record<string, Record<string, string>>>(
  base: T,
  ...translations: [Locale, { [K in keyof T]?: Partial<T[K]> }][]
): { [K in keyof T]: { [V in keyof T[K]]: Localized<string> } } {
  const merged = Object.fromEntries(
    Object.entries(base).map(([group, entries]) => [
      group,
      merge(
        entries,
        ...translations.map(([locale, table]): [Locale, Partial<typeof entries>] => [
          locale,
          table[group] ?? {},
        ]),
      ),
    ]),
  )
  return merged as { [K in keyof T]: { [V in keyof T[K]]: Localized<string> } }
}

export const ui = merge(zh.ui, ['en', en.ui])
export const choices = mergeGroups(zh.choices, ['en', en.choices])
export const choiceDescriptions = mergeGroups(zh.choiceDescriptions, ['en', en.choiceDescriptions])

/** Written the way each language names itself, so it reads the same whatever the interface is set to. */
export const localeNames: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
}
