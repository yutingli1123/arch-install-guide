import { cmd, text } from '../blocks'
import type { Step } from '../types'

export const installSteps: Step[] = [
  {
    id: 'pacstrap',
    section: 'install',
    title: 'install.pacstrap.title',
    body: ({ packages }) => [
      cmd(`pacstrap -K /mnt ${packages.join(' ')}`),
      text('install.pacstrap.purposes'),
    ],
  },
  {
    id: 'fstab',
    section: 'install',
    title: 'install.fstab.title',
    body: () => [
      cmd('genfstab -U /mnt >> /mnt/etc/fstab'),
      text('install.fstab.uuid'),
      cmd('cat /mnt/etc/fstab'),
      text('install.fstab.check'),
    ],
  },
]
