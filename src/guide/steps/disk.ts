import { cmd, text } from '../blocks'
import type { Step } from '../types'

export const diskSteps: Step[] = [
  {
    id: 'identify-disk',
    section: 'disk',
    title: 'disk.identify-disk.title',
    body: () => [text('disk.identify.intro'), cmd('lsblk'), text('disk.identify.warning')],
  },
  {
    id: 'partition',
    section: 'disk',
    title: 'disk.partition.title',
    body: ({ cfg }) => [
      text('disk.partition.table'),
      cmd(`sgdisk ${cfg.disk} -o -n 1:0:+${cfg.espSize} -t 1:ef00 -n 2:0:0 -t 2:8300`),
      text('disk.partition.flags'),
      cmd(`lsblk ${cfg.disk}`),
    ],
  },
  {
    id: 'luks-format',
    section: 'disk',
    title: 'disk.luks-format.title',
    when: (cfg) => cfg.encryption.mode === 'luks2',
    body: ({ rootDevice, luksName }) => [
      text('disk.luks.intro'),
      cmd(
        `cryptsetup luksFormat --type luks2 ${rootDevice}\ncryptsetup open ${rootDevice} ${luksName}`,
      ),
      text('disk.luks.slot'),
    ],
  },
  {
    id: 'format',
    section: 'disk',
    title: 'disk.format.title',
    body: ({ espDevice, rootFsDevice }) => [
      text('disk.format.intro'),
      cmd(`mkfs.fat -F 32 ${espDevice}\nmkfs.btrfs -f ${rootFsDevice}`),
    ],
  },
  {
    id: 'subvolumes',
    section: 'disk',
    title: 'disk.subvolumes.title',
    body: ({ rootFsDevice, subvolumes }) => [
      text('disk.subvolumes.create'),
      cmd(
        `mount ${rootFsDevice} /mnt\n` +
          subvolumes.map((s) => `btrfs subvolume create /mnt/${s.name}`).join('\n') +
          '\numount /mnt',
      ),
      text('disk.subvolumes.table'),
      text('disk.subvolumes.snapshots'),
    ],
  },
  {
    id: 'mount',
    section: 'disk',
    title: 'disk.mount.title',
    body: ({
      cfg,
      rootFsDevice,
      espDevice,
      espMountPoint,
      rootSubvolume,
      nestedSubvolumes,
      mountOptions,
    }) => [
      text('disk.mount.intro'),
      cmd(
        `mount -o subvol=${rootSubvolume.name},${mountOptions} ${rootFsDevice} /mnt\n` +
          nestedSubvolumes
            .map(
              (s) =>
                `mount --mkdir -o subvol=${s.name},${(s.mountOptions ?? cfg.mountOptions).join(',')} ${rootFsDevice} /mnt${s.mountPoint}`,
            )
            .join('\n') +
          `\nmount --mkdir -o noatime,umask=0077 ${espDevice} /mnt${espMountPoint}`,
      ),
      text('disk.mount.options'),
      text('disk.mount.esp'),
      text('disk.mount.check'),
      cmd('findmnt -R /mnt'),
      text('disk.mount.count'),
    ],
  },
]
