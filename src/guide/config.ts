import type {
  Config,
  ConfigDraft,
  Encryption,
  HyprlandAddon,
  HyprlandExtras,
  Tpm2Preset,
} from './types'

export type ConfigChoice =
  | 'encryption.password'
  | 'encryption.tpm2'
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
  'zh_HK.UTF-8',
  'de_DE.UTF-8',
  'fr_FR.UTF-8',
  'es_ES.UTF-8',
  'it_IT.UTF-8',
  'ja_JP.UTF-8',
  'ko_KR.UTF-8',
  'ru_RU.UTF-8',
  'ar_EG.UTF-8',
  'bg_BG.UTF-8',
  'ca_ES.UTF-8',
  'cs_CZ.UTF-8',
  'da_DK.UTF-8',
  'de_AT.UTF-8',
  'de_CH.UTF-8',
  'el_GR.UTF-8',
  'en_AU.UTF-8',
  'en_IE.UTF-8',
  'en_NZ.UTF-8',
  'en_SG.UTF-8',
  'en_ZA.UTF-8',
  'es_AR.UTF-8',
  'es_CL.UTF-8',
  'es_CO.UTF-8',
  'es_MX.UTF-8',
  'et_EE.UTF-8',
  'fa_IR',
  'fi_FI.UTF-8',
  'fr_BE.UTF-8',
  'fr_CA.UTF-8',
  'fr_CH.UTF-8',
  'he_IL.UTF-8',
  'hi_IN',
  'hr_HR.UTF-8',
  'hu_HU.UTF-8',
  'hy_AM',
  'id_ID.UTF-8',
  'is_IS.UTF-8',
  'ka_GE.UTF-8',
  'kk_KZ.UTF-8',
  'lt_LT.UTF-8',
  'lv_LV.UTF-8',
  'ms_MY.UTF-8',
  'nb_NO.UTF-8',
  'nl_BE.UTF-8',
  'nl_NL.UTF-8',
  'nn_NO.UTF-8',
  'pl_PL.UTF-8',
  'pt_BR.UTF-8',
  'pt_PT.UTF-8',
  'ro_RO.UTF-8',
  'sk_SK.UTF-8',
  'sl_SI.UTF-8',
  'sr_RS',
  'sv_SE.UTF-8',
  'th_TH.UTF-8',
  'tr_TR.UTF-8',
  'uk_UA.UTF-8',
  'ur_PK',
  'vi_VN',
] as const

export const KEYMAPS = ['us', 'uk', 'de-latin1', 'fr-latin9', 'es', 'it', 'jp106', 'ru'] as const

/** Single-choice Hyprland categories. Enum order is part of the URL format. */
export const HYPRLAND_CHOICES = {
  notifications: ['none', 'swaync', 'mako'],
  launcher: ['hyprlauncher', 'rofi', 'wofi', 'walker'],
  fileManager: ['nautilus', 'dolphin', 'thunar'],
  terminal: ['ghostty', 'kitty'],
  bar: ['none', 'waybar'],
  lock: ['none', 'hyprlock'],
} as const satisfies { [K in keyof Omit<HyprlandExtras, 'addons'>]: readonly HyprlandExtras[K][] }

/** Bit order is part of the URL format. */
export const HYPRLAND_ADDONS = [
  'hyprpaper',
  'hyprsunset',
  'hyprshot',
  'wl-clipboard',
  'gnome-keyring',
  'seahorse',
] as const satisfies readonly HyprlandAddon[]

/** Categories that carry a `none` option start there; the rest wait for an answer. */
export const NEW_HYPRLAND_DRAFT: Partial<HyprlandExtras> = {
  notifications: 'none',
  bar: 'none',
  lock: 'none',
  addons: [],
}

const HYPRLAND_CATEGORIES = Object.keys(HYPRLAND_CHOICES) as (keyof typeof HYPRLAND_CHOICES)[]
/** Index 0 stands for a category the user has not answered yet. */
const HYPRLAND_URL_VALUES = Object.fromEntries(
  HYPRLAND_CATEGORIES.map((category) => [category, ['', ...HYPRLAND_CHOICES[category]]]),
) as Record<(typeof HYPRLAND_CATEGORIES)[number], string[]>

