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
        rootDevice,
        rootSubvolume,
      }) => `内核参数写进 \`/etc/kernel/cmdline\`，构建 UKI 时会内嵌进镜像：

\`\`\`
echo "root=UUID=$(blkid -s UUID -o value ${rootDevice}) rootflags=subvol=${rootSubvolume.name} rw" > /etc/kernel/cmdline
\`\`\`

- \`$(blkid ...)\` 会在执行命令时展开为 UUID，无需手动录入。
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
      zh: ({ espMountPoint }) => `编辑内核预设，将输出形式从分离镜像改为 UKI：

\`\`\`
vim /etc/mkinitcpio.d/linux.preset
\`\`\`

按如下方式修改预设：

- 注释 \`PRESETS=('default')\`，并取消注释 \`PRESETS=('default' 'fallback')\`，以同时生成常规镜像和 fallback 镜像。
- 取消注释 \`default_uki\` 和 \`fallback_uki\`。
- 注释 \`default_image\`。

\`default_uki\` 和 \`fallback_uki\` 中的路径应为 \`${espMountPoint}/EFI/Linux/\`，无需修改。

无需修改 \`/etc/mkinitcpio.conf\`：btrfs 支持已编译进内核，微码会由默认 HOOKS 中的 \`microcode\` 加入镜像。

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
]
