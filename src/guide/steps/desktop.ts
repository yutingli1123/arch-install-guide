import { cmd, text } from '../blocks'
import { CJK_VARIANTS } from '../derive'
import type { Block, Step } from '../types'

const desktopNames = {
  none: '',
  gnome: 'GNOME',
  kde: 'KDE Plasma',
  hyprland: 'Hyprland',
} as const

/** Fcitx 5 reads the GTK module from a config file, so every non-GNOME desktop writes the same one. */
function gtkInputMethodBlocks(username: string): Block[] {
  return [
    text('GTK 应用改用配置文件指定输入法模块，只作用于 X11/XWayland 下的 GTK 程序：'),
    cmd(
      `install -d -o ${username} -g ${username} /home/${username}/.config/gtk-3.0\n` +
        `vim /home/${username}/.config/gtk-3.0/settings.ini`,
    ),
    text('写入：'),
    cmd('[Settings]\ngtk-im-module=fcitx', 'ini'),
    text(`如果要运行 GTK2 程序，另建 \`/home/${username}/.gtkrc-2.0\`：`),
    cmd(`vim /home/${username}/.gtkrc-2.0`),
    text('写入：'),
    cmd('gtk-im-module="fcitx"'),
    text('修正这两个文件的所有者：'),
    cmd(
      `chown ${username}:${username} /home/${username}/.config/gtk-3.0/settings.ini /home/${username}/.gtkrc-2.0`,
    ),
  ]
}

