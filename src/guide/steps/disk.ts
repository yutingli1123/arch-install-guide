import { cmd, text } from '../blocks'
import type { Step } from '../types'

export const diskSteps: Step[] = [
  {
    id: 'identify-disk',
    section: 'disk',
    title: { zh: '确认目标磁盘' },
    body: ({ cfg }) => [
      text('列出所有块设备：'),
      cmd('lsblk'),
      text(
        `本指南以 \`${cfg.disk}\` 为目标磁盘。**下一步会清除该磁盘上的全部数据**。请根据容量和型号确认实际目标磁盘就是 \`${cfg.disk}\`；如果设备名不同，请不要继续执行。`,
      ),
    ],
  },
  {
    id: 'partition',
    section: 'disk',
    title: { zh: '分区' },
    body: ({ cfg, espDevice, rootDevice }) => [
      text(
        '创建 GPT 分区表和两个分区：\n\n' +
          '| 分区 | 大小 | 类型 | 用途 |\n' +
          '| --- | --- | --- | --- |\n' +
          `| \`${espDevice}\` | ${cfg.espSize} | EFI System | ESP，存内核与引导器 |\n` +
          `| \`${rootDevice}\` | 剩余全部 | Linux filesystem | btrfs 根 |`,
      ),
      cmd(`sgdisk ${cfg.disk} -o -n 1:0:+${cfg.espSize} -t 1:ef00 -n 2:0:0 -t 2:8300`),
      text(
        '参数从左到右执行：`-o` 清空分区表，`-n 编号:起点:终点` 创建分区（`0` 表示采用默认值，终点为 `0` 表示使用全部剩余空间），`-t` 设置类型；`ef00` 是 EFI System，`8300` 是 Linux filesystem。核对结果：',
      ),
      cmd(`lsblk ${cfg.disk}`),
    ],
  },
  {
    id: 'luks-format',
    section: 'disk',
    title: { zh: '创建 LUKS2 加密容器' },
    when: (cfg) => cfg.encryption.mode === 'luks2',
    body: ({ rootDevice, luksName }) => [
      text(`为根分区设置 LUKS 密码，并打开为 \`/dev/mapper/${luksName}\`：`),
      cmd(
        `cryptsetup luksFormat --type luks2 ${rootDevice}\ncryptsetup open ${rootDevice} ${luksName}`,
      ),
      text(
        '此密码占用一个独立密钥槽。即使后续配置 TPM2，也必须保留它，TPM 状态变化时用作后备解锁方式。',
      ),
    ],
  },
  {
    id: 'format',
    section: 'disk',
    title: { zh: '格式化' },
    body: ({ cfg, espDevice, rootFsDevice }) => [
      text(
        `将 ESP 格式化为 UEFI 固件普遍支持的 FAT32 文件系统，并在${cfg.encryption.mode === 'luks2' ? '已打开的 LUKS 映射' : '根分区'}上创建 btrfs：`,
      ),
      cmd(`mkfs.fat -F 32 ${espDevice}\nmkfs.btrfs -f ${rootFsDevice}`),
    ],
  },
  {
    id: 'subvolumes',
    section: 'disk',
    title: { zh: '创建子卷' },
    body: ({ cfg, rootFsDevice, subvolumes }) => [
      text('先挂载 btrfs 顶层，创建子卷，然后卸载：'),
      cmd(
        `mount ${rootFsDevice} /mnt\n` +
          subvolumes.map((s) => `btrfs subvolume create /mnt/${s.name}`).join('\n') +
          '\numount /mnt',
      ),
      text(
        '子卷平铺在顶层，各自的用途：\n\n' +
          '| 子卷 | 挂载点 |\n' +
          '| --- | --- |\n' +
          subvolumes.map((s) => `| \`${s.name}\` | \`${s.mountPoint}\` |`).join('\n'),
      ),
      text(
        cfg.subvolumeLayout === 'separated'
          ? '`@log`、`@pkg` 和 `@boot` 均不包含在 `@` 的快照中。此布局可以不配置快照，也可以配置 snapper。'
          : '',
      ),
    ],
  },
  {
    id: 'mount',
    section: 'disk',
    title: { zh: '挂载' },
    body: ({
      cfg,
      rootFsDevice,
      espDevice,
      espMountPoint,
      rootSubvolume,
      subvolumes,
      nestedSubvolumes,
      mountOptions,
    }) => [
      text('按照挂载点的层级依次挂载，最后挂载 ESP：'),
      cmd(
        `mount -o subvol=${rootSubvolume.name},${mountOptions} ${rootFsDevice} /mnt\n` +
          nestedSubvolumes
            .map(
              (s) =>
                `mount --mkdir -o subvol=${s.name},${(s.mountOptions ?? cfg.mountOptions).join(',')} ${rootFsDevice} /mnt${s.mountPoint}`,
            )
            .join('\n') +
          `\nmount --mkdir -o noatime,umask=0077 ${espDevice} /mnt${espMountPoint}`,
      ),
      text(
        `这些挂载选项会由 \`genfstab\` 写入 fstab。btrfs 子卷使用 \`${mountOptions}\`；ESP 使用 \`noatime\` 避免读取文件时更新访问时间，并使用 \`umask=0077\` 限制为仅 root 可访问。`,
      ),
      text(
        `ESP 挂载在 \`${espMountPoint}\`：用于引导的 UKI 最终会生成到此处，固件和 systemd-boot 需要从 FAT 文件系统读取它。${cfg.subvolumeLayout === 'separated' ? '`/boot` 是根 btrfs 文件系统上的 `@boot` 子卷，仅存放 pacman 安装的 vmlinuz 和 mkinitcpio 的中间产物。' : '`/boot` 是根子卷内的普通目录。'}`,
      ),
      text('核对：'),
      cmd('findmnt -R /mnt'),
      text(`应当能看到 ${subvolumes.length} 个 btrfs 子卷加一个 ESP。`),
    ],
  },
]
