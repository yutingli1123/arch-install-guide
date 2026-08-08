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

\`bootctl\` 会依次查找 \`/efi\`、\`/boot\`、\`/boot/efi\` 定位 ESP，这里会找到 \`${espMountPoint}\`。它把引导器装到 ESP 上，在固件的启动项列表里置顶，并建好 ESP 的目录结构——其中 \`EFI/Linux/\` 是后面 UKI 的输出位置。`,
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

- \`$(blkid ...)\` 在执行时就地展开成 UUID，不需要手抄。
- \`rootflags=subvol=${rootSubvolume.name}\` 不能省。btrfs 默认挂顶层，缺了它内核找不到根。
- 参数内嵌在镜像里，以后改动要重跑 \`mkinitcpio -P\` 才生效。

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
      zh: ({ espMountPoint }) => `编辑内核预设，把输出形态从分离镜像换成 UKI：

\`\`\`
vim /etc/mkinitcpio.d/linux.preset
\`\`\`

改四行：\`default_uki\` 和 \`fallback_uki\` 去掉行首的 \`#\`，\`default_image\` 和 \`fallback_image\` 行首加上 \`#\`。注释里的 UKI 路径就是 \`${espMountPoint}/EFI/Linux/\`，不用改。

\`/etc/mkinitcpio.conf\` 不用动：btrfs 支持编译在内核里，微码由默认 HOOKS 里的 \`microcode\` 打进镜像。

重新构建：

\`\`\`
mkinitcpio -P
\`\`\`

systemd-boot 会自动枚举 \`${espMountPoint}/EFI/Linux/\` 下的镜像生成启动菜单，主项排在 fallback 前——不需要写 \`loader/entries/\` 启动项，也不需要 \`loader.conf\`。fallback 镜像不做 autodetect 裁剪，主项因驱动缺失起不来时还有一条能进系统的路。

核对：

\`\`\`
bootctl list
\`\`\`

应当看到两个 \`type #2\` 条目，指向 \`EFI/Linux/\` 下的两个镜像。`,
    },
  },
]