export const desktopSteps: Step[] = [
  {
    id: 'graphics-driver',
    section: 'desktop',
    title: { zh: '安装显卡驱动' },
    body: ({ cfg, graphicsPackages }) => [
      text(`安装 ${cfg.graphics.toUpperCase()} 显卡所需的软件包：`),
      cmd(`pacman -S ${graphicsPackages.join(' ')}`),
      ...(cfg.graphics === 'nvidia'
        ? [
            text(
              '`nvidia-open` 适用于 Turing 及更新架构。Pascal 或更早的显卡不要执行此命令，应先根据具体型号确认对应的旧版驱动。',
            ),
          ]
        : []),
    ],
  },
  {
    id: 'audio',
    section: 'desktop',
    title: { zh: '安装音频服务' },
    when: (cfg) => cfg.desktop !== 'none',
    body: ({ audioPackages }) => [
      text('安装 PipeWire 音频服务、WirePlumber 会话管理器和音量控制界面：'),
      cmd(`pacman -S ${audioPackages.join(' ')}`),
    ],
  },
  {
    id: 'desktop-common',
    section: 'desktop',
    title: { zh: '安装蓝牙、字体与输入法' },
    when: (cfg) => cfg.desktop !== 'none',
    body: ({ cfg, desktopCommonPackages }) => [
      text(
        `安装 Noto 字体家族（含 CJK、emoji）。${
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
        }：`,
      ),
      cmd(
        `pacman -S ${desktopCommonPackages.join(' ')}${cfg.desktop === 'hyprland' ? '\nsystemctl enable bluetooth' : ''}`,
      ),
      ...(cfg.desktop === 'gnome'
        ? [
            text(
              'GNOME 会把会话的输入法配置成 ibus，Fcitx 5 由自启动项拉起后取代 ibus，无需设置环境变量。',
            ),
            text('安装 Kimpanel 扩展。AUR 操作必须使用普通用户：'),
            cmd(`sudo -u ${cfg.username} paru -S gnome-shell-extension-kimpanel-git`),
          ]
        : [
            ...(cfg.desktop === 'kde'
              ? [
                  text('为 XWayland 应用设置输入法环境变量：'),
                  cmd('install -d /etc/environment.d\nvim /etc/environment.d/90-fcitx.conf'),
                  text('写入：'),
                  cmd('XMODIFIERS=@im=fcitx\nQT_IM_MODULES=wayland;fcitx'),
                ]
              : []),
            ...gtkInputMethodBlocks(cfg.username),
            ...(cfg.desktop === 'kde'
              ? [
                  text('KDE 下 Fcitx 5 由 KWin 启动，屏蔽 XDG 自启动项：'),
                  cmd(
                    `install -d -o ${cfg.username} -g ${cfg.username} /home/${cfg.username}/.config/autostart\n` +
                      `install -o ${cfg.username} -g ${cfg.username} -m 644 /etc/xdg/autostart/org.fcitx.Fcitx5.desktop /home/${cfg.username}/.config/autostart/\n` +
                      `echo 'Hidden=true' >> /home/${cfg.username}/.config/autostart/org.fcitx.Fcitx5.desktop`,
                  ),
                ]
              : []),
          ]),
    ],
  },
  {
    id: 'cjk-font-priority',
    section: 'desktop',
    title: { zh: '设置字体优先级' },
    when: (cfg) => cfg.desktop !== 'none' && cfg.systemLocale in CJK_VARIANTS,
    body: ({ cjkVariant }) => [
      text('新建 `/etc/fonts/conf.d/64-noto-cjk.conf`：'),
      cmd('vim /etc/fonts/conf.d/64-noto-cjk.conf'),
      text('写入：'),
      cmd(
        `<?xml version="1.0"?>
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
</fontconfig>`,
        'xml',
      ),
    ],
  },
  {
    id: 'gnome-kimpanel',
    section: 'desktop',
    title: { zh: '启用 Kimpanel 扩展' },
    when: (cfg) => cfg.desktop === 'gnome',
    body: () => [text('首次登录 GNOME 后，在扩展管理中启用 Kimpanel，输入法候选窗口才会显示。')],
  },
  {
    id: 'kde-fcitx',
    section: 'desktop',
    title: { zh: '启用 KDE 输入法' },
    when: (cfg) => cfg.desktop === 'kde',
    body: () => [text('首次登录 KDE Plasma 后，打开“系统设置 → 虚拟键盘”，选择 Fcitx 5。')],
  },
  {
    id: 'desktop-environment',
    section: 'desktop',
    title: { zh: '安装桌面环境' },
    when: (cfg) => cfg.desktop !== 'none',
    body: ({ cfg, desktopPackages, displayManager }) => [
      text(`安装 ${desktopNames[cfg.desktop]}：`),
      cmd(
        `pacman -S ${desktopPackages.join(' ')}${cfg.desktop !== 'hyprland' ? '\nsystemctl enable bluetooth' : ''}${displayManager ? `\nsystemctl enable ${displayManager}` : ''}${cfg.desktop === 'hyprland' ? '\nsystemctl --global enable hyprpolkitagent.service' : ''}`,
      ),
      ...(cfg.desktop === 'hyprland'
        ? [
            text('配置 greetd 使用 ReGreet 图形登录界面。新建 `/etc/greetd/hyprland.lua`：'),
            cmd('vim /etc/greetd/hyprland.lua'),
            text('写入：'),
            cmd(
              `hl.on("hyprland.start", function()
    hl.exec_cmd("regreet; hyprctl dispatch 'hl.dsp.exit()'")
end)

hl.config({
    misc = {
        disable_hyprland_logo = true,
        disable_splash_rendering = true,
        disable_hyprland_guiutils_check = true,
    },
})`,
              'lua',
            ),
            text('编辑 `/etc/greetd/config.toml`：'),
            cmd('vim /etc/greetd/config.toml'),
            text('将 `[default_session]` 中的 `command` 改为：'),
            cmd('command = "dbus-run-session start-hyprland -- -c /etc/greetd/hyprland.lua"'),
            text('新建 `/etc/systemd/user/hyprland-session.target`：'),
            cmd('vim /etc/systemd/user/hyprland-session.target'),
            text('写入：'),
            cmd(
              `[Unit]
Description=Hyprland session
BindsTo=graphical-session.target
Wants=graphical-session-pre.target
After=graphical-session-pre.target
Wants=xdg-desktop-autostart.target
PropagatesStopTo=graphical-session.target`,
            ),
            text('复制默认配置作为该用户的 Hyprland 配置：'),
            cmd(
              `install -d -o ${cfg.username} -g ${cfg.username} /home/${cfg.username}/.config/hypr\n` +
                `install -o ${cfg.username} -g ${cfg.username} -m 644 /usr/share/hypr/hyprland.lua /home/${cfg.username}/.config/hypr/hyprland.lua\n` +
                `vim /home/${cfg.username}/.config/hypr/hyprland.lua`,
            ),
            text('在 `ENVIRONMENT VARIABLES` 一节加入：'),
            cmd(
              'hl.env("XMODIFIERS", "@im=fcitx")\nhl.env("QT_IM_MODULES", "wayland;fcitx")',
              'lua',
            ),
            text('在 `AUTOSTART` 一节加入：'),
            cmd(
              `hl.on("hyprland.start", function()
    hl.exec_cmd("bash -c 'dbus-update-activation-environment --systemd XCURSOR_THEME XCURSOR_SIZE XMODIFIERS QT_IM_MODULES XDG_SESSION_TYPE; systemctl --user start hyprland-session.target'")
end)

hl.on("hyprland.shutdown", function()
    os.execute("systemctl --user stop hyprland-session.target && sleep 0.1")
end)`,
              'lua',
            ),
          ]
        : [text(`重启后由 \`${displayManager}\` 提供图形登录界面。`)]),
    ],
  },
]
