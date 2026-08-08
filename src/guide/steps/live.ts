import type { Step } from '../types'

export const liveSteps: Step[] = [
  {
    id: 'boot-mode',
    section: 'live',
    title: { zh: '确认以 UEFI 模式启动' },
    body: {
      zh: () => `从 Arch 安装介质启动后，先确认固件模式：

\`\`\`
cat /sys/firmware/efi/fw_platform_size
\`\`\`

输出 \`64\` 表示 64 位 UEFI，可以继续。

如果提示文件不存在，说明当前是 BIOS/CSM 模式启动的。本指南只覆盖 UEFI，需要进固件设置关掉 CSM 后重新启动安装介质。`,
    },
  },
  {
    id: 'keymap',
    section: 'live',
    title: { zh: '键盘布局' },
    body: {
      zh: ({ cfg }) => `安装介质默认使用 \`us\` 布局。列出全部可用布局：

\`\`\`
localectl list-keymaps
\`\`\`

加载所需布局：

\`\`\`
loadkeys ${cfg.keymap}
\`\`\``,
    },
  },
  {
    id: 'network',
    section: 'live',
    title: { zh: '连接网络' },
    body: {
      zh: () => `有线网络通常已经自动获取地址。验证连通性：

\`\`\`
ping -c 3 archlinux.org
\`\`\`

无线网络用 \`iwctl\` 连接。先查网卡名，再连接，其中 \`wlan0\` 和 \`SSID\` 换成实际值：

\`\`\`
iwctl station list
iwctl station wlan0 connect SSID
\`\`\`

连上之后再跑一次 \`ping\` 确认。后面每一步都需要网络。`,
    },
  },
  {
    id: 'clock',
    section: 'live',
    title: { zh: '校时' },
    body: {
      zh: () => `安装介质会自动同步时间。确认一下：

\`\`\`
timedatectl
\`\`\`

\`System clock synchronized\` 应为 \`yes\`。时间不对会导致后面 pacman 校验签名失败。`,
    },
  },
]
