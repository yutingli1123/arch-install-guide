import type { Step } from '../types'

export const bootSteps: Step[] = [
  {
    id: 'bootloader-install',
    section: 'boot',
    title: { zh: '安装 systemd-boot' },
    body: {
      zh: ({ espMountPoint }) => `\`\`\`
bootctl install
\`\`\`

\`bootctl\` 会依次检查 \`/efi\`、\`/boot\`、\`/boot/efi\` 以定位 ESP，此处会找到 \`${espMountPoint}\`。它会将引导器安装到 ESP、把对应条目置于固件启动项列表首位，并创建 ESP 目录结构；其中 \`EFI/Linux/\` 是后续 UKI 的输出位置。`,
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
sbctl sign -s -o /usr/lib/systemd/boot/efi/systemd-bootx64.efi.signed /usr/lib/systemd/boot/efi/systemd-bootx64.efi
bootctl update
find ${espMountPoint}/EFI/Linux -type f -name '*.efi' -exec sbctl sign -s {} \\;
sbctl verify
\`\`\`

\`sbctl status\` 必须显示 Setup Mode；否则先进入固件设置清除或重置 Secure Boot 密钥。保留 Microsoft 密钥可避免依赖它们的固件组件失效。sbctl 会记录已签名文件，并在后续内核更新重建 UKI 后重新签名。`,
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
\`\`\`

创建 MOK，并用它签名 systemd-boot 与当前 UKI：

\`\`\`
install -d -m 700 /etc/secureboot
openssl req -new -x509 -newkey rsa:2048 -keyout /etc/secureboot/MOK.key -out /etc/secureboot/MOK.crt -nodes -days 3650 -subj '/CN=Arch Linux MOK/'
openssl x509 -in /etc/secureboot/MOK.crt -outform DER -out /etc/secureboot/MOK.cer
chmod 600 /etc/secureboot/MOK.key
cp /usr/share/shim-signed/shimx64.efi ${espMountPoint}/EFI/systemd/shimx64.efi
cp /usr/share/shim-signed/mmx64.efi ${espMountPoint}/EFI/systemd/mmx64.efi
sbsign --key /etc/secureboot/MOK.key --cert /etc/secureboot/MOK.crt --output ${espMountPoint}/EFI/systemd/grubx64.efi /usr/lib/systemd/boot/efi/systemd-bootx64.efi
for uki in ${espMountPoint}/EFI/Linux/*.efi; do sbsign --key /etc/secureboot/MOK.key --cert /etc/secureboot/MOK.crt --output "$uki.signed" "$uki" && mv "$uki.signed" "$uki"; done
efibootmgr --create --disk ${cfg.disk} --part 1 --label 'Arch Linux (shim)' --loader '\\EFI\\systemd\\shimx64.efi'
mokutil --import /etc/secureboot/MOK.cer
\`\`\`

为内核更新创建 \`/etc/initcpio/post/uki-sign\`，写入以下内容后执行 \`chmod 700 /etc/initcpio/post/uki-sign\`：

\`\`\`sh
#!/bin/sh
uki="$3"
[ -n "$uki" ] || exit 0
tmp="$uki.signed"
sbsign --key /etc/secureboot/MOK.key --cert /etc/secureboot/MOK.crt --output "$tmp" "$uki" && mv "$tmp" "$uki"
\`\`\`

创建 \`/etc/pacman.d/hooks/95-systemd-boot-mok.hook\`，让 systemd 更新后重签 shim 的第二阶段：

\`\`\`
[Trigger]
Operation = Upgrade
Type = Package
Target = systemd

[Action]
Description = Signing systemd-boot for shim
When = PostTransaction
Exec = /usr/bin/sbsign --key /etc/secureboot/MOK.key --cert /etc/secureboot/MOK.crt --output /efi/EFI/systemd/grubx64.efi /usr/lib/systemd/boot/efi/systemd-bootx64.efi
\`\`\`

再次运行 \`mkinitcpio -P\`，确认 post hook 能签名两个 UKI。重启时在 MokManager 中选择 \`Enroll MOK\`，输入刚才设置的一次性密码并确认；随后在固件中启用 Secure Boot。`,
    },
  },
]
