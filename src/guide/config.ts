import type { Config, ConfigDraft } from './types'

export type ConfigChoice =
  | 'swap.zram'
  | 'swap.swapfile'
  | 'swap.partition'
  | 'encryption.password'
  | 'encryption.tpm2-pin'
  | 'secureBoot.custom-db'
  | 'secureBoot.shim-mok'
  | 'snapper.root'
  | 'snapper.root-home'
  | 'desktop.gnome'
  | 'desktop.kde'
  | 'desktop.hyprland'

export type Availability = Partial<Record<ConfigChoice, string>>

const intl = Intl as typeof Intl & { supportedValuesOf?: (key: 'timeZone') => string[] }
export const TIMEZONES = [
  ...new Set([
    'UTC',
    ...(intl.supportedValuesOf?.('timeZone') ?? [
      'America/Toronto',
      'America/New_York',
      'Europe/London',
      'Europe/Berlin',
      'Asia/Shanghai',
      'Asia/Tokyo',
      'Australia/Sydney',
    ]),
  ]),
]

export const SYSTEM_LOCALES = [
  'en_US.UTF-8',
  'en_GB.UTF-8',
  'en_CA.UTF-8',
  'zh_CN.UTF-8',
  'zh_TW.UTF-8',
  'de_DE.UTF-8',
  'fr_FR.UTF-8',
  'es_ES.UTF-8',
  'it_IT.UTF-8',
  'ja_JP.UTF-8',
  'ko_KR.UTF-8',
  'ru_RU.UTF-8',
] as const

export const KEYMAPS = ['us', 'uk', 'de-latin1', 'fr-latin9', 'es', 'it', 'jp106', 'ru'] as const

/**
 * A complete fixture for the stage-one guide and its tests. The setup wizard
 * does not use these values as defaults.
 */
export const stageOneConfig: Config = {
  disk: '/dev/nvme0n1',
  cpu: 'intel',
  espSize: '1G',
  swap: 'none',
  subvolumeLayout: 'separated',
  mountOptions: ['compress=zstd', 'noatime'],
  timezone: 'America/Toronto',
  systemLocale: 'en_US.UTF-8',
  keymap: 'us',
  hostname: 'archlinux',
  username: 'user',
  encryption: { mode: 'none' },
  secureBoot: 'none',
  snapper: 'none',
  desktop: 'none',
}

/** Stamped into the rendered guide so a printed copy carries its own expiry. */
export const VERIFIED_AGAINST = '2026-08'

const NOT_IMPLEMENTED = '对应安装步骤尚未提供'

/** Returns the choices that the current guide cannot safely generate. */
export function validate(config: ConfigDraft): Availability {
  const snapperReason =
    config.subvolumeLayout === 'root-only' ? '需要标准分离子卷布局' : NOT_IMPLEMENTED

  return {
    'swap.zram': NOT_IMPLEMENTED,
    'swap.swapfile': NOT_IMPLEMENTED,
    'swap.partition': NOT_IMPLEMENTED,
    'encryption.password': NOT_IMPLEMENTED,
    'encryption.tpm2-pin': NOT_IMPLEMENTED,
    'secureBoot.custom-db': NOT_IMPLEMENTED,
    'secureBoot.shim-mok': NOT_IMPLEMENTED,
    'snapper.root': snapperReason,
    'snapper.root-home': snapperReason,
    'desktop.gnome': NOT_IMPLEMENTED,
    'desktop.kde': NOT_IMPLEMENTED,
    'desktop.hyprland': NOT_IMPLEMENTED,
  }
}

const SAFE = {
  disk: /^\/dev\/(?:nvme\d+n\d+|mmcblk\d+|loop\d+|md\d+|(?:sd|vd|xvd|hd)[a-z]+)$/,
  hostname: /^[A-Za-z0-9](?:[A-Za-z0-9.-]{0,251}[A-Za-z0-9])?$/,
  username: /^(?!root$)[a-z_][a-z0-9_-]{0,31}$/,
}

