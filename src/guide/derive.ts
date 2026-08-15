import type { Config, Context, Subvolume, SubvolumeLayout } from './types'

/** Devices whose partitions carry a `p` before the partition number. */
const PARTITION_SUFFIX = /^\/dev\/(nvme|mmcblk|loop|md)/

export function partition(disk: string, index: number): string {
  return PARTITION_SUFFIX.test(disk) ? `${disk}p${index}` : `${disk}${index}`
}

const BASE_PACKAGES = [
  'base',
  'linux',
  'linux-firmware',
  'btrfs-progs',
  'networkmanager',
  'sudo',
  'vim',
]

const SUBVOLUME_LAYOUTS = {
  'root-only': [{ name: '@', mountPoint: '/' }],
  separated: [
    { name: '@', mountPoint: '/' },
    { name: '@boot', mountPoint: '/boot' },
    { name: '@home', mountPoint: '/home' },
    { name: '@log', mountPoint: '/var/log' },
    { name: '@pkg', mountPoint: '/var/cache/pacman/pkg' },
  ],
} satisfies Record<SubvolumeLayout, [Subvolume, ...Subvolume[]]>

export function derive(cfg: Config): Context {
  if (cfg.subvolumeLayout === 'root-only' && cfg.snapper !== 'none') {
    throw new Error('snapper requires the separated subvolume layout')
  }
  if (cfg.encryption.mode === 'luks2' && cfg.encryption.unlock.method === 'tpm2') {
    const { hashPcrs, signedPcrs } = cfg.encryption.unlock
    if (signedPcrs.includes(11) && cfg.secureBoot === 'none') {
      throw new Error('signed PCR 11 policy requires secure boot')
    }
    if (hashPcrs.includes(14) && cfg.secureBoot !== 'shim-mok') {
      throw new Error('PCR 14 requires shim/MOK secure boot')
    }
  }

  const subvolumes: Subvolume[] = [...SUBVOLUME_LAYOUTS[cfg.subvolumeLayout]]
  if (cfg.snapper === 'root' || cfg.snapper === 'root-home') {
    subvolumes.push({ name: '@snapshots', mountPoint: '/.snapshots' })
  }
  if (cfg.snapper === 'root-home') {
    subvolumes.push({ name: '@home_snapshots', mountPoint: '/home/.snapshots' })
  }
  if (cfg.diskSwap === 'swapfile') {
    subvolumes.push({ name: '@swap', mountPoint: '/swap', mountOptions: ['noatime'] })
  }
  const rootSubvolume = subvolumes[0]!

  const microcode = `${cfg.cpu}-ucode`
  const luksName = 'cryptroot'
  const rootDevice = partition(cfg.disk, 2)
  const swapDevice = cfg.diskSwap === 'partition' ? partition(cfg.disk, 3) : undefined
  const rootFsDevice = cfg.encryption.mode === 'luks2' ? `/dev/mapper/${luksName}` : rootDevice
  const packages = [...BASE_PACKAGES, microcode]
  const graphicsPackages = {
    intel: ['mesa', 'vulkan-intel', 'intel-media-driver'],
    amd: ['mesa', 'vulkan-radeon', 'libva-mesa-driver'],
    nvidia: ['nvidia-open', 'nvidia-utils'],
  }[cfg.graphics]
  const desktop = {
    none: { packages: [] },
    gnome: { packages: ['gnome'], displayManager: 'gdm' },
    kde: { packages: ['plasma-meta', 'sddm', 'konsole', 'dolphin'], displayManager: 'sddm' },
    hyprland: {
      packages: [
        'hyprland',
        'uwsm',
        'ghostty',
        'xdg-desktop-portal-hyprland',
        'hyprpolkitagent',
        'greetd',
        'greetd-regreet',
      ],
      displayManager: 'greetd',
    },
  }[cfg.desktop]
  const audioPackages =
    cfg.desktop === 'none'
      ? []
      : [
          'pipewire',
          'pipewire-audio',
          'pipewire-alsa',
          'pipewire-pulse',
          'wireplumber',
          ...(cfg.desktop === 'hyprland' ? ['pavucontrol'] : []),
        ]
  const inputMethodEngine = cfg.systemLocale.startsWith('zh_')
    ? 'fcitx5-rime'
    : cfg.systemLocale.startsWith('ja_')
      ? 'fcitx5-mozc'
      : cfg.systemLocale.startsWith('ko_')
        ? 'fcitx5-hangul'
        : undefined
  const desktopCommonPackages =
    cfg.desktop === 'none'
      ? []
      : [
          ...(cfg.desktop === 'hyprland' ? ['bluez', 'bluez-utils', 'blueman'] : []),
          'fcitx5-im',
          ...(inputMethodEngine ? [inputMethodEngine] : []),
        ]
  if (cfg.encryption.mode === 'luks2') packages.push('cryptsetup')
  if (cfg.zram) packages.push('zram-generator')
  if (cfg.snapper !== 'none') packages.push('snapper')
  if (cfg.secureBoot === 'custom-db') packages.push('sbctl')
  if (cfg.secureBoot === 'shim-mok') {
    packages.push('base-devel', 'efibootmgr', 'git', 'mokutil', 'sbsigntools')
  }
  if (
    cfg.encryption.mode === 'luks2' &&
    cfg.encryption.unlock.method === 'tpm2' &&
    cfg.encryption.unlock.signedPcrs.includes(11)
  ) {
    packages.push('systemd-ukify')
  }

  return {
    cfg,
    espDevice: partition(cfg.disk, 1),
    rootDevice,
    swapDevice,
    rootFsDevice,
    luksName,
    espMountPoint: '/efi',
    rootSubvolume,
    subvolumes,
    nestedSubvolumes: subvolumes.slice(1),
    mountOptions: cfg.mountOptions.join(','),
    packages: [...new Set(packages)].sort(),
    microcode,
    graphicsPackages,
    audioPackages,
    desktopCommonPackages,
    desktopPackages: desktop.packages,
    displayManager: 'displayManager' in desktop ? desktop.displayManager : undefined,
  }
}
