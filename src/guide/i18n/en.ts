import { packagePurposeRows } from '../packages'
import type { Context } from '../types'

/** Guide prose, keyed by `<section>.<step>.<purpose>`. This file defines the full key set. */
export const prose = {
  'live.boot-mode.intro': 'After booting the Arch installation media, confirm the firmware mode:',
  'live.boot-mode.output': 'An output of `64` means 64-bit UEFI, so you can continue.',
  'live.boot-mode.bios':
    'If the file does not exist, the installation media booted in BIOS/CSM mode. This guide covers UEFI only; disable CSM in the firmware settings, then boot the installation media again.',
  'live.keymap.list': 'List every available layout:',
  'live.keymap.load': 'Load the layout you need:',
  'live.network.wired': 'A wired network usually gets an address on its own. Verify connectivity:',
  'live.network.wireless':
    'Wireless networks connect through `iwctl`. Look up the interface name first, then establish the connection; replace `wlan0` and `SSID` with the actual values:',
  'live.network.verify':
    'Run `ping` again once connected to confirm the network works. The remaining steps need it to stay up.',
  'live.network.ssh':
    'With a second device at hand, the `sshd` on the installation media is already running, so you can SSH in from that device and run the remaining commands in a terminal that supports copy and paste. Set a root password with `passwd`, then read the current address with `ip a`:',
  'live.network.address': 'Note the address, then run `ssh root@<address>` on the second device.',
  'live.clock.intro':
    'The installation media synchronizes the clock automatically. Check its status:',
  'live.clock.check':
    '`System clock synchronized` should read `yes`. An inaccurate system clock can make pacman signature checks fail later.',
  'live.mirrors.intro': ({ cfg }: Context) =>
    `Use reflector to select HTTPS mirrors in ${cfg.reflector.countries.join(',')} that synchronized within the last ${cfg.reflector.ageHours} hours, sort them by download rate, and keep ${cfg.reflector.number}:`,
  'live.mirrors.inspect': 'Inspect the generated list:',
  'live.mirrors.https':
    'Every `Server` address in the list should start with `https://`. The mirrorlist generated on the installation media is copied into the new system by the later `pacstrap`.',

  'disk.identify.intro': 'List every block device:',
  'disk.identify.warning': ({ cfg }: Context) =>
    `This guide targets \`${cfg.disk}\`. **The next step erases all data on that disk.** Confirm by size and model that the real target is \`${cfg.disk}\`; if the device name differs, do not continue.`,
  'disk.partition.table': ({ cfg, espDevice, rootDevice }: Context) =>
    'Create a GPT partition table and two partitions:\n\n' +
    '| Partition | Size | Type | Purpose |\n' +
    '| --- | --- | --- | --- |\n' +
    `| \`${espDevice}\` | ${cfg.espSize} | EFI System | ESP, holds the kernel and boot loader |\n` +
    `| \`${rootDevice}\` | All remaining space | Linux filesystem | btrfs root |`,
  'disk.partition.flags':
    'The options run left to right: `-o` clears the partition table, `-n number:start:end` creates a partition (`0` takes the default, and `0` as the end uses all remaining space), and `-t` sets the type; `ef00` is EFI System, `8300` is Linux filesystem. Check the result:',
  'disk.luks.intro': ({ luksName }: Context) =>
    `Set a LUKS password for the root partition and open it as \`/dev/mapper/${luksName}\`:`,
  'disk.luks.slot':
    'This password occupies a key slot of its own. Keep it even after enrolling TPM2 later: it is the fallback whenever the TPM state changes.',
  'disk.format.intro': ({ cfg }: Context) =>
    `Format the ESP as FAT32, the filesystem UEFI firmware supports universally, and create btrfs on ${cfg.encryption.mode === 'luks2' ? 'the opened LUKS mapping' : 'the root partition'}:`,
  'disk.subvolumes.create':
    'Mount the btrfs top level first, create the subvolumes, then unmount it:',
  'disk.subvolumes.table': ({ subvolumes }: Context) =>
    'The subvolumes sit flat at the top level, each with its own purpose:\n\n' +
    '| Subvolume | Mount point |\n' +
    '| --- | --- |\n' +
    subvolumes.map((s) => `| \`${s.name}\` | \`${s.mountPoint}\` |`).join('\n'),
  'disk.subvolumes.snapshots': ({ cfg }: Context) =>
    cfg.subvolumeLayout === 'separated'
      ? '`@log`, `@pkg`, and `@boot` are all left out of the snapshots of `@`. This layout works with or without snapshots, so snapper is optional.'
      : '',
  'disk.mount.intro': 'Mount in order of mount point depth, and mount the ESP last:',
  'disk.mount.options': ({ mountOptions }: Context) =>
    `\`genfstab\` writes these mount options into fstab. The btrfs subvolumes use \`${mountOptions}\`; the ESP uses \`noatime\` so that reading a file does not update its access time, and \`umask=0077\` to restrict it to root.`,
  'disk.mount.esp': ({ cfg, espMountPoint }: Context) =>
    `The ESP is mounted at \`${espMountPoint}\`: the UKI used for booting ends up there, and both the firmware and systemd-boot need to read it from a FAT filesystem. ${cfg.subvolumeLayout === 'separated' ? '`/boot` is the `@boot` subvolume on the root btrfs filesystem and only holds the vmlinuz installed by pacman and the intermediate files from mkinitcpio.' : '`/boot` is an ordinary directory inside the root subvolume.'}`,
  'disk.mount.check': 'Check:',
  'disk.mount.count': ({ subvolumes }: Context) =>
    `You should see ${subvolumes.length} btrfs subvolumes plus one ESP.`,

  'live.boot-mode.title': 'Confirm the UEFI boot mode',
  'live.keymap.title': 'Keyboard layout',
  'live.network.title': 'Connect to the network',
  'live.clock.title': 'Check the clock',
  'live.mirrors.title': 'Select mirrors',
  'disk.identify-disk.title': 'Confirm the target disk',
  'disk.partition.title': 'Partition',
  'disk.luks-format.title': 'Create the LUKS2 container',
  'disk.format.title': 'Format',
  'disk.subvolumes.title': 'Create subvolumes',
  'disk.mount.title': 'Mount',
  'install.pacstrap.title': 'Install the base system',
  'install.fstab.title': 'Generate fstab',
  'system.chroot.title': 'Enter the new system',
  'system.timezone.title': 'Time zone',
  'system.locale.title': 'Localization',
  'system.hostname.title': 'Hostname',
  'system.root-password.title': 'Root password',
  'system.user.title': 'Create a user',
  'system.aur-helper.title': 'Install an AUR helper',
  'system.network-service.title': 'Enable networking',
  'storage.zram.title': 'Configure zram',
  'storage.swapfile.title': 'Create a swapfile',
  'storage.initramfs-encryption.title': 'Enable unlocking in the systemd initramfs',
  'storage.snapper-config.title': 'Configure Snapper',
  'storage.pcr-signing-policy.title': 'Create the PCR 11 signing policy',
  'boot.bootloader-install.title': 'Install systemd-boot',
  'boot.kernel-cmdline.title': 'Kernel command line',
  'boot.uki.title': 'Build the UKI',
  'boot.secure-boot-custom-db.title': 'Enroll custom Secure Boot keys',
  'boot.secure-boot-shim.title': 'Set up the shim and MOK trust chain',
  'desktop.graphics-driver.title': 'Install the graphics driver',
  'desktop.audio.title': 'Install the audio stack',
  'desktop.desktop-common.title': 'Install Bluetooth, fonts, and input methods',
  'desktop.cjk-font-priority.title': 'Set the font priority',
  'desktop.gnome-kimpanel.title': 'Enable the Kimpanel extension',
  'desktop.kde-fcitx.title': 'Enable the input method in KDE',
  'desktop.desktop-environment.title': 'Install the desktop environment',
  'hyprland.hyprland-extras.title': 'Install the session software',
  'hyprland.hyprland-elephant.title': 'Enable the Elephant service',
  'hyprland.hyprland-programs.title': 'Set the default programs',
  'hyprland.hyprland-lock.title': 'Configure locking and idle',
  'hyprland.hyprland-wallpaper.title': 'Configure the wallpaper',
  'hyprland.hyprland-screenshot.title': 'Configure the screenshot shortcuts',
  'hyprland.hyprland-keyring.title': 'Unlock the keyring at login',
  'finish.reboot.title': 'Reboot',
  'finish.post-install.title': 'After the first boot',
  'finish.secure-boot-shim-verify.title': 'Verify Secure Boot with shim',
  'finish.tpm2-enroll.title': 'Enroll TPM2 unlocking',
  'section.live': 'Live environment',
  'section.disk': 'Disk',
  'section.install': 'Base system',
  'section.system': 'System configuration',
  'section.storage': 'Storage configuration',
  'section.boot': 'Boot',
  'section.desktop': 'Desktop and graphics',
  'section.hyprland': 'Hyprland session',
  'section.finish': 'Wrapping up',

  'install.pacstrap.purposes': (ctx: Context, t: (key: string) => string) =>
    '`-K` creates and initializes a fresh pacman keyring in the target system instead of copying the one from the installation media.\n\nWhat each package is for:\n\n| Package | Purpose |\n| --- | --- |\n' +
    packagePurposeRows(ctx, t) +
    '\n\nThis step downloads a few hundred MB; how long it takes depends on the mirrors.',
  'package.base': 'Base system',
  'package.linux': 'Kernel and firmware',
  'package.btrfs-progs': 'btrfs tools, required by the root filesystem',
  'package.microcode': 'CPU microcode, loaded at boot',
  'package.cryptsetup': 'Creates and opens LUKS2 volumes',
  'package.networkmanager': 'Manages network connections',
  'package.sudo': 'Runs commands with root privileges',
  'package.vim': 'Edits configuration files',
  'package.zram-generator': 'Configures zram',
  'package.snapper': 'Manages btrfs snapshots',
  'package.sbctl': 'Manages custom Secure Boot keys and signs EFI files',
  'package.systemd-ukify':
    'Builds the UKI and, depending on the configuration, creates the Secure Boot or PCR 11 signatures',
  'package.base-devel': 'Base toolchain for compiling and packaging software',
  'package.git': 'Version control, clones repositories',
  'package.secure-boot-tools': 'Creates UEFI boot entries, imports the MOK, and signs EFI files',
  'install.fstab.uuid':
    '`-U` uses UUIDs rather than device names, so the right filesystems still mount after the disk changes slots or another disk is added.\n\nInspect the generated file and confirm that every subvolume carries the correct `subvol=` option and mount options:',
  'install.fstab.check':
    'A wrong fstab can leave the system unable to boot, so check it carefully before continuing.',

  'system.chroot.scope':
    'From this step until you leave the chroot, every command runs inside the new system. The prompt changes to `[root@archiso /]#`.',
  'system.timezone.hwclock':
    '`hwclock --systohc` writes the current system time to the hardware clock and generates `/etc/adjtime`.',
  'system.timezone.list': '`timedatectl list-timezones` lists the other time zone names.',
  'system.locale.uncomment': ({ cfg }: Context) =>
    `Edit \`/etc/locale.gen\` and uncomment the UTF-8 locale line for \`en_US.UTF-8\`${
      cfg.systemLocale === 'en_US.UTF-8' ? '' : ` and \`${cfg.systemLocale}\``
    }:`,
  'system.locale.generate': 'Generate the locales:',
  'system.locale.lang': 'Set the system language:',
  'system.locale.keymap': 'Set the virtual console keyboard layout:',
  'system.locale.vconsole':
    '`/etc/vconsole.conf` only affects the TTY; a desktop environment uses its own keyboard configuration.',
  'system.user.create': ({ cfg }: Context) =>
    `Create the user \`${cfg.username}\` and add them to the \`wheel\` group:`,
  'system.user.sudo':
    'Grant sudo privileges to the `wheel` group. The following command opens an editor; delete the `#` at the start of the `%wheel ALL=(ALL:ALL) ALL` line:',
  'system.user.visudo':
    'Always use `visudo`, never edit `/etc/sudoers` directly. `visudo` checks the syntax before saving, so a broken file cannot lock you out of sudo.',
  'system.aur-helper.why':
    '`pacman` does not manage the AUR, and a manually built package never updates with `pacman -Syu`. Handing it to `paru` is what keeps the updates coming.',
  'system.aur-helper.build':
    '`paru` itself comes from the AUR, so it has to be built by hand. AUR builds must run as a regular user:',
  'system.aur-helper.update':
    'From here on, `paru -Syu` updates the official repositories and the AUR packages together.',
  'system.network-service.why':
    'Without this service enabled, the new system cannot connect automatically after a reboot. The network configuration on the installation media does not carry over.',

  'finish.reboot.unmount': 'Leave the chroot, unmount everything, and reboot:',
  'finish.reboot.recursive':
    '`umount -R` unmounts recursively, so no btrfs data is left unwritten to disk.',
  'finish.reboot.media': ({ cfg }: Context) =>
    `Remove the installation media before rebooting. The systemd-boot menu is hidden by default and the regular UKI boots straight away; hold Space at power-on to bring up the menu and pick the fallback. Once the system is up, log in as \`${cfg.username}\`.`,
  'finish.post-install.terminal': 'After logging in, press `SUPER + Q` to open a terminal.',
  'finish.post-install.network': 'Confirm the network:',
  'finish.post-install.offline': ({ cfg }: Context) =>
    `If there is no connection, ${
      cfg.desktop === 'gnome' || cfg.desktop === 'kde'
        ? 'configure it in the settings app of the desktop environment'
        : 'configure it with `nmtui`'
    }.`,
  'finish.post-install.done': ({ cfg }: Context) =>
    `At this point the minimal system should boot, reach the network, and accept a login from the regular user.${cfg.snapper === 'none' ? ' No snapshots are configured.' : ''}`,
  'finish.secure-boot-shim-verify.expect':
    'The three commands should confirm that Secure Boot is enabled, that the MOK is enrolled, and that `/EFI/systemd/grubx64.efi` is listed.',
  'finish.tpm2-enroll.intro': ({ cfg }: Context) =>
    `Enroll TPM2 unlocking in the installed system${cfg.secureBoot === 'none' ? '. Secure Boot is off here, so PCR 7 only records "Secure Boot disabled" and cannot verify the signatures of the boot files' : ''}:`,
  'finish.tpm2-enroll.slots': ({ cfg }: Context) =>
    `Enter the LUKS password you kept${cfg.encryption.mode === 'luks2' && cfg.encryption.unlock.method === 'tpm2' && cfg.encryption.unlock.pin ? ', then set a TPM PIN' : ''}. The list must keep both the \`password\` slot and the new \`tpm2\` token.`,
  'finish.tpm2-enroll.done': 'TPM2 unlocking is now configured.',

  'storage.zram.create': 'Create the zram-generator configuration:',
  'storage.zram.write': 'Write:',
  'storage.zram.result':
    'After a reboot, systemd creates `/dev/zram0`, a compressed swap device half the size of physical memory.',
  'storage.swapfile.create': ({ cfg }: Context) =>
    `Create a ${cfg.diskSwapSizeGiB} GiB swapfile on the separate \`@swap\` subvolume:`,
  'storage.swapfile.notes':
    '`@swap` is left out of the root subvolume snapshots. `--uuid clear` keeps the swapfile from being mistaken for a mountable filesystem.',
  'storage.initramfs-encryption.edit': 'Edit the mkinitcpio configuration:',
  'storage.initramfs-encryption.hooks': 'Add `sd-encrypt` after `block` on the `HOOKS` line:',
  'storage.initramfs-encryption.warning':
    'Leave the rest of that line and its order untouched. `systemd` and `sd-encrypt` are what open LUKS2 before the root filesystem is mounted.',
  'storage.snapper-config.intro':
    'Let Snapper create the configuration, then replace the nested snapshot subvolume it creates with the top-level one prepared during installation:',
  'storage.snapper-config.dbus':
    'The chroot used for installation runs no system D-Bus, so `--no-dbus` lets Snapper write the configuration directly.',
  'storage.snapper-config.verify': 'Check the configuration and the separate mount point:',
  'storage.pcr-signing-policy.key':
    'Create the PCR signing key that ukify uses every time it builds a UKI:',
  'storage.pcr-signing-policy.conf':
    'Create `/etc/kernel/uki.conf`, the configuration file mkinitcpio passes to ukify:',
  'storage.pcr-signing-policy.write': 'Write:',
  'storage.pcr-signing-policy.phases':
    '`Phases=enter-initrd` limits this signing policy to the initrd phase, so the TPM cannot unseal the root unlock key again once the system has switched to the real root.',
  'storage.pcr-signing-policy.rebuild':
    'When a UKI is generated, mkinitcpio detects the installed ukify, calls it automatically, and it reads `/etc/kernel/uki.conf`. On every kernel update that rebuilds the UKI, ukify recalculates PCR 11, signs the policy, and embeds the public key and signature into the image.',

  'hyprland.hyprland-extras.intro': 'Install the Hyprland session software you selected:',
  'hyprland.hyprland-extras.global':
    '`--global` enables these user services for every user; they start with `hyprland-session.target`.',
  'hyprland.hyprland-extras.aur': 'The following packages are built as a regular user:',
  'hyprland.hyprland-elephant.why':
    'Walker retrieves no data itself, so Elephant has to be running in the user session before it starts. It needs the environment variables of that session, which is why it runs as a user service rather than a system one.',
  'hyprland.hyprland-elephant.create': 'Create `/etc/systemd/user/elephant.service`:',
  'hyprland.hyprland-elephant.write': 'Write:',
  'hyprland.hyprland-elephant.enable': 'Enable it:',
  'hyprland.hyprland-elephant.providers':
    'Each data source for Walker is a separate `elephant-*` package, and the previous step installed only the application list. Install the remaining ones — calculator, files, clipboard, windows — as needed; each package declares its own runtime dependencies.',
  'hyprland.hyprland-programs.edit': ({ cfg }: Context) =>
    `Edit \`/home/${cfg.username}/.config/hypr/hyprland.lua\`:`,
  'hyprland.hyprland-programs.section': 'Change the `MY PROGRAMS` section to:',
  'hyprland.hyprland-programs.binds':
    'The three lines correspond to `SUPER + Q`, `SUPER + E`, and `SUPER + R`.',
  'hyprland.hyprland-lock.copy': 'Copy the example configurations for Hyprlock and Hypridle:',
  'hyprland.hyprland-lock.bind': ({ cfg }: Context) =>
    `Add a manual lock binding to the \`KEYBINDINGS\` section of \`/home/${cfg.username}/.config/hypr/hyprland.lua\`:`,
  'hyprland.hyprland-lock.brightnessctl':
    'The two backlight listeners in the example `hypridle.conf` depend on `brightnessctl`; without it they have no effect, and locking, screen blanking, and suspend still work.',
  'hyprland.hyprland-wallpaper.create': ({ cfg }: Context) =>
    `Hyprpaper ships no default wallpaper, so the image to load has to be named. Create \`/home/${cfg.username}/.config/hypr/hyprpaper.conf\`:`,
  'hyprland.hyprland-wallpaper.write':
    'Write (an empty `monitor` applies the wallpaper to every display):',
  'hyprland.hyprland-wallpaper.chown': 'Fix the owner:',
  'hyprland.hyprland-screenshot.binds': ({ cfg }: Context) =>
    `Add the following to the \`KEYBINDINGS\` section of \`/home/${cfg.username}/.config/hypr/hyprland.lua\`:`,
  'hyprland.hyprland-screenshot.location':
    'Screenshots go to the directory `XDG_PICTURES_DIR` points at, or to `~` when it is unset, and land on the clipboard as well.',
  'hyprland.hyprland-keyring.edit': 'Edit `/etc/pam.d/greetd`:',
  'hyprland.hyprland-keyring.append': 'Append at the end of the file:',
  'hyprland.hyprland-keyring.unlock':
    'The login password then unlocks the default keyring as well. Without these two lines the keyring still works, but every access asks for its password separately.',
  'hyprland.hyprland-keyring.seahorse':
    'Seahorse provides a graphical interface for viewing and managing stored passwords.',

  'boot.bootloader-install.esp': ({ cfg, espMountPoint }: Context) =>
    `\`bootctl\` checks \`/efi\`, \`/boot\`, and \`/boot/efi\` in turn to locate the ESP, and finds \`${espMountPoint}\` here. It installs the boot loader onto the ESP${cfg.secureBoot === 'shim-mok' ? ', but creates no firmware boot entry pointing at systemd-boot directly; only the shim entry is registered later' : ' and puts the matching entry first in the firmware boot order'}, and creates the ESP directory structure, in which \`EFI/Linux/\` is where the UKI is written later.`,
  'boot.kernel-cmdline.intro':
    'The kernel parameters go into `/etc/kernel/cmdline` and are embedded into the image when the UKI is built:',
  'boot.kernel-cmdline.notes': ({ cfg, rootSubvolume }: Context) =>
    `- \`$(blkid ...)\` expands to the${cfg.encryption.mode === 'luks2' ? ' LUKS2 container' : ' btrfs'} UUID when the command runs, so nothing has to be typed by hand.\n` +
    `- \`rootflags=subvol=${rootSubvolume.name}\` cannot be omitted. btrfs mounts the top level by default, and without this parameter the kernel cannot locate the root subvolume.\n` +
    '- The parameters are embedded in the image; after changing them, `mkinitcpio -P` has to run again before they take effect.',
  'boot.kernel-cmdline.verify': 'Check the expanded result:',
  'boot.uki.preset': 'Edit the kernel preset to switch the output from separate images to a UKI:',
  'boot.uki.edits':
    'Change the preset as follows:\n\n' +
    "- Comment out `PRESETS=('default')` and uncomment `PRESETS=('default' 'fallback')`, so that both the regular and the fallback image are built.\n" +
    '- Uncomment `default_uki` and `fallback_uki`.\n' +
    '- Comment out `default_image`.',
  'boot.uki.paths': ({ cfg, espMountPoint }: Context) =>
    `The paths in \`default_uki\` and \`fallback_uki\` should read \`${espMountPoint}/EFI/Linux/\` and need no change.${cfg.encryption.mode === 'none' ? '' : '\n\nThe systemd initramfs configured earlier puts the LUKS2 unlocking logic into the UKI as well.'}`,
  'boot.uki.rebuild': 'Rebuild:',
  'boot.uki.menu': ({ espMountPoint }: Context) =>
    `systemd-boot enumerates the images in \`${espMountPoint}/EFI/Linux/\` automatically and builds the boot menu, listing the regular entry ahead of the fallback. The fallback image skips the autodetect trimming, so it can bring the system back when the regular image fails to boot because a driver is missing.`,
  'boot.uki.check': 'Check:',
  'boot.uki.entries':
    'Two `type #2` entries should appear, pointing at the two images under `EFI/Linux/`.',
  'boot.secure-boot-custom-db.setup-mode':
    'Confirm the firmware is in Setup Mode, then create and enroll the keys:',
  'boot.secure-boot-custom-db.resign':
    '`sbctl status` has to report Setup Mode; otherwise enable Setup Mode in the firmware settings, where the exact entry and wording differ per board. sbctl records the files it has signed and signs them again after a kernel update rebuilds the UKI — but that covers the UKI only. The two systemd-boot binaries on the ESP, `EFI/systemd/systemd-bootx64.efi` and `EFI/BOOT/BOOTX64.EFI`, are not refreshed automatically and need handling of their own.',
  'boot.secure-boot-custom-db.script': 'Create `/usr/local/sbin/update-sbctl-systemd-boot`:',
  'boot.secure-boot-custom-db.run': 'Run the script:',
  'boot.secure-boot-custom-db.hook': 'Create `/etc/pacman.d/hooks/95-sbctl-systemd-boot.hook`:',
  'boot.secure-boot-shim.install':
    'Install `shim-signed`, pre-signed by Fedora. AUR operations must run as a regular user:',
  'boot.secure-boot-shim.version':
    '`shim-signed` has to be version 16.1 or newer for systemd-boot to load a MOK-signed UKI through the loader protocol of shim.',
  'boot.secure-boot-shim.mok': 'Create the MOK:',
  'boot.secure-boot-shim.uki-conf': 'Edit `/etc/kernel/uki.conf`:',
  'boot.secure-boot-shim.uki-append': 'Add:',
  'boot.secure-boot-shim.keep-pcr':
    'If the file already contains a PCR signing configuration, keep it as it is.',
  'boot.secure-boot-shim.script': 'Create `/usr/local/sbin/update-shim-systemd-boot`:',
  'boot.secure-boot-shim.run': 'Run the script:',
  'boot.secure-boot-shim.hook': 'Create `/etc/pacman.d/hooks/95-shim-systemd-boot.hook`:',
  'boot.secure-boot-shim.verify':
    'Rebuild the UKI and confirm that systemd-boot and both UKIs are signed with the MOK:',
  'boot.secure-boot-shim.enroll':
    'Create the shim boot entry and submit the MOK enrollment request:',
  'boot.secure-boot-shim.mokmanager':
    'Set a one-time password for `mokutil --import`. On reboot, enable Secure Boot in the firmware first, then boot `Arch Linux (shim)`; in MokManager, choose `Enroll MOK`, enter the one-time password, and confirm.',

  'desktop.graphics-driver.intro': ({ cfg }: Context) =>
    `Install the packages the ${cfg.graphics.toUpperCase()} graphics card needs:`,
  'desktop.graphics-driver.nvidia':
    '`nvidia-open` covers Turing and newer architectures. Do not run this command on Pascal or older cards; check which legacy driver matches the specific model first.',
  'desktop.audio.intro':
    'Install the PipeWire audio server, the WirePlumber session manager, and a volume control:',
  'desktop.desktop-common.intro': ({ cfg }: Context) =>
    `Install the Noto font families, including CJK and emoji. ${
      cfg.desktop === 'hyprland'
        ? 'Install the BlueZ Bluetooth backend and tools, the Blueman management interface, Fcitx 5, and its GTK/Qt frontends and configuration tool'
        : 'Install Fcitx 5 and its GTK/Qt frontends and configuration tool'
    }${
      cfg.systemLocale.startsWith('zh_')
        ? ', plus the Pinyin engine for the current Chinese locale'
        : cfg.systemLocale.startsWith('ja_')
          ? ', plus the Mozc engine for the current Japanese locale'
          : cfg.systemLocale.startsWith('ko_')
            ? ', plus the Hangul engine for the current Korean locale'
            : ''
    }:`,
  'desktop.desktop-common.gnome-ibus':
    'GNOME configures the session input method as ibus; Fcitx 5 is started by its autostart entry and takes over from ibus, so no environment variables are needed.',
  'desktop.desktop-common.kimpanel':
    'Install the Kimpanel extension. AUR operations must run as a regular user:',
  'desktop.desktop-common.kde-env':
    'Set the input method environment variables for XWayland applications:',
  'desktop.desktop-common.write': 'Write:',
  'desktop.desktop-common.gtk':
    'GTK applications take the input method module from a configuration file instead, which only affects GTK programs under X11/XWayland:',
  'desktop.desktop-common.gtk2': ({ cfg }: Context) =>
    `To run GTK2 programs, create \`/home/${cfg.username}/.gtkrc-2.0\` as well:`,
  'desktop.desktop-common.chown': 'Fix the owner of both files:',
  'desktop.desktop-common.kde-autostart':
    'KDE starts Fcitx 5 through KWin, so suppress the XDG autostart entry:',
  'desktop.cjk-font-priority.create': 'Create `/etc/fonts/conf.d/64-noto-cjk.conf`:',
  'desktop.cjk-font-priority.write': 'Write:',
  'desktop.gnome-kimpanel.enable':
    'After the first GNOME login, enable Kimpanel in the extensions manager, otherwise the input method candidate window will not appear.',
  'desktop.kde-fcitx.enable':
    'After the first login to KDE Plasma, open System Settings → Virtual Keyboard and select Fcitx 5.',
  'desktop.desktop-environment.intro': ({ desktopName }: Context) => `Install ${desktopName}:`,
  'desktop.desktop-environment.greetd':
    'Configure greetd to use the ReGreet graphical login. Create `/etc/greetd/hyprland.lua`:',
  'desktop.desktop-environment.write': 'Write:',
  'desktop.desktop-environment.greetd-config': 'Edit `/etc/greetd/config.toml`:',
  'desktop.desktop-environment.greetd-command': 'Change `command` under `[default_session]` to:',
  'desktop.desktop-environment.session-target':
    'Create `/etc/systemd/user/hyprland-session.target`:',
  'desktop.desktop-environment.session-write': 'Write:',
  'desktop.desktop-environment.copy-config':
    'Copy the default configuration to serve as the Hyprland configuration of this user:',
  'desktop.desktop-environment.env': 'Add to the `ENVIRONMENT VARIABLES` section:',
  'desktop.desktop-environment.autostart': 'Add to the `AUTOSTART` section:',
  'desktop.desktop-environment.display-manager': ({ displayManager }: Context) =>
    `After the reboot, \`${displayManager}\` provides the graphical login.`,
}