/** Reads only options whose guide steps are implemented. Unknown or unsafe values are ignored. */
export function parseDraft(search: string): ConfigDraft {
  const outer = new URLSearchParams(search)
  const compact = outer.get('c')
  const legacy = outer.get('config')
  const params =
    compact !== null
      ? decodeCompactConfig(compact)
      : legacy !== null
        ? decodeLegacyConfig(legacy)
        : new URLSearchParams()
  const draft: ConfigDraft = {}
  if (!params) return draft
  const disk = safeValue(params.get('disk'), SAFE.disk)
  const cpu = listedValue(params.get('cpu'), ['intel', 'amd'] as const)
  const swap = listedValue(params.get('swap'), ['none'] as const)
  const subvolumeLayout = listedValue(params.get('layout'), ['root-only', 'separated'] as const)
  const encryption = listedValue(params.get('encryption'), ['none'] as const)
  const secureBoot = listedValue(params.get('secureBoot'), ['none'] as const)
  const snapper = listedValue(params.get('snapper'), ['none'] as const)
  const desktop = listedValue(params.get('desktop'), ['none'] as const)
  const timezone = listedValue(params.get('timezone'), TIMEZONES)
  const systemLocale = listedValue(params.get('locale'), SYSTEM_LOCALES)
  const keymap = listedValue(params.get('keymap'), KEYMAPS)
  const hostname = safeValue(params.get('hostname'), SAFE.hostname)
  const username = safeValue(params.get('user'), SAFE.username)

  if (disk) draft.disk = disk
  if (cpu) draft.cpu = cpu
  if (swap) draft.swap = swap
  if (subvolumeLayout) draft.subvolumeLayout = subvolumeLayout
  if (encryption) draft.encryption = { mode: encryption }
  if (secureBoot) draft.secureBoot = secureBoot
  if (snapper) draft.snapper = snapper
  if (desktop) draft.desktop = desktop
  if (timezone) draft.timezone = timezone
  if (systemLocale) draft.systemLocale = systemLocale
  if (keymap) draft.keymap = keymap
  if (hostname) draft.hostname = hostname
  if (username) draft.username = username
  if (draft.subvolumeLayout === 'root-only') delete draft.snapper
  return draft
}

/** Writes only choices the user has actually made. */
export function serializeDraft(draft: ConfigDraft): string {
  const encoded = encodeCompactConfig(draft)
  if (!encoded) return ''

  const params = new URLSearchParams()
  params.set('c', encoded)
  return params.toString()
}

/** Resolves fixed internal values only after every user-facing choice is present. */
export function completeConfig(draft: ConfigDraft): Config | null {
  if (
    draft.disk === undefined ||
    draft.cpu === undefined ||
    draft.swap === undefined ||
    draft.subvolumeLayout === undefined ||
    draft.timezone === undefined ||
    draft.systemLocale === undefined ||
    draft.keymap === undefined ||
    draft.hostname === undefined ||
    draft.username === undefined ||
    draft.encryption === undefined ||
    draft.secureBoot === undefined ||
    (draft.subvolumeLayout === 'separated' && draft.snapper === undefined) ||
    draft.desktop === undefined
  ) {
    return null
  }

  return {
    disk: draft.disk,
    cpu: draft.cpu,
    espSize: '1G',
    swap: draft.swap,
    subvolumeLayout: draft.subvolumeLayout,
    mountOptions: ['compress=zstd', 'noatime'],
    timezone: draft.timezone,
    systemLocale: draft.systemLocale,
    keymap: draft.keymap,
    hostname: draft.hostname,
    username: draft.username,
    encryption: draft.encryption,
    secureBoot: draft.secureBoot,
    snapper: draft.subvolumeLayout === 'root-only' ? 'none' : draft.snapper!,
    desktop: draft.desktop,
  }
}

function safeValue(value: string | null, pattern: RegExp): string | undefined {
  return value &&
    pattern.test(value) &&
    !value.split('/').some((part) => part === '.' || part === '..')
    ? value
    : undefined
}

