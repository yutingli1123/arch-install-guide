import type { Step } from '../types'

export const diskSteps: Step[] = [
  {
    id: 'identify-disk',
    section: 'disk',
    title: { zh: '确认目标磁盘' },
    body: {
      zh: ({ cfg }) => `列出所有块设备：

\`\`\`
lsblk -o NAME,SIZE,TYPE,MOUNTPOINTS
\`\`\`

本指南按 \`${cfg.disk}\` 生成。**下一步会抹掉这块盘上的全部数据**，先对着容量和型号确认设备名没选错。如果实际设备名不同，回到配置里改，不要手动改命令——后面还有十几处引用同一个设备。`,
    },
  },
  {
    id: 'partition',
    section: 'disk',
    title: { zh: '分区' },
    body: {
      zh: ({ cfg, espDevice, rootDevice }) => `建 GPT 分区表，两个分区：

| 分区 | 大小 | 类型 | 用途 |
| --- | --- | --- | --- |
| \`${espDevice}\` | ${cfg.espSize} | EFI System | ESP，存内核与引导器 |
| \`${rootDevice}\` | 剩余全部 | Linux filesystem | btrfs 根 |

\`\`\`
sgdisk ${cfg.disk} -o -n 1:0:+${cfg.espSize} -t 1:ef00 -n 2:0:0 -t 2:8300
\`\`\`

参数从左到右执行：\`-o\` 清空分区表，\`-n 编号:起点:终点\` 建分区（\`0\` 取默认值，终点为 \`0\` 即用满剩余空间），\`-t\` 设类型——\`ef00\` 是 EFI System，\`8300\` 是 Linux filesystem。核对结果：

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
      zh: ({ espDevice, rootDevice }) => `ESP 必须是 FAT32，固件只认这个：

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
      zh: ({ cfg, rootDevice }) => `先把 btrfs 顶层挂起来，建子卷，再卸掉：

\`\`\`
mount ${rootDevice} /mnt
${cfg.subvolumes.map((s) => `btrfs subvolume create /mnt/${s.name}`).join('\n')}
umount /mnt
\`\`\`

子卷平铺在顶层，各自的用途：

| 子卷 | 挂载点 |
| --- | --- |
${cfg.subvolumes.map((s) => `| \`${s.name}\` | \`${s.mountPoint}\` |`).join('\n')}

\`@log\` 和 \`@pkg\` 独立出来，是为了让它们不被包含进 \`@\` 的快照。这一步现在不装 snapper 也照做，省得以后要加快照时重新布局。`,
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
        nestedSubvolumes,
        mountOptions,
      }) => `按挂载点从浅到深挂，最后挂 ESP：

\`\`\`
mount -o subvol=${rootSubvolume.name},${mountOptions} ${rootDevice} /mnt
${nestedSubvolumes
  .map((s) => `mount --mkdir -o subvol=${s.name},${mountOptions} ${rootDevice} /mnt${s.mountPoint}`)
  .join('\n')}
mount --mkdir ${espDevice} /mnt${espMountPoint}
\`\`\`

挂载选项 \`${mountOptions}\` 会被 \`genfstab\` 原样写进 fstab，所以现在挂错，装完的系统也是错的。

ESP 挂在 \`${espMountPoint}\`：最终引导用的 UKI 会生成到这里，固件和 systemd-boot 只认 FAT。\`/boot\` 留在根文件系统上，只存 pacman 落的 vmlinuz 和 mkinitcpio 的中间产物。

核对：

\`\`\`
findmnt -R /mnt
\`\`\`

应当能看到 ${cfg.subvolumes.length} 个 btrfs 子卷加一个 ESP。`,
    },
  },
]
