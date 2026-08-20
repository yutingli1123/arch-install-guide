/** A locale code is the name of a file under `i18n/locales/`. */
export type Locale = string

/** Falls back to `en` when a locale is missing. */
export type Localized<T> = { en: T } & Partial<Record<Locale, T>>

export type CpuVendor = 'intel' | 'amd'

export type DiskSwapMode = 'none' | 'swapfile'
export type SubvolumeLayout = 'root-only' | 'separated'
export type SecureBootMode = 'none' | 'custom-db' | 'shim-mok'
export type SnapperMode = 'none' | 'root' | 'root-home'
export type Desktop = 'none' | 'gnome' | 'kde' | 'hyprland'

export type HyprlandNotifications = 'none' | 'swaync' | 'mako'
export type HyprlandLauncher = 'hyprlauncher' | 'rofi' | 'wofi' | 'walker'
export type HyprlandFileManager = 'nautilus' | 'dolphin' | 'thunar'
export type HyprlandTerminal = 'ghostty' | 'kitty'
export type HyprlandBar = 'none' | 'waybar'
export type HyprlandLock = 'none' | 'hyprlock'
/** Independently selectable extras; each value is also its package name. */
export type HyprlandAddon = 'hyprpaper' | 'hyprsunset' | 'hyprshot' | 'gnome-keyring' | 'seahorse'

/**
 * Hyprland ships only the compositor and a session. A terminal, launcher and
 * file manager have to be picked; the rest of the categories can stay empty.
 */
export type HyprlandExtras = {
  notifications: HyprlandNotifications
  launcher: HyprlandLauncher
  fileManager: HyprlandFileManager
  terminal: HyprlandTerminal
  bar: HyprlandBar
  lock: HyprlandLock
  addons: HyprlandAddon[]
}
export type Graphics = 'intel' | 'amd' | 'nvidia'
export type ReflectorConfig = {
  countries: string[]
  ageHours: number
  number: number
}
export type Tpm2Preset = 'minimal' | 'custom-db' | 'shim-mok'

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
  /** Overrides the common btrfs mount options for this subvolume. */
  mountOptions?: string[]
}

export type Config = {
  disk: string
  cpu: CpuVendor
  espSize: string
  zram: boolean
  diskSwap: DiskSwapMode
  diskSwapSizeGiB: number | null
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
  /** Null for every desktop other than Hyprland. */
  hyprland: HyprlandExtras | null
  graphics: Graphics
  reflector: ReflectorConfig
}

/** User choices collected by the setup wizard; absent means not selected yet. */
export type ConfigDraft = Partial<Omit<Config, 'espSize' | 'mountOptions' | 'hyprland'>> & {
  /** Null carries over from a finished `Config` whose desktop is not Hyprland. */
  hyprland?: Partial<HyprlandExtras> | null
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
  /** Device containing btrfs: the partition itself or the opened LUKS mapping. */
  rootFsDevice: string
  luksName: string
  /** ESP mount point inside the installed system. */
  espMountPoint: string
  rootSubvolume: Subvolume
  subvolumes: Subvolume[]
  /** Subvolumes other than the root one, ordered by mount point depth. */
  nestedSubvolumes: Subvolume[]
  mountOptions: string
  packages: string[]
  microcode: string
  graphicsPackages: string[]
  audioPackages: string[]
  desktopCommonPackages: string[]
  /** fcitx5 engine that the system language needs, if any. */
  inputMethodEngine?: string
  desktopPackages: string[]
  /** Hyprland session software from the official repositories. */
  hyprlandPackages: string[]
  /** Hyprland session software that only exists in the AUR. */
  hyprlandAurPackages: string[]
  /** Subset of `hyprlandPackages` that ships a systemd user unit. */
  hyprlandServices: string[]
  /** Display name of the chosen desktop, e.g. `KDE Plasma`. Never translated. */
  desktopName: string
  /** Regional suffix of the Noto CJK families, e.g. `SC`. */
  cjkVariant?: string
  displayManager?: string
}

/** Prose is looked up per locale; a command block is written once and rendered as is. */
export type Block = { key: string } | { cmd: string; lang?: string }

export type Body = (ctx: Context) => Block[]

export type Step = {
  id: string
  /** Section this step belongs to, used for grouping in the rendered guide. */
  section: string
  /** Catalog key of the step title. */
  title: string
  /** Prose blocks are markdown; command blocks render as copyable blocks. */
  body: Body
  /** Omitted means the step is always included. */
  when?: (cfg: Config) => boolean
}
