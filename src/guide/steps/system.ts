import type { Step } from '../types'

export const systemSteps: Step[] = [
  {
    id: 'chroot',
    section: 'system',
    title: { zh: '进入新系统' },
    body: {
      zh: () => `\`\`\`
arch-chroot /mnt
\`\`\`

从此步骤到「离开 chroot」为止，所有命令均在新系统中执行。命令提示符将变为 \`[root@archiso /]#\`。`,
    },
  },
  {
    id: 'timezone',
    section: 'system',
    title: { zh: '时区' },
    body: {
      zh: ({ cfg }) => `\`\`\`
ln -sf /usr/share/zoneinfo/${cfg.timezone} /etc/localtime
hwclock --systohc
\`\`\`

\`hwclock --systohc\` 按当前系统时间写硬件时钟，并生成 \`/etc/adjtime\`。

可以使用 \`timedatectl list-timezones\` 查询其他时区名称。`,
    },
  },
  {
    id: 'locale',
    section: 'system',
    title: { zh: '本地化' },
    body: {
      zh: ({ cfg }) => `编辑 \`/etc/locale.gen\`，取消 \`en_US.UTF-8\`${
        cfg.systemLocale === 'en_US.UTF-8' ? '' : ` 和 \`${cfg.systemLocale}\``
      } 对应 UTF-8 locale 行的注释：

\`\`\`
vim /etc/locale.gen
\`\`\`

生成 locale：

\`\`\`
locale-gen
\`\`\`

设定系统语言：

\`\`\`
echo 'LANG=${cfg.systemLocale}' > /etc/locale.conf
\`\`\`${
        cfg.keymap === 'us'
          ? ''
          : `

设定虚拟控制台键盘布局：

\`\`\`
echo 'KEYMAP=${cfg.keymap}' > /etc/vconsole.conf
\`\`\`

\`/etc/vconsole.conf\` 仅影响 TTY；桌面环境使用其自身的键盘布局配置。`
      }`,
    },
  },
  {
    id: 'hostname',
    section: 'system',
    title: { zh: '主机名' },
    body: {
      zh: ({ cfg }) => `\`\`\`
echo '${cfg.hostname}' > /etc/hostname
\`\`\``,
    },
  },
  {
    id: 'root-password',
    section: 'system',
    title: { zh: 'root 密码' },
    body: {
      zh: () => `\`\`\`
passwd
\`\`\``,
    },
  },
  {
    id: 'user',
    section: 'system',
    title: { zh: '创建用户' },
    body: {
      zh: ({ cfg }) => `创建用户 \`${cfg.username}\` 并将其加入 \`wheel\` 组：

\`\`\`
useradd -m -G wheel ${cfg.username}
passwd ${cfg.username}
\`\`\`

授予 \`wheel\` 组 sudo 权限。执行以下命令打开编辑器，并删除 \`%wheel ALL=(ALL:ALL) ALL\` 所在行行首的 \`#\`：

\`\`\`
EDITOR=vim visudo
\`\`\`

必须使用 \`visudo\`，不要直接编辑 \`/etc/sudoers\`。\`visudo\` 会在保存前检查语法，避免配置错误导致 sudo 无法使用。`,
    },
  },
  {
    id: 'aur-helper',
    section: 'system',
    title: { zh: '安装 AUR 助手' },
    body: {
      zh: ({ cfg }) => `\`pacman\` 不管理 AUR，手动构建的包不会随 \`pacman -Syu\` 更新，交由 \`paru\` 管理才能收到后续更新。

\`paru\` 自身也来自 AUR，只能手动构建。AUR 构建必须使用普通用户：

\`\`\`
install -d -o ${cfg.username} -g ${cfg.username} /tmp/paru-build
sudo -u ${cfg.username} git clone https://aur.archlinux.org/paru.git /tmp/paru-build/paru
cd /tmp/paru-build/paru
sudo -u ${cfg.username} makepkg -si
cd /
\`\`\`

此后用 \`paru -Syu\` 同时更新官方仓库和 AUR 软件包。`,
    },
  },
  {
    id: 'network-service',
    section: 'system',
    title: { zh: '启用网络' },
    body: {
      zh: () => `\`\`\`
systemctl enable NetworkManager
\`\`\`

如果不启用该服务，重启后新系统将无法自动连接网络。安装介质中的网络配置不会保留到新系统中。`,
    },
  },
]