/** Keeps a selection comparable and encodable regardless of the order it was clicked in. */
export function orderAddons(addons: readonly HyprlandAddon[]): HyprlandAddon[] {
  return HYPRLAND_ADDONS.filter((addon) => addons.includes(addon))
}

/** Returns null while a mandatory category is unanswered or an addon is unknown. */
export function completeHyprland(
  draft: Partial<HyprlandExtras> | null | undefined,
): HyprlandExtras | null {
  const addons = draft?.addons ?? []
  if (
    !draft ||
    HYPRLAND_CATEGORIES.some((category) => draft[category] === undefined) ||
    new Set(addons).size !== addons.length ||
    !addons.every(isAddon)
  ) {
    return null
  }
  return { ...(draft as HyprlandExtras), addons: orderAddons(addons) }
}

export const MIRROR_COUNTRIES = [
  ['AL', 'Albania'],
  ['AR', 'Argentina'],
  ['AM', 'Armenia'],
  ['AU', 'Australia'],
  ['AT', 'Austria'],
  ['AZ', 'Azerbaijan'],
  ['BD', 'Bangladesh'],
  ['BY', 'Belarus'],
  ['BE', 'Belgium'],
  ['BR', 'Brazil'],
  ['BG', 'Bulgaria'],
  ['KH', 'Cambodia'],
  ['CA', 'Canada'],
  ['CL', 'Chile'],
  ['CN', 'China'],
  ['CO', 'Colombia'],
  ['HR', 'Croatia'],
  ['CZ', 'Czechia'],
  ['DK', 'Denmark'],
  ['EC', 'Ecuador'],
  ['EE', 'Estonia'],
  ['FI', 'Finland'],
  ['FR', 'France'],
  ['GE', 'Georgia'],
  ['DE', 'Germany'],
  ['GR', 'Greece'],
  ['HK', 'Hong Kong'],
  ['HU', 'Hungary'],
  ['IS', 'Iceland'],
  ['IN', 'India'],
  ['ID', 'Indonesia'],
  ['IR', 'Iran'],
  ['IL', 'Israel'],
  ['IT', 'Italy'],
  ['JP', 'Japan'],
  ['KZ', 'Kazakhstan'],
  ['KE', 'Kenya'],
  ['LV', 'Latvia'],
  ['LT', 'Lithuania'],
  ['LU', 'Luxembourg'],
  ['MY', 'Malaysia'],
  ['MU', 'Mauritius'],
  ['MX', 'Mexico'],
  ['MD', 'Moldova'],
  ['MA', 'Morocco'],
  ['NP', 'Nepal'],
  ['NL', 'Netherlands'],
  ['NC', 'New Caledonia'],
  ['NZ', 'New Zealand'],
  ['MK', 'North Macedonia'],
  ['NO', 'Norway'],
  ['PY', 'Paraguay'],
  ['PH', 'Philippines'],
  ['PL', 'Poland'],
  ['PT', 'Portugal'],
  ['RO', 'Romania'],
  ['RU', 'Russia'],
  ['RE', 'Réunion'],
  ['SA', 'Saudi Arabia'],
  ['RS', 'Serbia'],
  ['SG', 'Singapore'],
  ['SK', 'Slovakia'],
  ['SI', 'Slovenia'],
  ['ZA', 'South Africa'],
  ['KR', 'South Korea'],
  ['ES', 'Spain'],
  ['SE', 'Sweden'],
  ['CH', 'Switzerland'],
  ['TW', 'Taiwan'],
  ['TH', 'Thailand'],
  ['TN', 'Tunisia'],
  ['TR', 'Türkiye'],
  ['UA', 'Ukraine'],
  ['AE', 'United Arab Emirates'],
  ['GB', 'United Kingdom'],
  ['US', 'United States'],
  ['UZ', 'Uzbekistan'],
  ['VN', 'Vietnam'],
] as const
const MIRROR_COUNTRY_CODES = MIRROR_COUNTRIES.map(([code]) => code)

/**
 * A complete fixture for the stage-one guide and its tests. The setup wizard
 * does not use these values as defaults.
 */
export const stageOneConfig: Config = {
  disk: '/dev/nvme0n1',
  cpu: 'intel',
  espSize: '1G',
  zram: false,
  diskSwap: 'none',
  diskSwapSizeGiB: null,
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
  hyprland: null,
  graphics: 'intel',
  reflector: { countries: ['CA'], ageHours: 12, number: 10 },
}

