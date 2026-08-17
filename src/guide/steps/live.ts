import { cmd, text } from '../blocks'
import type { Step } from '../types'

export const liveSteps: Step[] = [
  {
    id: 'boot-mode',
    section: 'live',
    title: { zh: '确认以 UEFI 模式启动' },
    body: () => [
      text('从 Arch 安装介质启动后，先确认固件模式：'),
      cmd('cat /sys/firmware/efi/fw_platform_size'),
      text('输出 `64` 表示 64 位 UEFI，可以继续。'),
      text(
        '如果提示文件不存在，说明安装介质当前以 BIOS/CSM 模式启动。本指南仅适用于 UEFI；请在固件设置中关闭 CSM，然后重新启动安装介质。',
      ),
    ],
  },
  {
    id: 'keymap',
    section: 'live',
    title: { zh: '键盘布局' },
    when: (cfg) => cfg.keymap !== 'us',
    body: ({ cfg }) => [
      text('列出全部可用布局：'),
      cmd('localectl list-keymaps'),
      text('加载所需布局：'),
      cmd(`loadkeys ${cfg.keymap}`),
    ],
  },
  {
    id: 'network',
    section: 'live',
    title: { zh: '连接网络' },
    body: () => [
      text('有线网络通常已经自动获取地址。验证连通性：'),
      cmd('ping -c 3 archlinux.org'),
      text(
        '无线网络使用 `iwctl` 连接。先查询无线网卡名称，再建立连接；请将 `wlan0` 和 `SSID` 替换为实际值：',
      ),
      cmd('iwctl station list\niwctl station wlan0 connect SSID'),
      text('连接后再次执行 `ping` 以确认网络可用。后续步骤需要保持网络连接。'),
      text(
        '如果有第二台设备，安装介质自带的 `sshd` 已经在运行，可以从那台设备上 SSH 进来，在支持复制粘贴的终端里执行后续命令。使用 `passwd` 设置 root 密码，再用 `ip a` 查看当前分配到的 IP 地址：',
      ),
      cmd('passwd\nip a'),
      text('记下地址后，在第二台设备上执行 `ssh root@<地址>`。'),
    ],
  },
  {
    id: 'clock',
    section: 'live',
    title: { zh: '校时' },
    body: () => [
      text('安装介质会自动同步时间。检查同步状态：'),
      cmd('timedatectl'),
      text(
        '`System clock synchronized` 应为 `yes`。系统时间不准确可能导致后续 pacman 签名校验失败。',
      ),
    ],
  },
  {
    id: 'mirrors',
    section: 'live',
    title: { zh: '选择镜像源' },
    body: ({ cfg }) => [
      text(
        `使用 reflector 筛选 ${cfg.reflector.countries.join(',')} 中最近 ${cfg.reflector.ageHours} 小时内同步的 HTTPS 镜像，再按下载速度排序并保留 ${cfg.reflector.number} 个：`,
      ),
      cmd(
        `reflector --country ${cfg.reflector.countries.join(',')} --age ${cfg.reflector.ageHours} --protocol https --sort rate --number ${cfg.reflector.number} --save /etc/pacman.d/mirrorlist`,
      ),
      text('检查生成的列表：'),
      cmd('cat /etc/pacman.d/mirrorlist'),
      text(
        '列表中的每个 `Server` 地址都应以 `https://` 开头。安装介质中生成的 mirrorlist 会由后续的 `pacstrap` 复制到新系统。',
      ),
    ],
  },
]
