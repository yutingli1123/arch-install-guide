import type { Context, Locale, Localized } from '../types'
import * as en from './en'
import * as neutral from './neutral'
import * as zh from './zh'

/** A prose entry is a plain string, or a function when it interpolates the configuration. */
export type Prose = string | ((ctx: Context, t: (key: string) => string) => string)

export type ProseKey = keyof typeof en.prose

/** Locales other than `en` may leave an entry out; it then falls back to the English one. */
export type ProseCatalog = Partial<Record<ProseKey, Prose>>

/** The English tables define the translatable keys; every other locale fills in what it renders. */
export type UiCatalog = Partial<typeof en.ui>
export type ChoiceCatalog = { [K in keyof typeof en.choices]?: Partial<(typeof en.choices)[K]> }
export type DescriptionCatalog = {
  [K in keyof typeof en.choiceDescriptions]?: Partial<(typeof en.choiceDescriptions)[K]>
}

const catalogs: Record<Locale, ProseCatalog> = { zh: zh.prose, en: en.prose }

export function prose(key: ProseKey, locale: Locale, ctx: Context): string {
  const entry: Prose | undefined = catalogs[locale]?.[key] ?? en.prose[key]
  // Keys resolved through `t` are plain strings, so a typo has to fail here.
  if (entry === undefined) throw new Error(`missing prose: ${key}`)
  return typeof entry === 'function'
    ? entry(ctx, (other) => prose(other as ProseKey, locale, ctx))
    : entry
}

export function pick<T>(value: Localized<T>, locale: Locale): T {
  return value[locale] ?? value.en
}

export { localeNames } from './neutral'

const LOCALES = Object.keys(neutral.localeNames) as Locale[]

type Table = Record<string, unknown>
type Groups = Record<string, Record<string, string>>

/** A neutral entry answers with the same text whichever locale asks for it. */
function everyLocale<T>(value: T): Localized<T> {
  return Object.fromEntries(LOCALES.map((locale) => [locale, value])) as Localized<T>
}

type Merged<N extends Table, T extends Table> = { [K in keyof N]: Localized<N[K]> } & {
  [K in keyof T]: Localized<T[K]>
}

/** Joins the neutral entries with the translated ones, so one lookup covers both. */
function table<N extends Table, T extends Table>(
  untranslated: N,
  base: T,
  ...translations: [Locale, Partial<T>][]
): Merged<N, T> {
  const merged: Table = {}
  for (const [key, value] of Object.entries(untranslated)) merged[key] = everyLocale(value)
  for (const [key, value] of Object.entries(base)) {
    merged[key] = Object.fromEntries([
      ['en', value],
      ...translations.map(([locale, entries]) => [locale, (entries as Table)[key]]),
    ])
  }
  return merged as Merged<N, T>
}

type MergedGroups<N extends Groups, T extends Groups> = {
  [K in keyof N | keyof T]: {
    [V in
      | (K extends keyof N ? keyof N[K] : never)
      | (K extends keyof T ? keyof T[K] : never)]: Localized<string>
  }
}

function groups<N extends Groups, T extends Groups>(
  untranslated: N,
  base: T,
  ...translations: [Locale, { [K in keyof T]?: Partial<T[K]> }][]
): MergedGroups<N, T> {
  const categories = new Set([...Object.keys(untranslated), ...Object.keys(base)])
  const merged = Object.fromEntries(
    [...categories].map((category) => [
      category,
      table(
        untranslated[category] ?? {},
        base[category] ?? {},
        ...translations.map(([locale, entries]): [Locale, Record<string, string>] => [
          locale,
          (entries as Groups)[category] ?? {},
        ]),
      ),
    ]),
  )
  return merged as MergedGroups<N, T>
}

export const ui = table(neutral.ui, en.ui, ['zh', zh.ui])
export const choices = groups(neutral.choices, en.choices, ['zh', zh.choices])
export const choiceDescriptions = groups({}, en.choiceDescriptions, ['zh', zh.choiceDescriptions])
