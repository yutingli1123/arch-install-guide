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

\`-K\` 会在目标系统中创建并初始化新的 pacman 密钥环，而不复制安装介质中的密钥环。

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

\`-U\` 使用 UUID 而非设备名，确保更换插槽或增加磁盘后仍能挂载正确的文件系统。

检查生成的文件，确认每个子卷均包含正确的 \`subvol=\` 参数和挂载选项：

\`\`\`
cat /mnt/etc/fstab
\`\`\`

fstab 配置错误可能导致系统无法启动，因此请在继续前仔细核对。`,
    },
  },
]
