import type { Step } from '../types'

export const installSteps: Step[] = [
  {
    id: 'pacstrap',
    section: 'install',
    title: { zh: '安装基本系统' },
    body: {
      zh: ({ packages, microcode }) => `\`\`\`
pacstrap -K /mnt ${packages.join(' ')}
\`\`\`

\`-K\` 在目标系统里新建一份空的 pacman 密钥环并初始化，不复制安装介质上的。

包的用途：

| 包 | 用途 |
| --- | --- |
| \`base\` | 基本系统 |
| \`linux\` \`linux-firmware\` | 内核与固件 |
| \`btrfs-progs\` | btrfs 工具，根文件系统需要 |
| \`${microcode}\` | CPU 微码，引导时加载 |
| \`networkmanager\` | 装完之后的联网 |
| \`sudo\` \`vim\` | 后续步骤要用 |

这一步会下载几百 MB，耗时取决于镜像源速度。`,
    },
  },
  {
    id: 'fstab',
    section: 'install',
    title: { zh: '生成 fstab' },
    body: {
      zh: () => `\`\`\`
genfstab -U /mnt >> /mnt/etc/fstab
\`\`\`

\`-U\` 用 UUID 而不是设备名，这样换插槽或加盘之后仍能挂对。

检查一遍，尤其确认每个子卷的 \`subvol=\` 和挂载选项都在：

\`\`\`
cat /mnt/etc/fstab
\`\`\`

这里错了下次开机就进不去，值得多看一眼。`,
    },
  },
]
