export type Locale = 'zh' | 'en'

/** Falls back to `zh` when a locale is missing. */
export type Localized<T> = { zh: T } & Partial<Record<Locale, T>>

export type CpuVendor = 'intel' | 'amd'

/** Kernel image form. Decides where the ESP is mounted and what gets signed. */
export type SwapMode = 'none' | 'zram' | 'swapfile' | 'partition'
export type SubvolumeLayout = 'root-only' | 'separated'
export type SecureBootMode = 'none' | 'custom-db' | 'shim-mok'
export type SnapperMode = 'none' | 'root' | 'root-home'
export type Desktop = 'none' | 'gnome' | 'kde' | 'hyprland'

export type Encryption =
  | { mode: 'none' }
  | {
      mode: 'luks2'
      unlock:
        | { method: 'password' }
        | {
            method: 'tpm2'
            pin: boolean
            hashPcrs: number[]
            signedPcrs: number[]
          }
    }

export type Subvolume = {
  name: string
  /** Mount point inside the installed system. `/` for the root subvolume. */
  mountPoint: string
}

export type Config = {
  disk: string
  cpu: CpuVendor
  espSize: string
  swap: SwapMode
  subvolumeLayout: SubvolumeLayout
  /** Extra btrfs mount options applied to every subvolume. */
  mountOptions: string[]
  timezone: string
  systemLocale: string
  keymap: string
  hostname: string
  username: string
  encryption: Encryption
  secureBoot: SecureBootMode
  snapper: SnapperMode
  desktop: Desktop
}

/**
 * Everything the steps read, resolved once from `Config`. Steps never recompute
 * device paths or package names, so a new config option is wired up here only.
 */
export type Context = {
  cfg: Config
  /** ESP block device, e.g. `/dev/nvme0n1p1`. */
  espDevice: string
  /** Root block device, e.g. `/dev/nvme0n1p2`. */
  rootDevice: string
  /** ESP mount point inside the installed system. */
  espMountPoint: string
  rootSubvolume: Subvolume
  subvolumes: Subvolume[]
  /** Subvolumes other than the root one, ordered by mount point depth. */
  nestedSubvolumes: Subvolume[]
  mountOptions: string
  packages: string[]
  microcode: string
}

export type Body = (ctx: Context) => string

export type Step = {
  id: string
  /** Section this step belongs to, used for grouping in the rendered guide. */
  section: string
  title: Localized<string>
  /** Markdown. Fenced blocks render as copyable command blocks. */
  body: Localized<Body>
  /** Omitted means the step is always included. */
  when?: (cfg: Config) => boolean
}
