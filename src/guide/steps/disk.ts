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
      zh: ({
        cfg,
        espDevice,
        rootDevice,
        swapDevice,
      }) => `创建 GPT 分区表和${cfg.swap === 'partition' ? '三个' : '两个'}分区：

| 分区 | 大小 | 类型 | 用途 |
| --- | --- | --- | --- |
| \`${espDevice}\` | ${cfg.espSize} | EFI System | ESP，存内核与引导器 |
| \`${rootDevice}\` | ${cfg.swap === 'partition' ? `剩余空间减去 ${cfg.swapSizeGiB} GiB` : '剩余全部'} | Linux filesystem | btrfs 根 |
${cfg.swap === 'partition' ? `| \`${swapDevice}\` | ${cfg.swapSizeGiB} GiB | Linux swap | swap |` : ''}

\`\`\`
sgdisk ${cfg.disk} -o -n 1:0:+${cfg.espSize} -t 1:ef00 -n 2:0:${cfg.swap === 'partition' ? `-${cfg.swapSizeGiB}G` : '0'} -t 2:8300${cfg.swap === 'partition' ? ' -n 3:0:0 -t 3:8200' : ''}
\`\`\`

参数从左到右执行：\`-o\` 清空分区表，\`-n 编号:起点:终点\` 创建分区（\`0\` 表示采用默认值，终点为 \`0\` 表示使用全部剩余空间${cfg.swap === 'partition' ? `；\`-${cfg.swapSizeGiB}G\` 表示在磁盘末尾预留 ${cfg.swapSizeGiB} GiB` : ''}），\`-t\` 设置类型；\`ef00\` 是 EFI System，\`8300\` 是 Linux filesystem${cfg.swap === 'partition' ? '，`8200` 是 Linux swap' : ''}。核对结果：

\`\`\`
lsblk ${cfg.disk}
\`\`\``,
    },
  },
  {
    id: 'luks-format',
    section: 'disk',
    title: { zh: '创建 LUKS2 加密容器' },
    when: (cfg) => cfg.encryption.mode === 'luks2',
    body: {
      zh: ({
        rootDevice,
        luksName,
      }) => `为根分区设置 LUKS 密码，并打开为 \`/dev/mapper/${luksName}\`：

\`\`\`
cryptsetup luksFormat --type luks2 ${rootDevice}
cryptsetup open ${rootDevice} ${luksName}
\`\`\`

此密码占用一个独立密钥槽。即使后续配置 TPM2，也必须保留它，TPM 状态变化时用作后备解锁方式。`,
    },
  },
  {
    id: 'format',
    section: 'disk',
    title: { zh: '格式化' },
    body: {
      zh: ({
        cfg,
        espDevice,
        rootFsDevice,
        swapDevice,
      }) => `将 ESP 格式化为 UEFI 固件普遍支持的 FAT32 文件系统，并在${cfg.encryption.mode === 'luks2' ? '已打开的 LUKS 映射' : '根分区'}上创建 btrfs：

\`\`\`
mkfs.fat -F 32 ${espDevice}
mkfs.btrfs -f ${rootFsDevice}${
        cfg.swap === 'partition' && cfg.encryption.mode === 'none'
          ? `\nmkswap ${swapDevice}\nswapon ${swapDevice}`
          : ''
      }
\`\`\`${
        cfg.swap === 'partition' && cfg.encryption.mode === 'luks2'
          ? '\n\n独立 swap 分区将在新系统中使用每次启动随机生成的密钥加密，因此这里不直接格式化或启用它。'
          : ''
      }`,
    },
  },
  {
    id: 'subvolumes',
    section: 'disk',
    title: { zh: '创建子卷' },
    body: {
      zh: ({ cfg, rootFsDevice, subvolumes }) => `先挂载 btrfs 顶层，创建子卷，然后卸载：

\`\`\`
mount ${rootFsDevice} /mnt
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
        rootFsDevice,
        espDevice,
        espMountPoint,
        rootSubvolume,
        subvolumes,
        nestedSubvolumes,
        mountOptions,
      }) => `按照挂载点的层级依次挂载，最后挂载 ESP：

\`\`\`
mount -o subvol=${rootSubvolume.name},${mountOptions} ${rootFsDevice} /mnt
${nestedSubvolumes
  .map(
    (s) =>
      `mount --mkdir -o subvol=${s.name},${(s.mountOptions ?? cfg.mountOptions).join(',')} ${rootFsDevice} /mnt${s.mountPoint}`,
  )
  .join('\n')}
mount --mkdir -o noatime,umask=0077 ${espDevice} /mnt${espMountPoint}
\`\`\`

这些挂载选项会由 \`genfstab\` 写入 fstab。btrfs 子卷使用 \`${mountOptions}\`；ESP 使用 \`noatime\` 避免读取文件时更新访问时间，并使用 \`umask=0077\` 限制为仅 root 可访问。

ESP 挂载在 \`${espMountPoint}\`：用于引导的 UKI 最终会生成到此处，固件和 systemd-boot 需要从 FAT 文件系统读取它。${cfg.subvolumeLayout === 'separated' ? '\`/boot\` 是根 btrfs 文件系统上的 \`@boot\` 子卷，仅存放 pacman 安装的 vmlinuz 和 mkinitcpio 的中间产物。' : '\`/boot\` 是根子卷内的普通目录。'}

核对：

\`\`\`
findmnt -R /mnt
\`\`\`

应当能看到 ${subvolumes.length} 个 btrfs 子卷加一个 ESP。`,
    },
  },
]
