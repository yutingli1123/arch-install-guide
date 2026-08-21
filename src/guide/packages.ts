import type { ProseKey } from './i18n'
import type { Context } from './types'

/** Package groups in the order the purpose table lists them. */
const PURPOSES: Array<[string[], ProseKey]> = [
  [['base'], 'package.base'],
  [['linux', 'linux-firmware'], 'package.linux'],
  [['btrfs-progs'], 'package.btrfs-progs'],
  [['cryptsetup'], 'package.cryptsetup'],
  [['networkmanager'], 'package.networkmanager'],
  [['sudo'], 'package.sudo'],
  [['vim'], 'package.vim'],
  [['zram-generator'], 'package.zram-generator'],
  [['snapper'], 'package.snapper'],
  [['sbctl'], 'package.sbctl'],
  [['systemd-ukify'], 'package.systemd-ukify'],
  [['base-devel'], 'package.base-devel'],
  [['git'], 'package.git'],
  [['efibootmgr', 'mokutil', 'sbsigntools'], 'package.secure-boot-tools'],
]

/** Markdown rows for the packages actually installed; every package needs a purpose. */
export function packagePurposeRows(
  { packages, microcode }: Context,
  t: (key: ProseKey) => string,
): string {
  const groups: Array<[string[], ProseKey]> = [
    ...PURPOSES.slice(0, 3),
    [[microcode], 'package.microcode'],
    ...PURPOSES.slice(3),
  ]
  const visible = groups.filter(([names]) => names.every((name) => packages.includes(name)))
  const covered = new Set(visible.flatMap(([names]) => names))
  const missing = packages.filter((name) => !covered.has(name))
  if (missing.length > 0) throw new Error(`missing package purpose: ${missing.join(', ')}`)

  return visible
    .map(([names, key]) => `| ${names.map((name) => `\`${name}\``).join(' ')} | ${t(key)} |`)
    .join('\n')
}
