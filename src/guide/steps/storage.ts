import { cmd, text } from '../blocks'
import type { Step } from '../types'

export const storageSteps: Step[] = [
  {
    id: 'zram',
    section: 'storage',
    title: { zh: '配置 zram' },
    when: (cfg) => cfg.zram,
    body: () => [
      text('新建 zram-generator 配置：'),
      cmd('vim /etc/systemd/zram-generator.conf'),
      text('写入：'),
      cmd('[zram0]\nzram-size = ram / 2\ncompression-algorithm = zstd\nswap-priority = 100'),
      text('重启后 systemd 会创建容量为物理内存一半的压缩交换设备 `/dev/zram0`。'),
    ],
  },
  {
    id: 'swapfile',
    section: 'storage',
    title: { zh: '创建 swapfile' },
    when: (cfg) => cfg.diskSwap === 'swapfile',
    body: ({ cfg }) => [
      text(`在独立的 \`@swap\` 子卷中创建 ${cfg.diskSwapSizeGiB} GiB swapfile：`),
      cmd(
        `btrfs filesystem mkswapfile --size ${cfg.diskSwapSizeGiB}g --uuid clear /swap/swapfile\n` +
          'swapon /swap/swapfile\n' +
          "echo '/swap/swapfile none swap defaults 0 0' >> /etc/fstab",
      ),
      text(
        '`@swap` 不会包含在根子卷快照中。`--uuid clear` 避免 swapfile 被误识别为可挂载文件系统。',
      ),
    ],
  },
  {
    id: 'initramfs-encryption',
    section: 'storage',
    title: { zh: '启用 systemd initramfs 解锁' },
    when: (cfg) => cfg.encryption.mode === 'luks2',
    body: () => [
      text('编辑 mkinitcpio 配置：'),
      cmd('vim /etc/mkinitcpio.conf'),
      text('在 `HOOKS` 行的 `block` 后添加 `sd-encrypt`：'),
      cmd('block sd-encrypt filesystems'),
      text(
        '不要改动该行的其他内容或顺序。`systemd` 与 `sd-encrypt` 负责在挂载根文件系统前打开 LUKS2。',
      ),
    ],
  },
  {
    id: 'snapper-config',
    section: 'storage',
    title: { zh: '配置 Snapper' },
    when: (cfg) => cfg.snapper !== 'none',
    body: ({ cfg }) => [
      text('让 Snapper 创建配置，再将它自动创建的嵌套快照子卷替换为安装时准备的顶层子卷：'),
      cmd(
        'umount /.snapshots\n' +
          'rmdir /.snapshots\n' +
          'snapper --no-dbus -c root create-config /\n' +
          'btrfs subvolume delete /.snapshots\n' +
          'mkdir /.snapshots\n' +
          'mount /.snapshots\n' +
          'chmod 750 /.snapshots\n' +
          (cfg.snapper === 'root-home'
            ? 'umount /home/.snapshots\n' +
              'rmdir /home/.snapshots\n' +
              'snapper --no-dbus -c home create-config /home\n' +
              'btrfs subvolume delete /home/.snapshots\n' +
              'mkdir /home/.snapshots\n' +
              'mount /home/.snapshots\n' +
              'chmod 750 /home/.snapshots\n'
            : '') +
          'systemctl enable snapper-timeline.timer snapper-cleanup.timer',
      ),
      text('安装时的 chroot 没有运行 system D-Bus，因此使用 `--no-dbus` 让 Snapper 直接完成配置。'),
      text('核对配置和独立挂载点：'),
      cmd(
        'snapper --no-dbus list-configs\n' +
          `findmnt --mountpoint /.snapshots${
            cfg.snapper === 'root-home' ? '\nfindmnt --mountpoint /home/.snapshots' : ''
          }`,
      ),
    ],
  },
  {
    id: 'pcr-signing-policy',
    section: 'storage',
    title: { zh: '创建 PCR 11 签名策略' },
    when: (cfg) =>
      cfg.encryption.mode === 'luks2' &&
      cfg.encryption.unlock.method === 'tpm2' &&
      cfg.encryption.unlock.signedPcrs.includes(11),
    body: () => [
      text('创建由 ukify 在每次构建 UKI 时使用的 PCR 签名密钥：'),
      cmd(
        'openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out /etc/kernel/pcr-initrd.key.pem\n' +
          'openssl pkey -in /etc/kernel/pcr-initrd.key.pem -pubout -out /etc/kernel/pcr-initrd.pub.pem\n' +
          'chmod 600 /etc/kernel/pcr-initrd.key.pem',
      ),
      text('新建 mkinitcpio 传给 ukify 的配置文件 `/etc/kernel/uki.conf`：'),
      cmd('vim /etc/kernel/uki.conf'),
      text('写入：'),
      cmd(
        '[PCRSignature:initrd]\n' +
          'Phases=enter-initrd\n' +
          'PCRPrivateKey=/etc/kernel/pcr-initrd.key.pem\n' +
          'PCRPublicKey=/etc/kernel/pcr-initrd.pub.pem',
      ),
      text(
        '`Phases=enter-initrd` 将这套签名策略限制在 initrd 阶段，使根分区解锁密钥在切换到主系统后不能再次由 TPM 解封。',
      ),
      text(
        '生成 UKI 时，mkinitcpio 检测到已安装的 ukify 后会自动调用它，并读取 `/etc/kernel/uki.conf`。ukify 会在每次内核更新重建 UKI 时重新计算 PCR 11、签名策略，并将公钥和签名嵌入镜像。',
      ),
    ],
  },
]
