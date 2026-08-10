import type { Step } from '../types'

export const diskSteps: Step[] = [
  {
    id: 'identify-disk',
    section: 'disk',
    title: { zh: '确认目标磁盘' },
    body: {
      zh: ({ cfg }) => `列出所有块设备：

\`\`\`
lsblk
\`\`\`

本指南以 \`${cfg.disk}\` 为目标磁盘。**下一步会清除该磁盘上的全部数据**。请根据容量和型号确认实际目标磁盘就是 \`${cfg.disk}\`；如果设备名不同，请不要继续执行。`,
    },
  },
  {
    id: 'partition',
    section: 'disk',
    title: { zh: '分区' },
    body: {
      zh: ({ cfg, espDevice, rootDevice }) => `创建 GPT 分区表和两个分区：

| 分区 | 大小 | 类型 | 用途 |
| --- | --- | --- | --- |
| \`${espDevice}\` | ${cfg.espSize} | EFI System | ESP，存内核与引导器 |
| \`${rootDevice}\` | 剩余全部 | Linux filesystem | btrfs 根 |

\`\`\`
sgdisk ${cfg.disk} -o -n 1:0:+${cfg.espSize} -t 1:ef00 -n 2:0:0 -t 2:8300
\`\`\`

参数从左到右执行：\`-o\` 清空分区表，\`-n 编号:起点:终点\` 创建分区（\`0\` 表示采用默认值，终点为 \`0\` 表示使用全部剩余空间），\`-t\` 设置类型；\`ef00\` 是 EFI System，\`8300\` 是 Linux filesystem。核对结果：

\`\`\`
lsblk ${cfg.disk}
\`\`\``,
    },
  },
  {
    id: 'format',
    section: 'disk',
    title: { zh: '格式化' },
    body: {
      zh: ({ espDevice, rootDevice }) => `将 ESP 格式化为 UEFI 固件普遍支持的 FAT32 文件系统：

\`\`\`
mkfs.fat -F 32 ${espDevice}
mkfs.btrfs -f ${rootDevice}
\`\`\``,
    },
  },
  {
    id: 'subvolumes',
    section: 'disk',
    title: { zh: '创建子卷' },
    body: {
      zh: ({ cfg, rootDevice, subvolumes }) => `先挂载 btrfs 顶层，创建子卷，然后卸载：

\`\`\`
mount ${rootDevice} /mnt
${subvolumes.map((s) => `btrfs subvolume create /mnt/${s.name}`).join('\n')}
umount /mnt
\`\`\`

子卷平铺在顶层，各自的用途：

| 子卷 | 挂载点 |
| --- | --- |
${subvolumes.map((s) => `| \`${s.name}\` | \`${s.mountPoint}\` |`).join('\n')}

${cfg.subvolumeLayout === 'separated' ? '\`@log\`、\`@pkg\` 和 \`@boot\` 均不包含在 \`@\` 的快照中。此布局可以不配置快照，也可以配置 snapper。' : '此布局只创建根子卷，不支持配置 snapper 快照。'}`,
    },
  },
  {
    id: 'mount',
    section: 'disk',
    title: { zh: '挂载' },
    body: {
      zh: ({
        cfg,
        rootDevice,
        espDevice,
        espMountPoint,
        rootSubvolume,
        subvolumes,
        nestedSubvolumes,
        mountOptions,
      }) => `按照挂载点的层级依次挂载，最后挂载 ESP：

\`\`\`
mount -o subvol=${rootSubvolume.name},${mountOptions} ${rootDevice} /mnt
${nestedSubvolumes
  .map((s) => `mount --mkdir -o subvol=${s.name},${mountOptions} ${rootDevice} /mnt${s.mountPoint}`)
  .join('\n')}
mount --mkdir -o noatime ${espDevice} /mnt${espMountPoint}
\`\`\`

这些挂载选项会由 \`genfstab\` 写入 fstab。btrfs 子卷使用 \`${mountOptions}\`；ESP 使用 \`noatime\`，以避免读取文件时更新访问时间而产生不必要的写入。

ESP 挂载在 \`${espMountPoint}\`：用于引导的 UKI 最终会生成到此处，固件和 systemd-boot 需要从 FAT 文件系统读取它。${cfg.subvolumeLayout === 'separated' ? '\`/boot\` 是根 btrfs 文件系统上的 \`@boot\` 子卷，仅存放 pacman 安装的 vmlinuz 和 mkinitcpio 的中间产物。' : '\`/boot\` 是根子卷内的普通目录。'}

核对：

\`\`\`
findmnt -R /mnt
\`\`\`

应当能看到 ${subvolumes.length} 个 btrfs 子卷加一个 ESP。`,
    },
  },
]
