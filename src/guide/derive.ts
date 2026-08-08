import type { Config, Context, Subvolume } from './types'

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

export function derive(cfg: Config): Context {
  const rootSubvolume = cfg.subvolumes.find((s) => s.mountPoint === '/')
  if (!rootSubvolume) throw new Error('config.subvolumes must contain a subvolume mounted at /')

  const microcode = `${cfg.cpu}-ucode`

  return {
    cfg,
    espDevice: partition(cfg.disk, 1),
    rootDevice: partition(cfg.disk, 2),
    // systemd-boot reads kernel and initramfs off the ESP, so split images put it at /boot.
    espMountPoint: cfg.kernelImage === 'split' ? '/boot' : '/efi',
    rootSubvolume,
    nestedSubvolumes: cfg.subvolumes
      .filter((s) => s !== rootSubvolume)
      .sort((a, b) => depth(a) - depth(b)),
    mountOptions: cfg.mountOptions.join(','),
    packages: [...BASE_PACKAGES, microcode].sort(),
    microcode,
  }
}

/** Parent mount points must be mounted first. */
function depth(subvolume: Subvolume): number {
  return subvolume.mountPoint.split('/').filter(Boolean).length
}
