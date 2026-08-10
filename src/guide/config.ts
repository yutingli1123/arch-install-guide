import type { Config } from './types'

/**
 * The single path covered so far: UEFI, btrfs, UKI, systemd-boot,
 * no encryption, no snapper, no desktop. The configuration UI replaces this.
 */
export const defaultConfig: Config = {
  disk: '/dev/nvme0n1',
  cpu: 'intel',
  kernelImage: 'uki',
  espSize: '1G',
  subvolumes: [
    { name: '@', mountPoint: '/' },
    { name: '@home', mountPoint: '/home' },
    { name: '@log', mountPoint: '/var/log' },
    { name: '@pkg', mountPoint: '/var/cache/pacman/pkg' },
    { name: '@boot', mountPoint: '/boot' },
  ],
  mountOptions: ['compress=zstd', 'noatime'],
  timezone: 'America/Toronto',
  systemLocale: 'en_US.UTF-8',
  keymap: 'us',
  hostname: 'archlinux',
  username: 'user',
}

/** Stamped into the rendered guide so a printed copy carries its own expiry. */
export const VERIFIED_AGAINST = '2026-08'
