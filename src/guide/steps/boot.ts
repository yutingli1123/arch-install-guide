import { cmd, text } from '../blocks'
import type { Step } from '../types'

export const bootSteps: Step[] = [
  {
    id: 'bootloader-install',
    section: 'boot',
    title: { zh: '安装 systemd-boot' },
    body: ({ cfg, espMountPoint }) => [
      cmd(`bootctl ${cfg.secureBoot === 'shim-mok' ? '--variables=no ' : ''}install`),
      text(
        `\`bootctl\` 会依次检查 \`/efi\`、\`/boot\`、\`/boot/efi\` 以定位 ESP，此处会找到 \`${espMountPoint}\`。它会将引导器安装到 ESP${cfg.secureBoot === 'shim-mok' ? '，但不创建直接指向 systemd-boot 的固件启动项；后面只注册 shim 启动项' : '、把对应条目置于固件启动项列表首位'}，并创建 ESP 目录结构；其中 \`EFI/Linux/\` 是后续 UKI 的输出位置。`,
      ),
    ],
  },
  {
    id: 'kernel-cmdline',
    section: 'boot',
    title: { zh: '内核命令行' },
    body: ({ cfg, rootDevice, rootFsDevice, luksName, rootSubvolume }) => [
      text('内核参数写进 `/etc/kernel/cmdline`，构建 UKI 时会内嵌进镜像：'),
      cmd(
        `echo "${
          cfg.encryption.mode === 'luks2'
            ? `rd.luks.name=$(blkid -s UUID -o value ${rootDevice})=${luksName} root=${rootFsDevice}`
            : `root=UUID=$(blkid -s UUID -o value ${rootDevice})`
        } rootflags=subvol=${rootSubvolume.name} rw" > /etc/kernel/cmdline`,
      ),
      text(
        `- \`$(blkid ...)\` 会在执行命令时展开为${cfg.encryption.mode === 'luks2' ? ' LUKS2 容器' : ' btrfs'} UUID，无需手动录入。\n` +
          `- \`rootflags=subvol=${rootSubvolume.name}\` 不可省略。btrfs 默认挂载顶层；缺少该参数时，内核无法定位根子卷。\n` +
          '- 参数内嵌在镜像中；后续修改后必须重新执行 `mkinitcpio -P` 才能生效。',
      ),
      text('核对展开结果：'),
      cmd('cat /etc/kernel/cmdline'),
    ],
  },
  {
    id: 'uki',
    section: 'boot',
    title: { zh: '构建 UKI' },
    body: ({ cfg, espMountPoint }) => [
      text('编辑内核预设，将输出形式从分离镜像改为 UKI：'),
      cmd('vim /etc/mkinitcpio.d/linux.preset'),
      text(
        '按如下方式修改预设：\n\n' +
          "- 注释 `PRESETS=('default')`，并取消注释 `PRESETS=('default' 'fallback')`，以同时生成常规镜像和 fallback 镜像。\n" +
          '- 取消注释 `default_uki` 和 `fallback_uki`。\n' +
          '- 注释 `default_image`。',
      ),
      text(
        `\`default_uki\` 和 \`fallback_uki\` 中的路径应为 \`${espMountPoint}/EFI/Linux/\`，无需修改。${cfg.encryption.mode === 'none' ? '' : '\n\n前面配置的 systemd initramfs 会把 LUKS2 解锁逻辑一并放入 UKI。'}`,
      ),
      text('重新构建：'),
      cmd(`mkdir -p ${espMountPoint}/EFI/Linux\nmkinitcpio -P`),
      text(
        `systemd-boot 会自动枚举 \`${espMountPoint}/EFI/Linux/\` 中的镜像并生成启动菜单，常规启动项排列在 fallback 之前。fallback 镜像不进行 autodetect 裁剪，可在常规镜像因缺少驱动而无法启动时用于恢复系统。`,
      ),
      text('核对：'),
      cmd('bootctl list'),
      text('应当看到两个 `type #2` 条目，指向 `EFI/Linux/` 下的两个镜像。'),
    ],
  },
  {
    id: 'secure-boot-custom-db',
    section: 'boot',
    title: { zh: '注册自定义 Secure Boot 密钥' },
    when: (cfg) => cfg.secureBoot === 'custom-db',
    body: ({ espMountPoint }) => [
      text('确认固件已进入 Setup Mode，再创建并注册密钥：'),
      cmd(
        'sbctl status\n' +
          'sbctl create-keys\n' +
          'sbctl enroll-keys -m\n' +
          `sbctl sign -s ${espMountPoint}/EFI/systemd/systemd-bootx64.efi\n` +
          `sbctl sign -s ${espMountPoint}/EFI/BOOT/BOOTX64.EFI\n` +
          `find ${espMountPoint}/EFI/Linux -type f -name '*.efi' -exec sbctl sign -s {} \\;\n` +
          'sbctl verify',
      ),
      text(
        '`sbctl status` 必须显示 Setup Mode；否则进入固件设置启用 Setup Mode，具体入口和选项名称因主板固件而异。sbctl 会记录已签名文件，并在后续内核更新重建 UKI 后重新签名——但这只覆盖 UKI，ESP 里 `EFI/systemd/systemd-bootx64.efi` 和 `EFI/BOOT/BOOTX64.EFI` 这两份 systemd-boot 二进制不会被自动刷新，需要单独处理。',
      ),
      text('创建 `/usr/local/sbin/update-sbctl-systemd-boot`：'),
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
      text('执行脚本：'),
      cmd(
        'chmod 700 /usr/local/sbin/update-sbctl-systemd-boot\n/usr/local/sbin/update-sbctl-systemd-boot',
      ),
      text('创建 `/etc/pacman.d/hooks/95-sbctl-systemd-boot.hook`：'),
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
    title: { zh: '建立 shim 与 MOK 信任链' },
    when: (cfg) => cfg.secureBoot === 'shim-mok',
    body: ({ cfg, espMountPoint }) => [
      text('安装 Fedora 预签名的 `shim-signed`。AUR 操作必须使用普通用户：'),
      cmd(`sudo -u ${cfg.username} paru -S shim-signed\npacman -Q shim-signed`),
      text(
        '`shim-signed` 必须为 16.1 或更高版本，systemd-boot 才能通过 shim 的 loader protocol 加载 MOK 签名的 UKI。',
      ),
      text('创建 MOK：'),
      cmd(
        'install -d -m 700 /etc/secureboot\n' +
          "openssl req -new -x509 -newkey rsa:2048 -sha256 -keyout /etc/secureboot/MOK.key -out /etc/secureboot/MOK.crt -nodes -days 3650 -subj '/CN=Arch Linux MOK/'\n" +
          'openssl x509 -in /etc/secureboot/MOK.crt -outform DER -out /etc/secureboot/MOK.cer\n' +
          'chmod 600 /etc/secureboot/MOK.key',
      ),
      text('编辑 `/etc/kernel/uki.conf`：'),
      cmd('vim /etc/kernel/uki.conf'),
      text('加入：'),
      cmd(
        '[UKI]\n' +
          'SecureBootPrivateKey=/etc/secureboot/MOK.key\n' +
          'SecureBootCertificate=/etc/secureboot/MOK.crt',
      ),
      text('如果文件中已经存在 PCR 签名配置，请保留原有内容。'),
      text('创建 `/usr/local/sbin/update-shim-systemd-boot`：'),
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
      text('执行脚本：'),
      cmd(
        'chmod 700 /usr/local/sbin/update-shim-systemd-boot\n/usr/local/sbin/update-shim-systemd-boot',
      ),
      text('创建 `/etc/pacman.d/hooks/95-shim-systemd-boot.hook`：'),
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
      text('重新构建 UKI，并核对 systemd-boot 与两个 UKI 均由 MOK 签名：'),
      cmd(
        'mkinitcpio -P\n' +
          `sbverify --cert /etc/secureboot/MOK.crt ${espMountPoint}/EFI/systemd/grubx64.efi\n` +
          `for uki in ${espMountPoint}/EFI/Linux/*.efi; do sbverify --cert /etc/secureboot/MOK.crt "$uki"; done`,
      ),
      text('创建 shim 启动项并提交 MOK 注册请求：'),
      cmd(
        `efibootmgr --create --disk ${cfg.disk} --part 1 --label 'Arch Linux (shim)' --loader '\\EFI\\systemd\\shimx64.efi'\n` +
          'mokutil --import /etc/secureboot/MOK.cer\n' +
          'mokutil --list-new',
      ),
      text(
        '为 `mokutil --import` 设置一次性密码。重启时先进入固件启用 Secure Boot，再从 `Arch Linux (shim)` 启动；在 MokManager 中选择 `Enroll MOK`，输入一次性密码并确认。',
      ),
    ],
  },
]
