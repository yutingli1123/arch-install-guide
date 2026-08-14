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

如果提示文件不存在，说明安装介质当前以 BIOS/CSM 模式启动。本指南仅适用于 UEFI；请在固件设置中关闭 CSM，然后重新启动安装介质。`,
    },
  },
  {
    id: 'keymap',
    section: 'live',
    title: { zh: '键盘布局' },
    when: (cfg) => cfg.keymap !== 'us',
    body: {
      zh: ({ cfg }) => `列出全部可用布局：

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

无线网络使用 \`iwctl\` 连接。先查询无线网卡名称，再建立连接；请将 \`wlan0\` 和 \`SSID\` 替换为实际值：

\`\`\`
iwctl station list
iwctl station wlan0 connect SSID
\`\`\`

连接后再次执行 \`ping\` 以确认网络可用。后续步骤需要保持网络连接。`,
    },
  },
  {
    id: 'clock',
    section: 'live',
    title: { zh: '校时' },
    body: {
      zh: () => `安装介质会自动同步时间。检查同步状态：

\`\`\`
timedatectl
\`\`\`

\`System clock synchronized\` 应为 \`yes\`。系统时间不准确可能导致后续 pacman 签名校验失败。`,
    },
  },
  {
    id: 'mirrors',
    section: 'live',
    title: { zh: '选择镜像源' },
    body: {
      zh: ({
        cfg,
      }) => `使用 reflector 筛选 ${cfg.reflector.countries.join(',')} 中最近 ${cfg.reflector.ageHours} 小时内同步的 HTTPS 镜像，再按下载速度排序并保留 ${cfg.reflector.number} 个：

\`\`\`
reflector --country ${cfg.reflector.countries.join(',')} --age ${cfg.reflector.ageHours} --protocol https --sort rate --number ${cfg.reflector.number} --save /etc/pacman.d/mirrorlist
\`\`\`

检查生成的列表：

\`\`\`
cat /etc/pacman.d/mirrorlist
\`\`\`

列表中的每个 \`Server\` 地址都应以 \`https://\` 开头。安装介质中生成的 mirrorlist 会由后续的 \`pacstrap\` 复制到新系统。`,
    },
  },
]