/** Translated interface labels; wording that never changes lives in `neutral.ts`. */
export const ui = {
  title: 'Arch Linux Installation Guide',
  welcomeTitle: 'Generate an Arch Linux installation guide that fits your machine',
  welcomeBody:
    'Work through the wizard to configure the system, and end with an installation guide you can follow command by command or print.',
  start: 'Start configuring',
  copy: 'Copy',
  copied: 'Copied',
  print: 'Save as PDF',
  editConfig: 'Edit configuration',
  installationTarget: 'Installation target',
  diskTutorial: 'Confirm the target disk',
  diskTutorialBeforeCommand:
    'Boot the installation media on the computer you are installing Arch Linux on, then run',
  diskTutorialAfterCommand:
    '. Use SIZE and TYPE to find the whole target disk. Enter the device name after the fixed /dev/ prefix, such as nvme0n1 or sda, not a partition name like nvme0n1p1 or sda1.',
  diskEraseWarning:
    'The partitioning commands in the guide erase all data on the target disk. Make sure the device name is correct.',
  storage: 'Storage',
  regionLanguage: 'Region and language',
  baseSystem: 'Base system',
  review: 'Review',
  backToWelcome: 'Back to start',
  previous: 'Previous',
  next: 'Next',
  selectPlaceholder: 'Select',
  unavailable: (reason: string) => `Unavailable: ${reason}`,
  generateGuide: 'Generate the guide',
  wizardProgress: (current: number, total: number) => `Step ${current} of ${total}`,
  verifiedAgainst: 'Verified against Arch as of',
  configSummary: 'Configuration for this guide',
  enabled: 'Enabled',
  disabled: 'Disabled',
  none: 'None',
  listSeparator: ', ',
  targetDisk: 'Target disk',
  diskSwap: 'Disk swap',
  diskSwapSize: 'Size (GiB)',
  subvolumes: 'Subvolume layout',
  encryption: 'Disk encryption',
  unlock: 'Unlock method',
  password: 'Password',
  tpmPolicy: 'TPM2 binding policy',
  requireTpmPin: 'Require a TPM PIN at boot',
  pcr7Warning:
    'Binding PCR 7 alone does not distinguish one UKI from another, and with Secure Boot off it records only that Secure Boot is disabled.',
  tpmPolicyRequiresSecureBoot: (mode: string) => `The current TPM2 binding policy requires ${mode}`,
  snapperRequiresSeparated: 'Requires the separate subvolume layout',
  hashPcrs: 'PCR hash binding',
  signedPcrs: 'PCR signing policy',
  secureBoot: 'Secure Boot',
  snapperUnsupportedRootOnly: 'Snapper is not recommended with a single root subvolume',
  desktop: 'Desktop environment',
  hyprlandExtras: 'Hyprland session',
  hyprlandExtrasHint:
    'Hyprland provides only the compositor and the session; each of the following is chosen separately.',
  hyprlandNotifications: 'Notifications',
  hyprlandLauncher: 'Application launcher',
  hyprlandFileManager: 'File manager',
  hyprlandTerminal: 'Terminal',
  hyprlandBar: 'Status bar',
  hyprlandLock: 'Lock screen and idle',
  hyprlandWallpaper: 'Wallpaper and color temperature',
  hyprlandScreenshot: 'Screenshots',
  hyprlandKeyring: 'Keyring',
  graphics: 'Graphics',
  reflector: 'Mirrors',
  mirrorCountry: 'Country codes',
  mirrorCountryHint: 'One or more ISO country codes separated by commas, for example CA,US.',
  mirrorCountryInvalid: 'Enter valid ISO country codes separated by commas',
  mirrorAge: 'Synchronized within (hours)',
  mirrorNumber: 'Mirrors to keep',
  timezone: 'Time zone',
  timezoneHint: 'The time zone the installed system will use.',
  detectedTimezone: (timezone: string) => `Detected time zone: ${timezone}`,
  useDetectedTimezone: 'Use it',
  systemLocale: 'System language',
  systemLocaleHint:
    'The locale system services, the terminal, and the login screen use by default.',
  cjkTtyWarning:
    'The TTY cannot display CJK characters and shows boxes instead. Choose a CJK system language only with a graphical interface planned; for a command-line system, pick a non-CJK locale.',
  keymap: 'Keyboard layout',
  keymapHint: 'The keyboard layout used in the installation environment and the virtual console.',
  hostname: 'Hostname',
  hostnameHint:
    'The name this computer uses locally and on the network, such as archlinux or workstation.',
  username: 'Username',
  usernameHint: 'The regular account used for everyday logins; root is not allowed.',
  language: 'Language',
  theme: 'Theme',
  themeAuto: 'System',
  themeLight: 'Light',
  themeDark: 'Dark',
  wizardSteps: 'Configuration progress',
  disclaimer: 'This site is not affiliated with Arch Linux.',
  stepCount: (total: number) => `${total} steps`,
}

