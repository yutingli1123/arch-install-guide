import type { Step } from '../types'

export const storageSteps: Step[] = [
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

将 \`HOOKS\` 行改为：

\`\`\`
HOOKS=(base systemd autodetect microcode modconf kms keyboard sd-vconsole block sd-encrypt filesystems fsck)
\`\`\`

\`systemd\` 与 \`sd-encrypt\` 负责在挂载根文件系统前打开 LUKS2；\`sd-vconsole\` 负责应用虚拟控制台的键盘与字体设置。`,
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

创建 \`/etc/systemd/ukify.conf\`：

\`\`\`
vim /etc/systemd/ukify.conf
\`\`\`

写入：

\`\`\`
[PCRSignature:initrd]
PCRPrivateKey=/etc/kernel/pcr-initrd.key.pem
PCRPublicKey=/etc/kernel/pcr-initrd.pub.pem
\`\`\`

ukify 会在每次内核更新重建 UKI 时重新计算 PCR 11、签名策略，并将公钥和签名嵌入镜像。`,
    },
  },
]
