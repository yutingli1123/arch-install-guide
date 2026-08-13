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
  const rootSubvolume = subvolumes[0]!

  const microcode = `${cfg.cpu}-ucode`
  const luksName = 'cryptroot'
  const rootDevice = partition(cfg.disk, 2)
  const rootFsDevice = cfg.encryption.mode === 'luks2' ? `/dev/mapper/${luksName}` : rootDevice
  const packages = [...BASE_PACKAGES, microcode]
  if (cfg.encryption.mode === 'luks2') packages.push('cryptsetup')
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
    rootFsDevice,
    luksName,
    espMountPoint: '/efi',
    rootSubvolume,
    subvolumes,
    nestedSubvolumes: subvolumes.slice(1),
    mountOptions: cfg.mountOptions.join(','),
    packages: [...new Set(packages)].sort(),
    microcode,
  }
}
