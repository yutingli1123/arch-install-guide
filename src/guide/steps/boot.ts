import { cmd, text } from '../blocks'
import type { Step } from '../types'

export const bootSteps: Step[] = [
  {
    id: 'bootloader-install',
    section: 'boot',
    title: 'boot.bootloader-install.title',
    body: ({ cfg, espMountPoint }) => [
      cmd(`bootctl ${cfg.secureBoot === 'shim-mok' ? '--variables=no ' : ''}install`),
      text('boot.bootloader-install.esp'),
    ],
  },
  {
    id: 'kernel-cmdline',
    section: 'boot',
    title: 'boot.kernel-cmdline.title',
    body: ({ cfg, rootDevice, rootFsDevice, luksName, rootSubvolume }) => [
      text('boot.kernel-cmdline.intro'),
      cmd(
        `echo "${
          cfg.encryption.mode === 'luks2'
            ? `rd.luks.name=$(blkid -s UUID -o value ${rootDevice})=${luksName} root=${rootFsDevice}`
            : `root=UUID=$(blkid -s UUID -o value ${rootDevice})`
        } rootflags=subvol=${rootSubvolume.name} rw${cfg.zram ? ' zswap.enabled=0' : ''}" > /etc/kernel/cmdline`,
      ),
      text('boot.kernel-cmdline.notes'),
      text('boot.kernel-cmdline.verify'),
      cmd('cat /etc/kernel/cmdline'),
    ],
  },
  {
    id: 'uki',
    section: 'boot',
    title: 'boot.uki.title',
    body: ({ cfg, espMountPoint }) => [
      text('boot.uki.preset'),
      cmd('vim /etc/mkinitcpio.d/linux.preset'),
      text('boot.uki.edits'),
      text('boot.uki.paths'),
      text('boot.uki.rebuild'),
      cmd(`mkdir -p ${espMountPoint}/EFI/Linux\nmkinitcpio -P`),
      text('boot.uki.menu'),
      text('boot.uki.check'),
      cmd('bootctl list'),
      text('boot.uki.entries'),
    ],
  },
  {
    id: 'secure-boot-custom-db',
    section: 'boot',
    title: 'boot.secure-boot-custom-db.title',
    when: (cfg) => cfg.secureBoot === 'custom-db',
    body: ({ espMountPoint }) => [
      text('boot.secure-boot-custom-db.setup-mode'),
      cmd(
        'sbctl status\n' +
          'sbctl create-keys\n' +
          'sbctl enroll-keys -m\n' +
          `sbctl sign -s ${espMountPoint}/EFI/systemd/systemd-bootx64.efi\n` +
          `sbctl sign -s ${espMountPoint}/EFI/BOOT/BOOTX64.EFI\n` +
          `find ${espMountPoint}/EFI/Linux -type f -name '*.efi' -exec sbctl sign -s {} \\;\n` +
          'sbctl verify',
      ),
      text('boot.secure-boot-custom-db.resign'),
      text('boot.secure-boot-custom-db.script'),
      cmd('vim /usr/local/sbin/update-sbctl-systemd-boot'),
      cmd(
        '#!/bin/sh\n' +
          'set -eu\n' +
          '\n' +
          `destination=${espMountPoint}/EFI/systemd\n` +
          `fallback=${espMountPoint}/EFI/BOOT\n` +
          'source=/usr/lib/systemd/boot/efi/systemd-bootx64.efi\n' +
          '\n' +
          'install_file() {\n' +
          '  install -m 644 "$1" "$2.new"\n' +
          '  mv "$2.new" "$2"\n' +
          '}\n' +
          '\n' +
          'install_file "$source" "$destination/systemd-bootx64.efi"\n' +
          'install_file "$source" "$fallback/BOOTX64.EFI"\n' +
          'sbctl sign-all',
        'sh',
      ),
      text('boot.secure-boot-custom-db.run'),
      cmd(
        'chmod 700 /usr/local/sbin/update-sbctl-systemd-boot\n/usr/local/sbin/update-sbctl-systemd-boot',
      ),
      text('boot.secure-boot-custom-db.hook'),
      cmd('vim /etc/pacman.d/hooks/95-sbctl-systemd-boot.hook'),
      cmd(
        '[Trigger]\n' +
          'Operation = Install\n' +
          'Operation = Upgrade\n' +
          'Type = Package\n' +
          'Target = systemd\n' +
          '\n' +
          '[Action]\n' +
          'Description = Updating the sbctl-signed systemd-boot copy\n' +
          'When = PostTransaction\n' +
          'Depends = sbctl\n' +
          'Exec = /usr/local/sbin/update-sbctl-systemd-boot',
      ),
    ],
  },
  {
    id: 'secure-boot-shim',
    section: 'boot',
    title: 'boot.secure-boot-shim.title',
    when: (cfg) => cfg.secureBoot === 'shim-mok',
    body: ({ cfg, espMountPoint }) => [
      text('boot.secure-boot-shim.install'),
      cmd(`sudo -u ${cfg.username} paru -S shim-signed\npacman -Q shim-signed`),
      text('boot.secure-boot-shim.version'),
      text('boot.secure-boot-shim.mok'),
      cmd(
        'install -d -m 700 /etc/secureboot\n' +
          "openssl req -new -x509 -newkey rsa:2048 -sha256 -keyout /etc/secureboot/MOK.key -out /etc/secureboot/MOK.crt -nodes -days 3650 -subj '/CN=Arch Linux MOK/'\n" +
          'openssl x509 -in /etc/secureboot/MOK.crt -outform DER -out /etc/secureboot/MOK.cer\n' +
          'chmod 600 /etc/secureboot/MOK.key',
      ),
      text('boot.secure-boot-shim.uki-conf'),
      cmd('vim /etc/kernel/uki.conf'),
      text('boot.secure-boot-shim.uki-append'),
      cmd(
        '[UKI]\n' +
          'SecureBootPrivateKey=/etc/secureboot/MOK.key\n' +
          'SecureBootCertificate=/etc/secureboot/MOK.crt',
      ),
      text('boot.secure-boot-shim.keep-pcr'),
      text('boot.secure-boot-shim.script'),
      cmd('vim /usr/local/sbin/update-shim-systemd-boot'),
      cmd(
        '#!/bin/sh\n' +
          'set -eu\n' +
          '\n' +
          `destination=${espMountPoint}/EFI/systemd\n` +
          `fallback=${espMountPoint}/EFI/BOOT\n` +
          'source=/usr/lib/systemd/boot/efi/systemd-bootx64.efi\n' +
          'signed="$source.signed"\n' +
          'workdir=$(mktemp -d)\n' +
          'trap \'rm -rf "$workdir"\' EXIT\n' +
          '\n' +
          'install -d -m 755 "$destination"\n' +
          'install -d -m 755 "$fallback"\n' +
          'sbsign --key /etc/secureboot/MOK.key --cert /etc/secureboot/MOK.crt --output "$workdir/systemd-bootx64.efi" "$source"\n' +
          '\n' +
          'install_file() {\n' +
          '  install -m 644 "$1" "$2.new"\n' +
          '  mv "$2.new" "$2"\n' +
          '}\n' +
          '\n' +
          'install_file "$workdir/systemd-bootx64.efi" "$signed"\n' +
          'install_file /usr/share/shim-signed/shimx64.efi "$destination/shimx64.efi"\n' +
          'install_file /usr/share/shim-signed/mmx64.efi "$destination/mmx64.efi"\n' +
          'install_file "$signed" "$destination/grubx64.efi"\n' +
          'install_file /usr/share/shim-signed/shimx64.efi "$fallback/BOOTX64.EFI"\n' +
          'install_file /usr/share/shim-signed/mmx64.efi "$fallback/mmx64.efi"\n' +
          'install_file "$signed" "$fallback/grubx64.efi"',
        'sh',
      ),
      text('boot.secure-boot-shim.run'),
      cmd(
        'chmod 700 /usr/local/sbin/update-shim-systemd-boot\n/usr/local/sbin/update-shim-systemd-boot',
      ),
      text('boot.secure-boot-shim.hook'),
      cmd('vim /etc/pacman.d/hooks/95-shim-systemd-boot.hook'),
      cmd(
        '[Trigger]\n' +
          'Operation = Install\n' +
          'Operation = Upgrade\n' +
          'Type = Package\n' +
          'Target = systemd\n' +
          'Target = shim-signed\n' +
          '\n' +
          '[Action]\n' +
          'Description = Updating the shim systemd-boot chain\n' +
          'When = PostTransaction\n' +
          'Depends = sbsigntools\n' +
          'Exec = /usr/local/sbin/update-shim-systemd-boot',
      ),
      text('boot.secure-boot-shim.verify'),
      cmd(
        'mkinitcpio -P\n' +
          `sbverify --cert /etc/secureboot/MOK.crt ${espMountPoint}/EFI/systemd/grubx64.efi\n` +
          `for uki in ${espMountPoint}/EFI/Linux/*.efi; do sbverify --cert /etc/secureboot/MOK.crt "$uki"; done`,
      ),
      text('boot.secure-boot-shim.enroll'),
      cmd(
        `efibootmgr --create --disk ${cfg.disk} --part 1 --label 'Arch Linux (shim)' --loader '\\EFI\\systemd\\shimx64.efi'\n` +
          'mokutil --import /etc/secureboot/MOK.cer\n' +
          'mokutil --list-new',
      ),
      text('boot.secure-boot-shim.mokmanager'),
    ],
  },
]
