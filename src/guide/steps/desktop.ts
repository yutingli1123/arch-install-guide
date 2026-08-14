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
    id: 'audio',
    section: 'desktop',
    title: { zh: '安装音频服务' },
    when: (cfg) => cfg.desktop !== 'none',
    body: {
      zh: ({ audioPackages }) => `安装 PipeWire 音频服务、WirePlumber 会话管理器和音量控制界面：

\`\`\`
pacman -S ${audioPackages.join(' ')}
\`\`\`

PipeWire、PulseAudio 兼容服务和 WirePlumber 会在用户登录图形会话后通过 systemd 用户服务自动启动，无需在 chroot 中手动启用。`,
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
          ? `

配置 greetd 使用 ReGreet 图形登录界面。新建 \`/etc/greetd/hyprland.lua\`：

\`\`\`
vim /etc/greetd/hyprland.lua
\`\`\`

写入：

\`\`\`lua
hl.on("hyprland.start", function()
    hl.exec_cmd("regreet; hyprctl dispatch 'hl.dsp.exit()'")
end)

hl.config({
    misc = {
        disable_hyprland_logo = true,
        disable_splash_rendering = true,
        disable_hyprland_guiutils_check = true,
    },
})
\`\`\`

编辑 \`/etc/greetd/config.toml\`：

\`\`\`
vim /etc/greetd/config.toml
\`\`\`

写入：

\`\`\`
[terminal]
vt = 1

[default_session]
command = "dbus-run-session start-hyprland -- -c /etc/greetd/hyprland.lua"
user = "greeter"
\`\`\`

ReGreet 会从会话文件中启动 Hyprland 的 UWSM 会话。首次登录并打开 Ghostty 后执行 \`systemctl --user enable --now hyprpolkitagent.service\`，让图形程序能够请求提权认证，并在后续图形会话中自动启动认证代理。`
          : `\n\n重启后由 \`${displayManager}\` 提供图形登录界面。`
      }`,
    },
  },
]
