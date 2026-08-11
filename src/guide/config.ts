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
  const params = new URLSearchParams(search)
  const draft: ConfigDraft = {}
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
  const params = new URLSearchParams()
  if (draft.disk !== undefined) params.set('disk', draft.disk)
  if (draft.cpu !== undefined) params.set('cpu', draft.cpu)
  if (draft.swap !== undefined) params.set('swap', draft.swap)
  if (draft.subvolumeLayout !== undefined) params.set('layout', draft.subvolumeLayout)
  if (draft.encryption !== undefined) params.set('encryption', draft.encryption.mode)
  if (draft.secureBoot !== undefined) params.set('secureBoot', draft.secureBoot)
  if (draft.snapper !== undefined) params.set('snapper', draft.snapper)
  if (draft.desktop !== undefined) params.set('desktop', draft.desktop)
  if (draft.timezone !== undefined) params.set('timezone', draft.timezone)
  if (draft.systemLocale !== undefined) params.set('locale', draft.systemLocale)
  if (draft.keymap !== undefined) params.set('keymap', draft.keymap)
  if (draft.hostname !== undefined) params.set('hostname', draft.hostname)
  if (draft.username !== undefined) params.set('user', draft.username)
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
