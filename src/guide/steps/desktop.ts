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
\`\`\``,
    },
  },
  {
    id: 'desktop-common',
    section: 'desktop',
    title: { zh: '安装蓝牙、字体与输入法' },
    when: (cfg) => cfg.desktop !== 'none',
    body: {
      zh: ({ cfg, desktopCommonPackages }) => `安装 Noto 字体家族（含 CJK、emoji）。${
        cfg.desktop === 'hyprland'
          ? '安装 BlueZ 蓝牙后端与工具、Blueman 管理界面、Fcitx 5、GTK/Qt 前端和配置工具'
          : '安装 Fcitx 5、GTK/Qt 前端和配置工具'
      }${
        cfg.systemLocale.startsWith('zh_')
          ? '；当前中文 locale 同时安装拼音输入引擎'
          : cfg.systemLocale.startsWith('ja_')
            ? '；当前日文 locale 同时安装 Mozc 输入引擎'
            : cfg.systemLocale.startsWith('ko_')
              ? '；当前韩文 locale 同时安装 Hangul 输入引擎'
              : ''
      }：

\`\`\`
pacman -S ${desktopCommonPackages.join(' ')}${cfg.desktop === 'hyprland' ? '\nsystemctl enable bluetooth' : ''}
\`\`\`

为 XWayland 应用设置 \`XMODIFIERS\`：

\`\`\`
install -d /etc/environment.d
vim /etc/environment.d/90-fcitx.conf
\`\`\`

写入：

\`\`\`
XMODIFIERS=@im=fcitx
\`\`\``,
    },
  },
  {
    id: 'kde-fcitx',
    section: 'desktop',
    title: { zh: '启用 KDE 输入法' },
    when: (cfg) => cfg.desktop === 'kde',
    body: {
      zh: () => `首次登录 KDE Plasma 后，打开“系统设置 → 虚拟键盘”，选择 Fcitx 5。`,
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
pacman -S ${desktopPackages.join(' ')}${cfg.desktop !== 'hyprland' ? '\nsystemctl enable bluetooth' : ''}${displayManager ? `\nsystemctl enable ${displayManager}` : ''}
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
