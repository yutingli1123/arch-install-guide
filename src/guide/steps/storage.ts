import { cmd, text } from '../blocks'
import type { Step } from '../types'

export const storageSteps: Step[] = [
  {
    id: 'zram',
    section: 'storage',
    title: 'storage.zram.title',
    when: (cfg) => cfg.zram,
    body: () => [
      text('storage.zram.create'),
      cmd('vim /etc/systemd/zram-generator.conf'),
      text('storage.zram.write'),
      cmd('[zram0]\nzram-size = ram / 2\ncompression-algorithm = zstd\nswap-priority = 100'),
      text('storage.zram.result'),
      text('storage.zram.sysctl'),
      cmd('vim /etc/sysctl.d/99-vm-zram-parameters.conf'),
      text('storage.zram.write'),
      cmd(
        'vm.swappiness = 180\n' +
          'vm.watermark_boost_factor = 0\n' +
          'vm.watermark_scale_factor = 125\n' +
          'vm.page-cluster = 0',
      ),
      text('storage.zram.sysctl-notes'),
    ],
  },
  {
    id: 'swapfile',
    section: 'storage',
    title: 'storage.swapfile.title',
    when: (cfg) => cfg.diskSwap === 'swapfile',
    body: ({ cfg }) => [
      text('storage.swapfile.create'),
      cmd(
        `btrfs filesystem mkswapfile --size ${cfg.diskSwapSizeGiB}g --uuid clear /swap/swapfile\n` +
          'swapon /swap/swapfile\n' +
          "echo '/swap/swapfile none swap defaults 0 0' >> /etc/fstab",
      ),
      text('storage.swapfile.notes'),
    ],
  },
  {
    id: 'initramfs-encryption',
    section: 'storage',
    title: 'storage.initramfs-encryption.title',
    when: (cfg) => cfg.encryption.mode === 'luks2',
    body: () => [
      text('storage.initramfs-encryption.edit'),
      cmd('vim /etc/mkinitcpio.conf'),
      text('storage.initramfs-encryption.hooks'),
      cmd('block sd-encrypt filesystems'),
      text('storage.initramfs-encryption.warning'),
    ],
  },
  {
    id: 'snapper-config',
    section: 'storage',
    title: 'storage.snapper-config.title',
    when: (cfg) => cfg.snapper !== 'none',
    body: ({ cfg }) => [
      text('storage.snapper-config.intro'),
      cmd(
        'umount /.snapshots\n' +
          'rmdir /.snapshots\n' +
          'snapper --no-dbus -c root create-config /\n' +
          'btrfs subvolume delete /.snapshots\n' +
          'mkdir /.snapshots\n' +
          'mount /.snapshots\n' +
          'chmod 750 /.snapshots\n' +
          (cfg.snapper === 'root-home'
            ? 'umount /home/.snapshots\n' +
              'rmdir /home/.snapshots\n' +
              'snapper --no-dbus -c home create-config /home\n' +
              'btrfs subvolume delete /home/.snapshots\n' +
              'mkdir /home/.snapshots\n' +
              'mount /home/.snapshots\n' +
              'chmod 750 /home/.snapshots\n'
            : '') +
          'systemctl enable snapper-timeline.timer snapper-cleanup.timer',
      ),
      text('storage.snapper-config.dbus'),
      text('storage.snapper-config.verify'),
      cmd(
        'snapper --no-dbus list-configs\n' +
          `findmnt --mountpoint /.snapshots${
            cfg.snapper === 'root-home' ? '\nfindmnt --mountpoint /home/.snapshots' : ''
          }`,
      ),
    ],
  },
  {
    id: 'pcr-signing-policy',
    section: 'storage',
    title: 'storage.pcr-signing-policy.title',
    when: (cfg) =>
      cfg.encryption.mode === 'luks2' &&
      cfg.encryption.unlock.method === 'tpm2' &&
      cfg.encryption.unlock.signedPcrs.includes(11),
    body: () => [
      text('storage.pcr-signing-policy.key'),
      cmd(
        'openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out /etc/kernel/pcr-initrd.key.pem\n' +
          'openssl pkey -in /etc/kernel/pcr-initrd.key.pem -pubout -out /etc/kernel/pcr-initrd.pub.pem\n' +
          'chmod 600 /etc/kernel/pcr-initrd.key.pem',
      ),
      text('storage.pcr-signing-policy.conf'),
      cmd('vim /etc/kernel/uki.conf'),
      text('storage.pcr-signing-policy.write'),
      cmd(
        '[PCRSignature:initrd]\n' +
          'Phases=enter-initrd\n' +
          'PCRPrivateKey=/etc/kernel/pcr-initrd.key.pem\n' +
          'PCRPublicKey=/etc/kernel/pcr-initrd.pub.pem',
      ),
      text('storage.pcr-signing-policy.phases'),
      text('storage.pcr-signing-policy.rebuild'),
    ],
  },
]