function listedValue<const T extends string>(
  value: string | null,
  values: readonly T[],
): T | undefined {
  return value && values.includes(value as T) ? (value as T) : undefined
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeBase64Url(value: string): Uint8Array | null {
  try {
    const encoded = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')
    const binary = atob(padded)
    return Uint8Array.from(binary, (character) => character.charCodeAt(0))
  } catch {
    return null
  }
}

/** Enum order is part of the v1 URL format. Append only; never reorder existing entries. */
const COMPACT_ENUMS = {
  cpu: ['intel', 'amd'],
  swap: ['none', 'zram', 'swapfile', 'partition'],
  layout: ['root-only', 'separated'],
  encryption: ['none', 'luks2'],
  secureBoot: ['none', 'custom-db', 'shim-mok'],
  snapper: ['none', 'root', 'root-home'],
  desktop: ['none', 'gnome', 'kde', 'hyprland'],
  locale: SYSTEM_LOCALES,
  keymap: KEYMAPS,
} as const

function encodeCompactConfig(draft: ConfigDraft): string | null {
  // Byte 0 is the format version; bytes 1-2 are the field-presence bitmap.
  let mask = 0
  const bytes = [1, 0, 0]
  const include = (bit: number, write: () => void) => {
    mask |= 1 << bit
    write()
  }
  const writeText = (value: string) => {
    const encoded = new TextEncoder().encode(value)
    if (encoded.length > 255) throw new RangeError('compact config string is too long')
    bytes.push(encoded.length, ...encoded)
  }
  const writeEnum = (value: string, values: readonly string[]) => {
    const index = values.indexOf(value)
    if (index < 0) throw new RangeError('compact config enum is unknown')
    bytes.push(index)
  }

  if (draft.disk !== undefined) include(0, () => writeText(draft.disk!.replace(/^\/dev\//, '')))
  if (draft.cpu !== undefined) include(1, () => writeEnum(draft.cpu!, COMPACT_ENUMS.cpu))
  if (draft.swap !== undefined) include(2, () => writeEnum(draft.swap!, COMPACT_ENUMS.swap))
  if (draft.subvolumeLayout !== undefined)
    include(3, () => writeEnum(draft.subvolumeLayout!, COMPACT_ENUMS.layout))
  if (draft.encryption !== undefined)
    include(4, () => writeEnum(draft.encryption!.mode, COMPACT_ENUMS.encryption))
  if (draft.secureBoot !== undefined)
    include(5, () => writeEnum(draft.secureBoot!, COMPACT_ENUMS.secureBoot))
  if (draft.snapper !== undefined)
    include(6, () => writeEnum(draft.snapper!, COMPACT_ENUMS.snapper))
  if (draft.desktop !== undefined)
    include(7, () => writeEnum(draft.desktop!, COMPACT_ENUMS.desktop))
  if (draft.timezone !== undefined) include(8, () => writeText(draft.timezone!))
  if (draft.systemLocale !== undefined)
    include(9, () => writeEnum(draft.systemLocale!, COMPACT_ENUMS.locale))
  if (draft.keymap !== undefined) include(10, () => writeEnum(draft.keymap!, COMPACT_ENUMS.keymap))
  if (draft.hostname !== undefined) include(11, () => writeText(draft.hostname!))
  if (draft.username !== undefined) include(12, () => writeText(draft.username!))
  if (mask === 0) return null

  bytes[1] = mask & 0xff
  bytes[2] = mask >> 8
  return encodeBase64Url(Uint8Array.from(bytes))
}

function decodeCompactConfig(value: string): URLSearchParams | null {
  const bytes = decodeBase64Url(value)
  if (!bytes || bytes.length < 3 || bytes[0] !== 1) return null
  const mask = bytes[1]! | (bytes[2]! << 8)
  if ((mask & ~0x1fff) !== 0) return null

  let cursor = 3
  const params = new URLSearchParams()
  const readText = () => {
    const length = bytes[cursor++]
    if (length === undefined || cursor + length > bytes.length) return null
    const text = new TextDecoder().decode(bytes.slice(cursor, cursor + length))
    cursor += length
    return text
  }
  const readEnum = (values: readonly string[]) => {
    const index = bytes[cursor++]
    return index === undefined ? null : (values[index] ?? null)
  }
  const read = (bit: number, key: string, reader: () => string | null, prefix = '') => {
    if ((mask & (1 << bit)) === 0) return true
    const result = reader()
    if (result === null) return false
    params.set(key, `${prefix}${result}`)
    return true
  }

  const valid =
    read(0, 'disk', readText, '/dev/') &&
    read(1, 'cpu', () => readEnum(COMPACT_ENUMS.cpu)) &&
    read(2, 'swap', () => readEnum(COMPACT_ENUMS.swap)) &&
    read(3, 'layout', () => readEnum(COMPACT_ENUMS.layout)) &&
    read(4, 'encryption', () => readEnum(COMPACT_ENUMS.encryption)) &&
    read(5, 'secureBoot', () => readEnum(COMPACT_ENUMS.secureBoot)) &&
    read(6, 'snapper', () => readEnum(COMPACT_ENUMS.snapper)) &&
    read(7, 'desktop', () => readEnum(COMPACT_ENUMS.desktop)) &&
    read(8, 'timezone', readText) &&
    read(9, 'locale', () => readEnum(COMPACT_ENUMS.locale)) &&
    read(10, 'keymap', () => readEnum(COMPACT_ENUMS.keymap)) &&
    read(11, 'hostname', readText) &&
    read(12, 'user', readText)

  return valid && cursor === bytes.length ? params : null
}

function decodeLegacyConfig(value: string): URLSearchParams | null {
  if (!value.startsWith('v1.')) return null
  const bytes = decodeBase64Url(value.slice(3))
  return bytes ? new URLSearchParams(new TextDecoder().decode(bytes)) : null
}
