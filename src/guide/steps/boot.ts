import type { Step } from '../types'

export const bootSteps: Step[] = [
  {
    id: 'bootloader-install',
    section: 'boot',
    title: { zh: '安装 systemd-boot' },
    body: {
      zh: ({ cfg, espMountPoint }) => `\`\`\`
bootctl ${cfg.secureBoot === 'shim-mok' ? '--variables=no ' : ''}install
\`\`\`

\`bootctl\` 会依次检查 \`/efi\`、\`/boot\`、\`/boot/efi\` 以定位 ESP，此处会找到 \`${espMountPoint}\`。它会将引导器安装到 ESP${cfg.secureBoot === 'shim-mok' ? '，但不创建直接指向 systemd-boot 的固件启动项；后面只注册 shim 启动项' : '、把对应条目置于固件启动项列表首位'}，并创建 ESP 目录结构；其中 \`EFI/Linux/\` 是后续 UKI 的输出位置。`,
    },
  },
  {
    id: 'kernel-cmdline',
    section: 'boot',
    title: { zh: '内核命令行' },
    body: {
      zh: ({
        cfg,
        rootDevice,
        rootFsDevice,
        luksName,
        rootSubvolume,
      }) => `内核参数写进 \`/etc/kernel/cmdline\`，构建 UKI 时会内嵌进镜像：

\`\`\`
echo "${
        cfg.encryption.mode === 'luks2'
          ? `rd.luks.name=$(blkid -s UUID -o value ${rootDevice})=${luksName} root=${rootFsDevice}`
          : `root=UUID=$(blkid -s UUID -o value ${rootDevice})`
      } rootflags=subvol=${rootSubvolume.name} rw" > /etc/kernel/cmdline
\`\`\`

- \`$(blkid ...)\` 会在执行命令时展开为${cfg.encryption.mode === 'luks2' ? ' LUKS2 容器' : ' btrfs'} UUID，无需手动录入。
- \`rootflags=subvol=${rootSubvolume.name}\` 不可省略。btrfs 默认挂载顶层；缺少该参数时，内核无法定位根子卷。
- 参数内嵌在镜像中；后续修改后必须重新执行 \`mkinitcpio -P\` 才能生效。

核对展开结果：

\`\`\`
cat /etc/kernel/cmdline
\`\`\``,
    },
  },
  {
    id: 'uki',
    section: 'boot',
    title: { zh: '构建 UKI' },
    body: {
      zh: ({ cfg, espMountPoint }) => `编辑内核预设，将输出形式从分离镜像改为 UKI：

\`\`\`
vim /etc/mkinitcpio.d/linux.preset
\`\`\`

按如下方式修改预设：

- 注释 \`PRESETS=('default')\`，并取消注释 \`PRESETS=('default' 'fallback')\`，以同时生成常规镜像和 fallback 镜像。
- 取消注释 \`default_uki\` 和 \`fallback_uki\`。
- 注释 \`default_image\`。

\`default_uki\` 和 \`fallback_uki\` 中的路径应为 \`${espMountPoint}/EFI/Linux/\`，无需修改。

${cfg.encryption.mode === 'none' ? '无需修改 `/etc/mkinitcpio.conf`：btrfs 支持已编译进内核，微码会由默认 HOOKS 中的 `microcode` 加入镜像。' : '前面配置的 systemd initramfs 会把 LUKS2 解锁逻辑一并放入 UKI。'}

重新构建：

\`\`\`
mkdir -p ${espMountPoint}/EFI/Linux
mkinitcpio -P
\`\`\`

systemd-boot 会自动枚举 \`${espMountPoint}/EFI/Linux/\` 中的镜像并生成启动菜单，常规启动项排列在 fallback 之前，因此无需创建 \`loader/entries/\` 启动项或 \`loader.conf\`。fallback 镜像不进行 autodetect 裁剪，可在常规镜像因缺少驱动而无法启动时用于恢复系统。

核对：

\`\`\`
bootctl list
\`\`\`

应当看到两个 \`type #2\` 条目，指向 \`EFI/Linux/\` 下的两个镜像。`,
    },
  },
  {
    id: 'secure-boot-custom-db',
    section: 'boot',
    title: { zh: '注册自定义 Secure Boot 密钥' },
    when: (cfg) => cfg.secureBoot === 'custom-db',
    body: {
      zh: ({ espMountPoint }) => `确认固件已进入 Setup Mode，再创建并注册密钥：

\`\`\`
sbctl status
sbctl create-keys
sbctl enroll-keys -m
sbctl sign -s ${espMountPoint}/EFI/systemd/systemd-bootx64.efi
sbctl sign -s ${espMountPoint}/EFI/BOOT/BOOTX64.EFI
find ${espMountPoint}/EFI/Linux -type f -name '*.efi' -exec sbctl sign -s {} \\;
sbctl verify
\`\`\`

\`sbctl status\` 必须显示 Setup Mode；否则进入固件设置启用 Setup Mode，具体入口和选项名称因主板固件而异。sbctl 会记录已签名文件，并在后续内核更新重建 UKI 后重新签名——但这只覆盖 UKI，ESP 里 \`EFI/systemd/systemd-bootx64.efi\` 和 \`EFI/BOOT/BOOTX64.EFI\` 这两份 systemd-boot 二进制不会被自动刷新，需要单独处理。

创建 \`/usr/local/sbin/update-sbctl-systemd-boot\`：

\`\`\`
vim /usr/local/sbin/update-sbctl-systemd-boot
\`\`\`

\`\`\`sh
#!/bin/sh
set -eu

destination=${espMountPoint}/EFI/systemd
fallback=${espMountPoint}/EFI/BOOT
source=/usr/lib/systemd/boot/efi/systemd-bootx64.efi

install_file() {
  install -m 644 "$1" "$2.new"
  mv "$2.new" "$2"
}

install_file "$source" "$destination/systemd-bootx64.efi"
install_file "$source" "$fallback/BOOTX64.EFI"
sbctl sign-all
\`\`\`

执行脚本：

\`\`\`
chmod 700 /usr/local/sbin/update-sbctl-systemd-boot
/usr/local/sbin/update-sbctl-systemd-boot
\`\`\`

创建 \`/etc/pacman.d/hooks/95-sbctl-systemd-boot.hook\`：

\`\`\`
vim /etc/pacman.d/hooks/95-sbctl-systemd-boot.hook
\`\`\`

\`\`\`
[Trigger]
Operation = Install
Operation = Upgrade
Type = Package
Target = systemd

[Action]
Description = Updating the sbctl-signed systemd-boot copy
When = PostTransaction
Depends = sbctl
Exec = /usr/local/sbin/update-sbctl-systemd-boot
\`\`\``,
    },
  },
  {
    id: 'secure-boot-shim',
    section: 'boot',
    title: { zh: '建立 shim 与 MOK 信任链' },
    when: (cfg) => cfg.secureBoot === 'shim-mok',
    body: {
      zh: ({
        cfg,
        espMountPoint,
      }) => `从 AUR 构建 Fedora 预签名的 \`shim-signed\`。AUR 构建必须使用普通用户：

\`\`\`
install -d -o ${cfg.username} -g ${cfg.username} /tmp/shim-build
sudo -u ${cfg.username} git clone https://aur.archlinux.org/shim-signed.git /tmp/shim-build/shim-signed
cd /tmp/shim-build/shim-signed
sudo -u ${cfg.username} makepkg -s
pacman -U ./*.pkg.tar.zst
cd /
pacman -Q shim-signed
\`\`\`

\`shim-signed\` 必须为 16.1 或更高版本，systemd-boot 才能通过 shim 的 loader protocol 加载 MOK 签名的 UKI。

创建 MOK：

\`\`\`
install -d -m 700 /etc/secureboot
openssl req -new -x509 -newkey rsa:2048 -sha256 -keyout /etc/secureboot/MOK.key -out /etc/secureboot/MOK.crt -nodes -days 3650 -subj '/CN=Arch Linux MOK/'
openssl x509 -in /etc/secureboot/MOK.crt -outform DER -out /etc/secureboot/MOK.cer
chmod 600 /etc/secureboot/MOK.key
\`\`\`

编辑 \`/etc/kernel/uki.conf\`：

\`\`\`
vim /etc/kernel/uki.conf
\`\`\`

加入：

\`\`\`
[UKI]
SecureBootPrivateKey=/etc/secureboot/MOK.key
SecureBootCertificate=/etc/secureboot/MOK.crt
\`\`\`

如果文件中已经存在 PCR 签名配置，请保留原有内容。

创建 \`/usr/local/sbin/update-shim-systemd-boot\`：

\`\`\`
vim /usr/local/sbin/update-shim-systemd-boot
\`\`\`

\`\`\`sh
#!/bin/sh
set -eu

destination=${espMountPoint}/EFI/systemd
fallback=${espMountPoint}/EFI/BOOT
source=/usr/lib/systemd/boot/efi/systemd-bootx64.efi
signed="$source.signed"
workdir=$(mktemp -d)
trap 'rm -rf "$workdir"' EXIT

install -d -m 755 "$destination"
install -d -m 755 "$fallback"
sbsign --key /etc/secureboot/MOK.key --cert /etc/secureboot/MOK.crt --output "$workdir/systemd-bootx64.efi" "$source"

install_file() {
  install -m 644 "$1" "$2.new"
  mv "$2.new" "$2"
}

install_file "$workdir/systemd-bootx64.efi" "$signed"
install_file /usr/share/shim-signed/shimx64.efi "$destination/shimx64.efi"
install_file /usr/share/shim-signed/mmx64.efi "$destination/mmx64.efi"
install_file "$signed" "$destination/grubx64.efi"
install_file /usr/share/shim-signed/shimx64.efi "$fallback/BOOTX64.EFI"
install_file /usr/share/shim-signed/mmx64.efi "$fallback/mmx64.efi"
install_file "$signed" "$fallback/grubx64.efi"
\`\`\`

执行脚本：

\`\`\`
chmod 700 /usr/local/sbin/update-shim-systemd-boot
/usr/local/sbin/update-shim-systemd-boot
\`\`\`

创建 \`/etc/pacman.d/hooks/95-shim-systemd-boot.hook\`：

\`\`\`
vim /etc/pacman.d/hooks/95-shim-systemd-boot.hook
\`\`\`

\`\`\`
[Trigger]
Operation = Install
Operation = Upgrade
Type = Package
Target = systemd
Target = shim-signed

[Action]
Description = Updating the shim systemd-boot chain
When = PostTransaction
Depends = sbsigntools
Exec = /usr/local/sbin/update-shim-systemd-boot
\`\`\`

重新构建 UKI，并核对 systemd-boot 与两个 UKI 均由 MOK 签名：

\`\`\`
mkinitcpio -P
sbverify --cert /etc/secureboot/MOK.crt ${espMountPoint}/EFI/systemd/grubx64.efi
for uki in ${espMountPoint}/EFI/Linux/*.efi; do sbverify --cert /etc/secureboot/MOK.crt "$uki"; done
\`\`\`

创建 shim 启动项并提交 MOK 注册请求：

\`\`\`
efibootmgr --create --disk ${cfg.disk} --part 1 --label 'Arch Linux (shim)' --loader '\\EFI\\systemd\\shimx64.efi'
mokutil --import /etc/secureboot/MOK.cer
mokutil --list-new
\`\`\`

为 \`mokutil --import\` 设置一次性密码。重启时先进入固件启用 Secure Boot，再从 \`Arch Linux (shim)\` 启动；在 MokManager 中选择 \`Enroll MOK\`，输入一次性密码并确认。`,
    },
  },
]
