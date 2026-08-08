import type { Step } from '../types'

export const finishSteps: Step[] = [
  {
    id: 'reboot',
    section: 'finish',
    title: { zh: '重启' },
    body: {
      zh: ({ cfg }) => `离开 chroot，卸载全部挂载点，重启：

\`\`\`
exit
umount -R /mnt
reboot
\`\`\`

\`umount -R\` 递归卸载，漏卸会导致 btrfs 上有未落盘的数据。

重启前拔掉安装介质。systemd-boot 的菜单默认隐藏，开机直接启动主 UKI；要选 fallback 时开机按住 Space 调出菜单。进系统后用 \`${cfg.username}\` 登录。`,
    },
  },
  {
    id: 'post-install',
    section: 'finish',
    title: { zh: '进系统之后' },
    body: {
      zh: () => `确认网络：

\`\`\`
ping -c 3 archlinux.org
\`\`\`

没通的话用 \`nmtui\` 配置。

到这里是一个能启动、有网络、有普通用户的最小系统。桌面环境、显卡驱动、快照这些还没有装。`,
    },
  },
]
