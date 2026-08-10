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

  const subvolumes = SUBVOLUME_LAYOUTS[cfg.subvolumeLayout]
  const rootSubvolume = subvolumes[0]

  const microcode = `${cfg.cpu}-ucode`

  return {
    cfg,
    espDevice: partition(cfg.disk, 1),
    rootDevice: partition(cfg.disk, 2),
    espMountPoint: '/efi',
    rootSubvolume,
    subvolumes,
    nestedSubvolumes: subvolumes.slice(1),
    mountOptions: cfg.mountOptions.join(','),
    packages: [...BASE_PACKAGES, microcode].sort(),
    microcode,
  }
}
