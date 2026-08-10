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

\`umount -R\` 会递归卸载全部挂载点，避免 btrfs 中仍有尚未写入磁盘的数据。

重启前请移除安装介质。systemd-boot 菜单默认隐藏，系统会直接启动常规 UKI；如需选择 fallback，请在开机时按住 Space 调出菜单。进入系统后，使用 \`${cfg.username}\` 登录。`,
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

如果网络不通，请使用 \`nmtui\` 进行配置。

至此，最小系统应当能够启动和联网，并可使用普通用户登录。桌面环境、显卡驱动和快照功能尚未安装。`,
    },
  },
]
