import type { Step } from '../types'

const desktopNames = {
  none: '',
  gnome: 'GNOME',
  kde: 'KDE Plasma',
  hyprland: 'Hyprland',
} as const

export const desktopSteps: Step[] = [
  {
    id: 'graphics-driver',
    section: 'desktop',
    title: { zh: '安装显卡驱动' },
    body: {
      zh: ({ cfg, graphicsPackages }) => `安装 ${cfg.graphics.toUpperCase()} 显卡所需的软件包：

\`\`\`
pacman -S ${graphicsPackages.join(' ')}
\`\`\`${
        cfg.graphics === 'nvidia'
          ? '\n\n`nvidia-open` 适用于 Turing 及更新架构。Pascal 或更早的显卡不要执行此命令，应先根据具体型号确认对应的旧版驱动。'
          : ''
      }`,
    },
  },
  {
    id: 'desktop-environment',
    section: 'desktop',
    title: { zh: '安装桌面环境' },
    when: (cfg) => cfg.desktop !== 'none',
    body: {
      zh: ({ cfg, desktopPackages, displayManager }) => `安装 ${desktopNames[cfg.desktop]}：

\`\`\`
pacman -S ${desktopPackages.join(' ')}${displayManager ? `\nsystemctl enable ${displayManager}` : ''}
\`\`\`${
        cfg.desktop === 'hyprland'
          ? '\n\nHyprland 不在此处启用显示管理器。重启并登录 TTY 后，执行 `start-hyprland` 启动会话；首次启动会生成默认配置。打开 Ghostty 后执行 `systemctl --user enable --now hyprpolkitagent.service`，让图形程序能够请求提权认证，并在后续 UWSM 会话中自动启动认证代理。'
          : `\n\n重启后由 \`${displayManager}\` 提供图形登录界面。`
      }`,
    },
  },
]
