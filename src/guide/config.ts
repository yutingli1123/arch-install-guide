import type { Config } from './types'

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

/**
 * The single path covered so far: UEFI, btrfs, UKI, systemd-boot,
 * no encryption, no snapper, no desktop. The configuration UI replaces this.
 */
export const defaultConfig: Config = {
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
export function validate(config: Config): Availability {
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
  timezone: /^[A-Za-z0-9._+-]+(?:\/[A-Za-z0-9._+-]+)*$/,
  locale: /^[A-Za-z0-9_.@-]+$/,
  keymap: /^[A-Za-z0-9_-]+$/,
  hostname: /^[A-Za-z0-9](?:[A-Za-z0-9.-]{0,251}[A-Za-z0-9])?$/,
  username: /^(?!root$)[a-z_][a-z0-9_-]{0,31}$/,
}

/** Reads only options whose guide steps are implemented. Unknown or unsafe values are ignored. */
export function parseConfig(search: string): Config {
  const params = new URLSearchParams(search)

  return {
    ...defaultConfig,
    disk: safeValue(params.get('disk'), SAFE.disk, defaultConfig.disk),
    cpu: params.get('cpu') === 'amd' ? 'amd' : defaultConfig.cpu,
    subvolumeLayout:
      params.get('layout') === 'root-only' ? 'root-only' : defaultConfig.subvolumeLayout,
    timezone: safeValue(params.get('timezone'), SAFE.timezone, defaultConfig.timezone),
    systemLocale: safeValue(params.get('locale'), SAFE.locale, defaultConfig.systemLocale),
    keymap: safeValue(params.get('keymap'), SAFE.keymap, defaultConfig.keymap),
    hostname: safeValue(params.get('hostname'), SAFE.hostname, defaultConfig.hostname),
    username: safeValue(params.get('user'), SAFE.username, defaultConfig.username),
  }
}

/** Omits defaults so shared links stay short. */
export function serializeConfig(config: Config): string {
  const params = new URLSearchParams()
  setChanged(params, 'disk', config.disk, defaultConfig.disk)
  setChanged(params, 'cpu', config.cpu, defaultConfig.cpu)
  setChanged(params, 'layout', config.subvolumeLayout, defaultConfig.subvolumeLayout)
  setChanged(params, 'timezone', config.timezone, defaultConfig.timezone)
  setChanged(params, 'locale', config.systemLocale, defaultConfig.systemLocale)
  setChanged(params, 'keymap', config.keymap, defaultConfig.keymap)
  setChanged(params, 'hostname', config.hostname, defaultConfig.hostname)
  setChanged(params, 'user', config.username, defaultConfig.username)
  return params.toString()
}

function safeValue(value: string | null, pattern: RegExp, fallback: string): string {
  return value &&
    pattern.test(value) &&
    !value.split('/').some((part) => part === '.' || part === '..')
    ? value
    : fallback
}

function setChanged(params: URLSearchParams, key: string, value: string, fallback: string) {
  if (value !== fallback) params.set(key, value)
}
