import { CJK_VARIANTS } from '../derive'
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

${
        cfg.desktop === 'gnome'
          ? `GNOME 会把会话的输入法配置成 ibus，Fcitx 5 由自启动项拉起后取代 ibus，无需设置环境变量。

安装 Kimpanel 扩展。AUR 操作必须使用普通用户：

\`\`\`
sudo -u ${cfg.username} paru -S gnome-shell-extension-kimpanel-git
\`\`\``
          : `${
              cfg.desktop === 'kde'
                ? `为 XWayland 应用设置输入法环境变量：

\`\`\`
install -d /etc/environment.d
vim /etc/environment.d/90-fcitx.conf
\`\`\`

写入：

\`\`\`
XMODIFIERS=@im=fcitx
QT_IM_MODULES=wayland;fcitx
\`\`\`

`
                : ''
            }GTK 应用改用配置文件指定输入法模块，只作用于 X11/XWayland 下的 GTK 程序：

\`\`\`
install -d -o ${cfg.username} -g ${cfg.username} /home/${cfg.username}/.config/gtk-3.0
vim /home/${cfg.username}/.config/gtk-3.0/settings.ini
\`\`\`

写入：

\`\`\`ini
[Settings]
gtk-im-module=fcitx
\`\`\`

如果要运行 GTK2 程序，另建 \`/home/${cfg.username}/.gtkrc-2.0\`：

\`\`\`
vim /home/${cfg.username}/.gtkrc-2.0
\`\`\`

写入：

\`\`\`
gtk-im-module="fcitx"
\`\`\`

修正这两个文件的所有者：

\`\`\`
chown ${cfg.username}:${cfg.username} /home/${cfg.username}/.config/gtk-3.0/settings.ini /home/${cfg.username}/.gtkrc-2.0
\`\`\`${
              cfg.desktop === 'kde'
                ? `

KDE 下 Fcitx 5 由 KWin 启动，屏蔽 XDG 自启动项：

\`\`\`
install -d -o ${cfg.username} -g ${cfg.username} /home/${cfg.username}/.config/autostart
install -o ${cfg.username} -g ${cfg.username} -m 644 /etc/xdg/autostart/org.fcitx.Fcitx5.desktop /home/${cfg.username}/.config/autostart/
echo 'Hidden=true' >> /home/${cfg.username}/.config/autostart/org.fcitx.Fcitx5.desktop
\`\`\``
                : ''
            }`
      }`,
    },
  },
  {
    id: 'cjk-font-priority',
    section: 'desktop',
    title: { zh: '设置字体优先级' },
    when: (cfg) => cfg.desktop !== 'none' && cfg.systemLocale in CJK_VARIANTS,
    body: {
      zh: ({ cjkVariant }) => `新建 \`/etc/fonts/conf.d/64-noto-cjk.conf\`：

\`\`\`
vim /etc/fonts/conf.d/64-noto-cjk.conf
\`\`\`

写入：

\`\`\`xml
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
<fontconfig>
  <match target="pattern">
    <test qual="any" name="family"><string>sans-serif</string></test>
    <edit name="family" mode="append_last" binding="strong"><string>Noto Sans</string></edit>
  </match>
  <match target="pattern">
    <test qual="any" name="family"><string>serif</string></test>
    <edit name="family" mode="append_last" binding="strong"><string>Noto Serif</string></edit>
  </match>
  <match target="pattern">
    <test qual="any" name="family"><string>monospace</string></test>
    <edit name="family" mode="append_last" binding="strong"><string>Noto Sans Mono</string></edit>
  </match>

  <match target="pattern">
    <test qual="any" name="family"><string>sans-serif</string></test>
    <edit name="family" mode="prepend" binding="weak"><string>Noto Sans CJK ${cjkVariant}</string></edit>
  </match>
  <match target="pattern">
    <test qual="any" name="family"><string>serif</string></test>
    <edit name="family" mode="prepend" binding="weak"><string>Noto Serif CJK ${cjkVariant}</string></edit>
  </match>
  <match target="pattern">
    <test qual="any" name="family"><string>monospace</string></test>
    <edit name="family" mode="prepend" binding="weak"><string>Noto Sans Mono CJK ${cjkVariant}</string></edit>
  </match>
</fontconfig>
\`\`\``,
    },
  },
  {
    id: 'gnome-kimpanel',
    section: 'desktop',
    title: { zh: '启用 Kimpanel 扩展' },
    when: (cfg) => cfg.desktop === 'gnome',
    body: {
      zh: () => `首次登录 GNOME 后，在扩展管理中启用 Kimpanel，输入法候选窗口才会显示。`,
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
pacman -S ${desktopPackages.join(' ')}${cfg.desktop !== 'hyprland' ? '\nsystemctl enable bluetooth' : ''}${displayManager ? `\nsystemctl enable ${displayManager}` : ''}${cfg.desktop === 'hyprland' ? '\nsystemctl --global enable hyprpolkitagent.service' : ''}
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

将 \`[default_session]\` 中的 \`command\` 改为：

\`\`\`
command = "dbus-run-session start-hyprland -- -c /etc/greetd/hyprland.lua"
\`\`\`

新建 \`/etc/systemd/user/hyprland-session.target\`：

\`\`\`
vim /etc/systemd/user/hyprland-session.target
\`\`\`

写入：

\`\`\`
[Unit]
Description=Hyprland session
BindsTo=graphical-session.target
Wants=graphical-session-pre.target
After=graphical-session-pre.target
Wants=xdg-desktop-autostart.target
PropagatesStopTo=graphical-session.target
\`\`\`

复制默认配置作为该用户的 Hyprland 配置：

\`\`\`
install -d -o ${cfg.username} -g ${cfg.username} /home/${cfg.username}/.config/hypr
install -o ${cfg.username} -g ${cfg.username} -m 644 /usr/share/hypr/hyprland.lua /home/${cfg.username}/.config/hypr/hyprland.lua
vim /home/${cfg.username}/.config/hypr/hyprland.lua
\`\`\`

将 \`MY PROGRAMS\` 一节的 \`terminal\` 改为：

\`\`\`lua
local terminal    = "ghostty"
\`\`\`

在 \`ENVIRONMENT VARIABLES\` 一节加入：

\`\`\`lua
hl.env("XMODIFIERS", "@im=fcitx")
hl.env("QT_IM_MODULES", "wayland;fcitx")
\`\`\`

在 \`AUTOSTART\` 一节加入：

\`\`\`lua
hl.on("hyprland.start", function()
    hl.exec_cmd("bash -c 'dbus-update-activation-environment --systemd XCURSOR_THEME XCURSOR_SIZE XMODIFIERS QT_IM_MODULES XDG_SESSION_TYPE; systemctl --user start hyprland-session.target'")
end)

hl.on("hyprland.shutdown", function()
    os.execute("systemctl --user stop hyprland-session.target && sleep 0.1")
end)
\`\`\``
          : `\n\n重启后由 \`${displayManager}\` 提供图形登录界面。`
      }`,
    },
  },
]