/** Stamped into the rendered guide so a printed copy carries its own expiry. */
export const VERIFIED_AGAINST = '2026-08'

const TPM2_PRESETS: Record<
  Tpm2Preset,
  { hashPcrs: number[]; signedPcrs: number[]; secureBoot: Config['secureBoot'] | null }
> = {
  minimal: { hashPcrs: [7], signedPcrs: [], secureBoot: null },
  'custom-db': { hashPcrs: [7], signedPcrs: [11], secureBoot: 'custom-db' },
  'shim-mok': { hashPcrs: [7, 14], signedPcrs: [11], secureBoot: 'shim-mok' },
}

export function tpm2Preset(encryption: Encryption | undefined): Tpm2Preset | undefined {
  if (encryption?.mode !== 'luks2' || encryption.unlock.method !== 'tpm2') return undefined
  const hash = encryption.unlock.hashPcrs.join('+')
  const signed = encryption.unlock.signedPcrs.join('+')
  return (Object.entries(TPM2_PRESETS) as [Tpm2Preset, (typeof TPM2_PRESETS)[Tpm2Preset]][]).find(
    ([, value]) => value.hashPcrs.join('+') === hash && value.signedPcrs.join('+') === signed,
  )?.[0]
}

export function makeTpm2Encryption(preset: Tpm2Preset, pin = true): Encryption {
  const { hashPcrs, signedPcrs } = TPM2_PRESETS[preset]
  return { mode: 'luks2', unlock: { method: 'tpm2', pin, hashPcrs, signedPcrs } }
}

