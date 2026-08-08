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

从这里到「离开 chroot」为止，所有命令都在新系统里执行。提示符会变成 \`[root@archiso /]#\`。`,
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

其他时区名可以用 \`timedatectl list-timezones\` 查。`,
    },
  },
  {
    id: 'locale',
    section: 'system',
    title: { zh: '本地化' },
    body: {
      zh: ({
        cfg,
      }) => `编辑 \`/etc/locale.gen\`，找到 \`${cfg.systemLocale} UTF-8\` 那行去掉行首的 \`#\`：

\`\`\`
vim /etc/locale.gen
\`\`\`

生成 locale：

\`\`\`
locale-gen
\`\`\`

设定系统语言与控制台键盘布局：

\`\`\`
echo 'LANG=${cfg.systemLocale}' > /etc/locale.conf
echo 'KEYMAP=${cfg.keymap}' > /etc/vconsole.conf
\`\`\`

\`/etc/vconsole.conf\` 里的键盘布局只影响 TTY，装了桌面之后由桌面自己管。`,
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
      zh: ({ cfg }) => `建用户并加入 \`wheel\` 组：

\`\`\`
useradd -m -G wheel ${cfg.username}
passwd ${cfg.username}
\`\`\`

给 \`wheel\` 组 sudo 权限。执行下面的命令会打开编辑器，把 \`%wheel ALL=(ALL:ALL) ALL\` 那一行前面的 \`#\` 删掉：

\`\`\`
EDITOR=vim visudo
\`\`\`

必须用 \`visudo\` 而不是直接编辑 \`/etc/sudoers\`，它会在保存前做语法检查。这个文件写坏会导致所有人都拿不到 sudo。`,
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

不启用的话，重启之后新系统没有网络。安装介质里的联网配置不会带过来。`,
    },
  },
]
