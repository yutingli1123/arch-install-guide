import type { Step } from '../types'

export const storageSteps: Step[] = [
  {
    id: 'zram',
    section: 'storage',
    title: { zh: '配置 zram' },
    when: (cfg) => cfg.zram,
    body: {
      zh: () => `新建 zram-generator 配置：

\`\`\`
vim /etc/systemd/zram-generator.conf
\`\`\`

写入：

\`\`\`
[zram0]
zram-size = ram / 2
compression-algorithm = zstd
swap-priority = 100
\`\`\`

重启后 systemd 会创建容量为物理内存一半的压缩交换设备 \`/dev/zram0\`。`,
    },
  },
  {
    id: 'swapfile',
    section: 'storage',
    title: { zh: '创建 swapfile' },
    when: (cfg) => cfg.diskSwap === 'swapfile',
    body: {
      zh: ({
        cfg,
      }) => `在独立的 \`@swap\` 子卷中关闭写时复制和压缩，再创建 ${cfg.diskSwapSizeGiB} GiB swapfile：

\`\`\`
btrfs property set /swap compression none
chattr +C /swap
btrfs filesystem mkswapfile --size ${cfg.diskSwapSizeGiB}g --uuid clear /swap/swapfile
swapon /swap/swapfile
echo '/swap/swapfile none swap defaults 0 0' >> /etc/fstab
\`\`\`

\`@swap\` 不会包含在根子卷快照中。\`--uuid clear\` 避免 swapfile 被误识别为可挂载文件系统。`,
    },
  },
  {
    id: 'encrypted-swap-partition',
    section: 'storage',
    title: { zh: '配置加密 swap 分区' },
    when: (cfg) => cfg.diskSwap === 'partition' && cfg.encryption.mode === 'luks2',
    body: {
      zh: ({ swapDevice }) => `让独立 swap 分区在每次启动时使用新的随机密钥加密：

\`\`\`
echo "cryptswap PARTUUID=$(blkid -s PARTUUID -o value ${swapDevice}) /dev/urandom swap,cipher=aes-xts-plain64,size=256" >> /etc/crypttab
echo '/dev/mapper/cryptswap none swap defaults 0 0' >> /etc/fstab
\`\`\`

\`swap\` 选项会在打开随机加密映射后初始化交换空间。密钥不会保存，因此关机后无法恢复其中的数据，也不能使用休眠到磁盘。`,
    },
  },
  {
    id: 'initramfs-encryption',
    section: 'storage',
    title: { zh: '启用 systemd initramfs 解锁' },
    when: (cfg) => cfg.encryption.mode === 'luks2',
    body: {
      zh: () => `编辑 mkinitcpio 配置：

\`\`\`
vim /etc/mkinitcpio.conf
\`\`\`

在 \`HOOKS\` 行的 \`block\` 后添加 \`sd-encrypt\`：

\`\`\`
block sd-encrypt filesystems
\`\`\`

不要改动该行的其他内容或顺序。\`systemd\` 与 \`sd-encrypt\` 负责在挂载根文件系统前打开 LUKS2。`,
    },
  },
  {
    id: 'snapper-config',
    section: 'storage',
    title: { zh: '配置 Snapper' },
    when: (cfg) => cfg.snapper !== 'none',
    body: {
      zh: ({
        cfg,
      }) => `让 Snapper 创建配置，再将它自动创建的嵌套快照子卷替换为安装时准备的顶层子卷：

\`\`\`
umount /.snapshots
rmdir /.snapshots
snapper --no-dbus -c root create-config /
btrfs subvolume delete /.snapshots
mkdir /.snapshots
mount /.snapshots
chmod 750 /.snapshots
${
  cfg.snapper === 'root-home'
    ? `umount /home/.snapshots
rmdir /home/.snapshots
snapper --no-dbus -c home create-config /home
btrfs subvolume delete /home/.snapshots
mkdir /home/.snapshots
mount /home/.snapshots
chmod 750 /home/.snapshots
`
    : ''
}systemctl enable snapper-timeline.timer snapper-cleanup.timer
\`\`\`

安装时的 chroot 没有运行 system D-Bus，因此使用 \`--no-dbus\` 让 Snapper 直接完成配置。

核对配置和独立挂载点：

\`\`\`
snapper --no-dbus list-configs
findmnt --mountpoint /.snapshots${cfg.snapper === 'root-home' ? '\nfindmnt --mountpoint /home/.snapshots' : ''}
\`\`\``,
    },
  },
  {
    id: 'pcr-signing-policy',
    section: 'storage',
    title: { zh: '创建 PCR 11 签名策略' },
    when: (cfg) =>
      cfg.encryption.mode === 'luks2' &&
      cfg.encryption.unlock.method === 'tpm2' &&
      cfg.encryption.unlock.signedPcrs.includes(11),
    body: {
      zh: () => `创建由 ukify 在每次构建 UKI 时使用的 PCR 签名密钥：

\`\`\`
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out /etc/kernel/pcr-initrd.key.pem
openssl pkey -in /etc/kernel/pcr-initrd.key.pem -pubout -out /etc/kernel/pcr-initrd.pub.pem
chmod 600 /etc/kernel/pcr-initrd.key.pem
\`\`\`

新建 mkinitcpio 传给 ukify 的配置文件 \`/etc/kernel/uki.conf\`：

\`\`\`
vim /etc/kernel/uki.conf
\`\`\`

写入：

\`\`\`
[PCRSignature:initrd]
Phases=enter-initrd
PCRPrivateKey=/etc/kernel/pcr-initrd.key.pem
PCRPublicKey=/etc/kernel/pcr-initrd.pub.pem
\`\`\`

\`Phases=enter-initrd\` 将这套签名策略限制在 initrd 阶段，使根分区解锁密钥在切换到主系统后不能再次由 TPM 解封。

生成 UKI 时，mkinitcpio 检测到已安装的 ukify 后会自动调用它，并读取 \`/etc/kernel/uki.conf\`。ukify 会在每次内核更新重建 UKI 时重新计算 PCR 11、签名策略，并将公钥和签名嵌入镜像。`,
    },
  },
]