/** Returns the choices that the current guide cannot safely generate. */
export function validate(config: ConfigDraft): Availability {
  const snapperReason = config.subvolumeLayout === 'root-only' ? '需要标准分离子卷布局' : undefined

  return {
    ...(snapperReason ? { 'snapper.root': snapperReason, 'snapper.root-home': snapperReason } : {}),
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
  const params = compact !== null ? decodeCompactConfig(compact) : new URLSearchParams()
  const draft: ConfigDraft = {}
  if (!params) return draft
  const disk = safeValue(params.get('disk'), SAFE.disk)
  const cpu = listedValue(params.get('cpu'), ['intel', 'amd'] as const)
  const zramValue = listedValue(params.get('zram'), ['false', 'true'] as const)
  const diskSwapValue = listedValue(params.get('diskSwap'), ['none', 'swapfile'] as const)
  const diskSwapSizeGiB = sizedValue(params.get('diskSwapSize'))
  const subvolumeLayout = listedValue(params.get('layout'), ['root-only', 'separated'] as const)
  const encryption = parseEncryption(params)
  const secureBoot = listedValue(params.get('secureBoot'), [
    'none',
    'custom-db',
    'shim-mok',
  ] as const)
  const snapper = listedValue(params.get('snapper'), ['none', 'root', 'root-home'] as const)
  const desktop = listedValue(params.get('desktop'), ['none', 'gnome', 'kde', 'hyprland'] as const)
  const hyprland = parseHyprland(params)
  const graphics = listedValue(params.get('graphics'), ['intel', 'amd', 'nvidia'] as const)
  const reflector = parseReflector(params)
  const timezone = listedValue(params.get('timezone'), TIMEZONES)
  const systemLocale = listedValue(params.get('locale'), SYSTEM_LOCALES)
  const keymap = listedValue(params.get('keymap'), KEYMAPS)
  const hostname = safeValue(params.get('hostname'), SAFE.hostname)
  const username = safeValue(params.get('user'), SAFE.username)

  if (disk) draft.disk = disk
  if (cpu) draft.cpu = cpu
  if (zramValue) draft.zram = zramValue === 'true'
  if (diskSwapValue) draft.diskSwap = diskSwapValue
  if (diskSwapSizeGiB) draft.diskSwapSizeGiB = diskSwapSizeGiB
  if (subvolumeLayout) draft.subvolumeLayout = subvolumeLayout
  if (encryption) draft.encryption = encryption
  if (secureBoot) draft.secureBoot = secureBoot
  if (snapper) draft.snapper = snapper
  if (desktop) draft.desktop = desktop
  if (hyprland) draft.hyprland = hyprland
  if (graphics) draft.graphics = graphics
  if (reflector) draft.reflector = reflector
  if (timezone) draft.timezone = timezone
  if (systemLocale) draft.systemLocale = systemLocale
  if (keymap) draft.keymap = keymap
  if (hostname) draft.hostname = hostname
  if (username) draft.username = username
  if (draft.subvolumeLayout === 'root-only') delete draft.snapper
  if (draft.desktop !== 'hyprland') delete draft.hyprland
  return draft
}

function parseHyprland(params: URLSearchParams): Partial<HyprlandExtras> | undefined {
  const selected = params.get('hypr')?.split(',')
  if (selected?.length !== HYPRLAND_CATEGORIES.length) return undefined

  const extras: Partial<HyprlandExtras> = { addons: [] }
  for (const [index, category] of HYPRLAND_CATEGORIES.entries()) {
    const raw = selected[index] ?? ''
    if (raw === '') continue
    const value = listedValue(raw, HYPRLAND_CHOICES[category])
    if (!value) return undefined
    Object.assign(extras, { [category]: value })
  }

  const addons = params.get('hyprAddons')?.split(',').filter(Boolean) ?? []
  if (!addons.every((addon, index) => isAddon(addon) && addons.indexOf(addon) === index)) {
    return undefined
  }
  extras.addons = orderAddons(addons as HyprlandAddon[])
  return extras
}

function isAddon(value: string): value is HyprlandAddon {
  return HYPRLAND_ADDONS.includes(value as HyprlandAddon)
}

function parseEncryption(params: URLSearchParams): Encryption | undefined {
  const mode = listedValue(params.get('encryption'), ['none', 'luks2'] as const)
  if (mode === 'none') return { mode: 'none' }
  if (mode !== 'luks2') return undefined
  const unlock = listedValue(params.get('unlock'), ['password', 'tpm2'] as const)
  if (unlock === 'password') return { mode: 'luks2', unlock: { method: 'password' } }
  if (unlock !== 'tpm2') return undefined
  const preset = listedValue(params.get('tpmPreset'), ['minimal', 'custom-db', 'shim-mok'] as const)
  const pin = listedValue(params.get('tpmPin'), ['0', '1'] as const)
  return preset && pin ? makeTpm2Encryption(preset, pin === '1') : undefined
}

function parseReflector(params: URLSearchParams): Config['reflector'] | undefined {
  const countries = params.get('mirrorCountries')?.split(',').filter(Boolean)
  const ageHours = Number(params.get('mirrorAge'))
  const number = Number(params.get('mirrorNumber'))
  return countries?.length &&
    countries.every((country) => MIRROR_COUNTRY_CODES.includes(country as never)) &&
    Number.isInteger(ageHours) &&
    ageHours >= 1 &&
    ageHours <= 168 &&
    Number.isInteger(number) &&
    number >= 1 &&
    number <= 50
    ? { countries, ageHours, number }
    : undefined
}

function sizedValue(value: string | null): number | undefined {
  const size = Number(value)
  return Number.isInteger(size) && size >= 1 && size <= 1024 ? size : undefined
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
    draft.zram === undefined ||
    draft.diskSwap === undefined ||
    (draft.diskSwap === 'swapfile' && draft.diskSwapSizeGiB === undefined) ||
    draft.subvolumeLayout === undefined ||
    draft.timezone === undefined ||
    draft.systemLocale === undefined ||
    draft.keymap === undefined ||
    draft.hostname === undefined ||
    draft.username === undefined ||
    draft.encryption === undefined ||
    draft.secureBoot === undefined ||
    (draft.subvolumeLayout === 'separated' && draft.snapper === undefined) ||
    draft.desktop === undefined ||
    draft.graphics === undefined ||
    draft.reflector === undefined
  ) {
    return null
  }

  const hyprland = completeHyprland(draft.hyprland)
  if (draft.desktop === 'hyprland' && !hyprland) return null

  const preset = tpm2Preset(draft.encryption)
  if (
    draft.reflector.countries.length === 0 ||
    new Set(draft.reflector.countries).size !== draft.reflector.countries.length ||
    !draft.reflector.countries.every((country) =>
      MIRROR_COUNTRY_CODES.includes(country as never),
    ) ||
    !Number.isInteger(draft.reflector.ageHours) ||
    draft.reflector.ageHours < 1 ||
    draft.reflector.ageHours > 168 ||
    !Number.isInteger(draft.reflector.number) ||
    draft.reflector.number < 1 ||
    draft.reflector.number > 50
  ) {
    return null
  }
  if (draft.encryption.mode === 'luks2' && draft.encryption.unlock.method === 'tpm2') {
    if (!preset) return null
    const requiredSecureBoot = TPM2_PRESETS[preset].secureBoot
    if (requiredSecureBoot && draft.secureBoot !== requiredSecureBoot) return null
  }

  return {
    disk: draft.disk,
    cpu: draft.cpu,
    espSize: '1G',
    zram: draft.zram,
    diskSwap: draft.diskSwap,
    diskSwapSizeGiB: draft.diskSwap === 'swapfile' ? draft.diskSwapSizeGiB! : null,
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
    hyprland: draft.desktop === 'hyprland' ? hyprland : null,
    graphics: draft.graphics,
    reflector: draft.reflector,
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

/** Enum order is part of the URL format. */
const COMPACT_ENUMS = {
  cpu: ['intel', 'amd'],
  diskSwap: ['none', 'swapfile'],
  layout: ['root-only', 'separated'],
  encryption: ['none', 'luks2'],
  secureBoot: ['none', 'custom-db', 'shim-mok'],
  snapper: ['none', 'root', 'root-home'],
  desktop: ['none', 'gnome', 'kde', 'hyprland'],
  graphics: ['intel', 'amd', 'nvidia'],
  locale: SYSTEM_LOCALES,
  keymap: KEYMAPS,
} as const

function encodeCompactConfig(draft: ConfigDraft): string | null {
  // Byte 0 is the format version; bytes 1-3 are the field-presence bitmap.
  let mask = 0
  const bytes = [2, 0, 0, 0]
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
  if (draft.diskSwap !== undefined)
    include(2, () => {
      writeEnum(draft.diskSwap!, COMPACT_ENUMS.diskSwap)
      if (draft.diskSwap === 'swapfile') {
        const size = draft.diskSwapSizeGiB ?? 0
        bytes.push(size & 0xff, size >> 8)
      }
    })
  if (draft.subvolumeLayout !== undefined)
    include(3, () => writeEnum(draft.subvolumeLayout!, COMPACT_ENUMS.layout))
  if (draft.encryption !== undefined)
    include(4, () => {
      const encryption = draft.encryption!
      writeEnum(encryption.mode, COMPACT_ENUMS.encryption)
      if (encryption.mode === 'none') return
      if (encryption.unlock.method === 'password') {
        bytes.push(0)
        return
      }
      const preset = tpm2Preset(encryption)
      if (!preset) throw new RangeError('unsupported TPM2 PCR combination')
      bytes.push(1 + (['minimal', 'custom-db', 'shim-mok'] as const).indexOf(preset))
      bytes.push(encryption.unlock.pin ? 1 : 0)
    })
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
  if (draft.graphics !== undefined)
    include(13, () => writeEnum(draft.graphics!, COMPACT_ENUMS.graphics))
  if (draft.reflector !== undefined)
    include(14, () => {
      bytes.push(draft.reflector!.countries.length)
      for (const country of draft.reflector!.countries) writeEnum(country, MIRROR_COUNTRY_CODES)
      bytes.push(draft.reflector!.ageHours)
      bytes.push(draft.reflector!.number)
    })
  if (draft.zram !== undefined) include(15, () => bytes.push(draft.zram ? 1 : 0))
  if (draft.hyprland)
    include(16, () => {
      const extras = draft.hyprland!
      for (const category of HYPRLAND_CATEGORIES) {
        writeEnum(extras[category] ?? '', HYPRLAND_URL_VALUES[category])
      }
      let addons = 0
      for (const addon of extras.addons ?? []) {
        const index = HYPRLAND_ADDONS.indexOf(addon)
        if (index < 0) throw new RangeError('compact config enum is unknown')
        addons |= 1 << index
      }
      bytes.push(addons & 0xff, addons >> 8)
    })
  if (mask === 0) return null

  bytes[1] = mask & 0xff
  bytes[2] = (mask >> 8) & 0xff
  bytes[3] = mask >> 16
  return encodeBase64Url(Uint8Array.from(bytes))
}

function decodeCompactConfig(value: string): URLSearchParams | null {
  const bytes = decodeBase64Url(value)
  if (!bytes || bytes.length < 4 || bytes[0] !== 2) return null
  const mask = bytes[1]! | (bytes[2]! << 8) | (bytes[3]! << 16)

  let cursor = 4
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

  const readEncryption = () => {
    if ((mask & (1 << 4)) === 0) return true
    const mode = readEnum(COMPACT_ENUMS.encryption)
    if (!mode) return false
    params.set('encryption', mode)
    if (mode === 'none') return true
    const unlock = bytes[cursor++]
    if (unlock === 0) {
      params.set('unlock', 'password')
      return true
    }
    const preset = ['minimal', 'custom-db', 'shim-mok'][unlock! - 1]
    const pin = bytes[cursor++]
    if (!preset || (pin !== 0 && pin !== 1)) return false
    params.set('unlock', 'tpm2')
    params.set('tpmPreset', preset)
    params.set('tpmPin', String(pin))
    return true
  }
  const readDiskSwap = () => {
    if ((mask & (1 << 2)) === 0) return true
    const diskSwap = readEnum(COMPACT_ENUMS.diskSwap)
    if (!diskSwap) return false
    params.set('diskSwap', diskSwap)
    if (diskSwap === 'none') return true
    const low = bytes[cursor++]
    const high = bytes[cursor++]
    if (low === undefined || high === undefined) return false
    const size = low | (high << 8)
    if (size > 1024) return false
    if (size > 0) params.set('diskSwapSize', String(size))
    return true
  }
  const readReflector = () => {
    if ((mask & (1 << 14)) === 0) return true
    const countryCount = bytes[cursor++]
    if (
      countryCount === undefined ||
      countryCount < 1 ||
      countryCount > MIRROR_COUNTRY_CODES.length
    )
      return false
    const countries: string[] = []
    for (let index = 0; index < countryCount; index += 1) {
      const country = readEnum(MIRROR_COUNTRY_CODES)
      if (!country || countries.includes(country)) return false
      countries.push(country)
    }
    const ageHours = bytes[cursor++]
    const number = bytes[cursor++]
    if (!ageHours || ageHours > 168 || number === undefined || number < 1 || number > 50)
      return false
    params.set('mirrorCountries', countries.join(','))
    params.set('mirrorAge', String(ageHours))
    params.set('mirrorNumber', String(number))
    return true
  }
  const readHyprland = () => {
    if ((mask & (1 << 16)) === 0) return true
    const selected: string[] = []
    for (const category of HYPRLAND_CATEGORIES) {
      const value = readEnum(HYPRLAND_URL_VALUES[category])
      if (value === null) return false
      selected.push(value)
    }
    const low = bytes[cursor++]
    const high = bytes[cursor++]
    if (low === undefined || high === undefined) return false
    const addons = low | (high << 8)
    if (addons >= 1 << HYPRLAND_ADDONS.length) return false
    params.set('hypr', selected.join(','))
    params.set('hyprAddons', HYPRLAND_ADDONS.filter((_, index) => addons & (1 << index)).join(','))
    return true
  }
  const readZram = () => {
    if ((mask & (1 << 15)) === 0) return true
    const zram = bytes[cursor++]
    if (zram !== 0 && zram !== 1) return false
    params.set('zram', String(zram === 1))
    return true
  }

  const valid =
    read(0, 'disk', readText, '/dev/') &&
    read(1, 'cpu', () => readEnum(COMPACT_ENUMS.cpu)) &&
    readDiskSwap() &&
    read(3, 'layout', () => readEnum(COMPACT_ENUMS.layout)) &&
    readEncryption() &&
    read(5, 'secureBoot', () => readEnum(COMPACT_ENUMS.secureBoot)) &&
    read(6, 'snapper', () => readEnum(COMPACT_ENUMS.snapper)) &&
    read(7, 'desktop', () => readEnum(COMPACT_ENUMS.desktop)) &&
    read(8, 'timezone', readText) &&
    read(9, 'locale', () => readEnum(COMPACT_ENUMS.locale)) &&
    read(10, 'keymap', () => readEnum(COMPACT_ENUMS.keymap)) &&
    read(11, 'hostname', readText) &&
    read(12, 'user', readText) &&
    read(13, 'graphics', () => readEnum(COMPACT_ENUMS.graphics)) &&
    readReflector() &&
    readZram() &&
    readHyprland()

  return valid && cursor === bytes.length ? params : null
}
