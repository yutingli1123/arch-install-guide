import type { Step } from '../types'

function packagePurposeRows(packages: string[], microcode: string): string {
  const rows: Array<[string[], string]> = [
    [['base'], '基本系统'],
    [['linux', 'linux-firmware'], '内核与固件'],
    [['btrfs-progs'], 'btrfs 工具，根文件系统需要'],
    [[microcode], 'CPU 微码，引导时加载'],
    [['cryptsetup'], '创建和打开 LUKS2 加密卷'],
    [['networkmanager'], '管理网络连接'],
    [['sudo'], '以 Root 权限执行命令'],
    [['vim'], '编辑配置文件'],
    [['zram-generator'], '配置 zram'],
    [['snapper'], '管理 btrfs 快照'],
    [['sbctl'], '管理自定义 Secure Boot 密钥并签名 EFI 文件'],
    [['systemd-ukify'], '生成 UKI，并按配置创建 Secure Boot 或 PCR 11 签名'],
    [['base-devel', 'git'], '下载并构建 shim-signed'],
    [['efibootmgr', 'mokutil', 'sbsigntools'], '创建 UEFI 启动项、导入 MOK 并签名 EFI 文件'],
  ]
  const visible = rows.filter(([names]) => names.every((name) => packages.includes(name)))
  const covered = new Set(visible.flatMap(([names]) => names))
  const missing = packages.filter((name) => !covered.has(name))
  if (missing.length > 0) throw new Error(`missing package purpose: ${missing.join(', ')}`)

  return visible
    .map(([names, purpose]) => `| ${names.map((name) => `\`${name}\``).join(' ')} | ${purpose} |`)
    .join('\n')
}

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
${packagePurposeRows(packages, microcode)}

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