/** Translated labels of the wizard options; product names live in `neutral.ts`. */
export const choices = {
  zram: {
    false: 'Off',
    true: 'On',
  },
  diskSwap: {
    none: 'None',
  },
  subvolumeLayout: {
    'root-only': 'Single root subvolume (simpler)',
    separated: 'Separate subvolumes (supports snapshots)',
  },
  encryption: {
    none: 'Off',
    password: 'LUKS2 (password)',
    tpm2: 'LUKS2 (TPM2)',
  },
  tpm2Preset: {
    minimal: 'Minimal (PCR 7)',
    'custom-db': 'Recommended (custom db)',
    'shim-mok': 'Recommended (shim/MOK)',
  },
  secureBoot: {
    none: 'Off',
    'custom-db': 'Custom UEFI db',
  },
  snapper: {
    none: 'Not configured',
  },
  desktop: {
    none: 'None',
  },
  hyprlandNotifications: {
    none: 'Not installed',
  },
  hyprlandBar: {
    none: 'Not installed',
  },
  hyprlandLock: {
    none: 'Not installed',
  },
}

/** One-line explanations shown under each wizard option; this file carries the full set. */
export const choiceDescriptions = {
  cpu: {
    intel: 'Installs the intel-ucode microcode package that Intel processors need.',
    amd: 'Installs the amd-ucode microcode package that AMD processors need.',
  },
  zram: {
    false: 'No zram.',
    true: 'Uses zram to create compressed swap in memory.',
  },
  diskSwap: {
    none: 'No swap on disk.',
    swapfile: 'Creates a swapfile on the Btrfs filesystem.',
  },
  subvolumeLayout: {
    'root-only': 'Creates only @. Simpler, but Snapper cannot be configured.',
    separated:
      'Puts /boot, /home, the logs, and the package cache on separate subvolumes of the same Btrfs filesystem, which controls what a root snapshot contains and allows Snapper.',
  },
  encryption: {
    none: 'Leaves the root filesystem unencrypted; the ESP stays unencrypted in every mode.',
    password: 'Protects the system data with LUKS2, unlocked by typing a password at every boot.',
    tpm2: 'Uses LUKS2 with the TPM2 verifying the boot state; a PIN can be required as well.',
  },
  tpm2Preset: {
    minimal:
      'Hash-binds PCR 7. Kernel updates need no re-enrollment, but images signed with the same key cannot be told apart.',
    'custom-db':
      'Binds PCR 7, and binds PCR 11 through a signing policy; selects the custom UEFI db as well.',
    'shim-mok':
      'Binds PCR 7+14, and binds PCR 11 through a signing policy; selects shim-signed + MOK as well.',
  },
  secureBoot: {
    none: 'Does not verify the signatures of the boot files.',
    'custom-db':
      'Enrolls a custom certificate into the firmware UEFI db; the firmware has to support Setup Mode.',
    'shim-mok':
      'Builds the trust chain from the Microsoft-signed shim and a MOK you enroll yourself.',
  },
  snapper: {
    none: 'Creates no Snapper configuration.',
    root: 'Creates and manages snapshots of the root system only.',
    'root-home': 'Creates separate snapshot configurations for the root system and for home.',
  },
  desktop: {
    none: 'Installs the command-line base system only; a desktop can still be added later.',
    gnome: 'Installs the GNOME desktop environment.',
    kde: 'Installs the KDE Plasma desktop environment.',
    hyprland: 'Installs the Hyprland Wayland compositor.',
  },
  graphics: {
    intel:
      'Installs Mesa, the Intel Vulkan driver, and video acceleration for modern Intel integrated graphics.',
    amd: 'Installs Mesa, the AMD Vulkan driver, and the Mesa video acceleration drivers.',
    nvidia:
      'Installs the NVIDIA open kernel modules and userspace drivers, for Turing and newer architectures.',
  },
  hyprlandNotifications: {
    none: 'Installs no notification daemon, so notifications from applications never appear.',
    swaync: 'Includes a notification center panel for reviewing past notifications.',
    mako: 'Displays notifications only, without a panel.',
  },
  hyprlandLauncher: {
    hyprlauncher:
      'The launcher from the Hyprland ecosystem, and what SUPER + R points at in the default configuration.',
    rofi: 'Also works as a window switcher, a dmenu replacement, and more.',
    wofi: 'Launches applications only, with few options.',
    walker: 'A GTK4 launcher; the Elephant service supplies the data it searches.',
  },
  hyprlandFileManager: {
    nautilus: 'The GNOME file manager, installed with SMB support and space-bar previews.',
    dolphin:
      'The KDE file manager, installed with thumbnail plugins; SMB support comes from its kio-extras dependency.',
    thunar:
      'The Xfce file manager, installed with GVfs, SMB support, thumbnails, removable media, and archive plugins.',
  },
  hyprlandTerminal: {
    ghostty: 'GPU rendered; configuration changes take effect immediately.',
    kitty: 'GPU rendered, with built-in splits and an image protocol.',
  },
  hyprlandBar: {
    none: 'Installs no status bar.',
    waybar:
      'Shows workspaces, the tray, and system status, using the default configuration from the distribution.',
  },
  hyprlandLock: {
    none: 'Installs no lock screen, and the machine neither blanks nor suspends when idle.',
    hyprlock:
      'Hyprlock draws the lock screen; Hypridle triggers locking, blanking, and suspend after set idle times.',
  },
  hyprlandAddons: {
    hyprpaper: 'Sets the wallpaper; the image has to be named.',
    hyprsunset: 'Color temperature filter, adjusted with hyprsunset -t 4000.',
    hyprshot: 'Captures a region, a window, or a display, and copies the result to the clipboard.',
    'gnome-keyring': 'Stores application passwords and can be unlocked by the login password.',
    seahorse: 'Graphical manager for the keyring.',
  },
}
