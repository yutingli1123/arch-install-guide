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
    text('desktop.desktop-common.gtk'),
    cmd(
      `install -d -o ${username} -g ${username} /home/${username}/.config/gtk-3.0\n` +
        `vim /home/${username}/.config/gtk-3.0/settings.ini`,
    ),
    text('desktop.desktop-common.write'),
    cmd('[Settings]\ngtk-im-module=fcitx', 'ini'),
    text('desktop.desktop-common.gtk2'),
    cmd(`vim /home/${username}/.gtkrc-2.0`),
    text('desktop.desktop-common.write'),
    cmd('gtk-im-module="fcitx"'),
    text('desktop.desktop-common.chown'),
    cmd(
      `chown ${username}:${username} /home/${username}/.config/gtk-3.0/settings.ini /home/${username}/.gtkrc-2.0`,
    ),
  ]
}

export const desktopSteps: Step[] = [
  {
    id: 'graphics-driver',
    section: 'desktop',
    title: 'desktop.graphics-driver.title',
    body: ({ cfg, graphicsPackages }) => [
      text('desktop.graphics-driver.intro'),
      cmd(`pacman -S ${graphicsPackages.join(' ')}`),
      ...(cfg.graphics === 'nvidia' ? [text('desktop.graphics-driver.nvidia')] : []),
    ],
  },
  {
    id: 'audio',
    section: 'desktop',
    title: 'desktop.audio.title',
    when: (cfg) => cfg.desktop !== 'none',
    body: ({ audioPackages }) => [
      text('desktop.audio.intro'),
      cmd(`pacman -S ${audioPackages.join(' ')}`),
    ],
  },
  {
    id: 'desktop-common',
    section: 'desktop',
    title: 'desktop.desktop-common.title',
    when: (cfg) => cfg.desktop !== 'none',
    body: ({ cfg, desktopCommonPackages }) => [
      text('desktop.desktop-common.intro'),
      cmd(
        `pacman -S ${desktopCommonPackages.join(' ')}${cfg.desktop === 'hyprland' ? '\nsystemctl enable bluetooth' : ''}`,
      ),
      ...(cfg.desktop === 'gnome'
        ? [
            text('desktop.desktop-common.gnome-ibus'),
            text('desktop.desktop-common.kimpanel'),
            cmd(`sudo -u ${cfg.username} paru -S gnome-shell-extension-kimpanel-git`),
          ]
        : [
            ...(cfg.desktop === 'kde'
              ? [
                  text('desktop.desktop-common.kde-env'),
                  cmd('install -d /etc/environment.d\nvim /etc/environment.d/90-fcitx.conf'),
                  text('desktop.desktop-common.write'),
                  cmd('XMODIFIERS=@im=fcitx\nQT_IM_MODULES=wayland;fcitx'),
                ]
              : []),
            ...gtkInputMethodBlocks(cfg.username),
            ...(cfg.desktop === 'kde'
              ? [
                  text('desktop.desktop-common.kde-autostart'),
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
    title: 'desktop.cjk-font-priority.title',
    when: (cfg) => cfg.desktop !== 'none' && cfg.systemLocale in CJK_VARIANTS,
    body: ({ cjkVariant }) => [
      text('desktop.cjk-font-priority.create'),
      cmd('vim /etc/fonts/conf.d/64-noto-cjk.conf'),
      text('desktop.cjk-font-priority.write'),
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
    title: 'desktop.gnome-kimpanel.title',
    when: (cfg) => cfg.desktop === 'gnome',
    body: () => [text('desktop.gnome-kimpanel.enable')],
  },
  {
    id: 'kde-fcitx',
    section: 'desktop',
    title: 'desktop.kde-fcitx.title',
    when: (cfg) => cfg.desktop === 'kde',
    body: () => [text('desktop.kde-fcitx.enable')],
  },
  {
    id: 'desktop-environment',
    section: 'desktop',
    title: 'desktop.desktop-environment.title',
    when: (cfg) => cfg.desktop !== 'none',
    body: ({ cfg, desktopPackages, displayManager }) => [
      text('desktop.desktop-environment.intro'),
      cmd(
        `pacman -S ${desktopPackages.join(' ')}${cfg.desktop !== 'hyprland' ? '\nsystemctl enable bluetooth' : ''}${displayManager ? `\nsystemctl enable ${displayManager}` : ''}${cfg.desktop === 'hyprland' ? '\nsystemctl --global enable hyprpolkitagent.service' : ''}`,
      ),
      ...(cfg.desktop === 'hyprland'
        ? [
            text('desktop.desktop-environment.greetd'),
            cmd('vim /etc/greetd/hyprland.lua'),
            text('desktop.desktop-environment.write'),
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
            text('desktop.desktop-environment.greetd-config'),
            cmd('vim /etc/greetd/config.toml'),
            text('desktop.desktop-environment.greetd-command'),
            cmd('command = "dbus-run-session start-hyprland -- -c /etc/greetd/hyprland.lua"'),
            text('desktop.desktop-environment.session-target'),
            cmd('vim /etc/systemd/user/hyprland-session.target'),
            text('desktop.desktop-environment.session-write'),
            cmd(
              `[Unit]
Description=Hyprland session
BindsTo=graphical-session.target
Wants=graphical-session-pre.target
After=graphical-session-pre.target
Wants=xdg-desktop-autostart.target
PropagatesStopTo=graphical-session.target`,
            ),
            text('desktop.desktop-environment.copy-config'),
            cmd(
              `install -d -o ${cfg.username} -g ${cfg.username} /home/${cfg.username}/.config/hypr\n` +
                `install -o ${cfg.username} -g ${cfg.username} -m 644 /usr/share/hypr/hyprland.lua /home/${cfg.username}/.config/hypr/hyprland.lua\n` +
                `vim /home/${cfg.username}/.config/hypr/hyprland.lua`,
            ),
            text('desktop.desktop-environment.env'),
            cmd(
              'hl.env("XMODIFIERS", "@im=fcitx")\nhl.env("QT_IM_MODULES", "wayland;fcitx")',
              'lua',
            ),
            text('desktop.desktop-environment.autostart'),
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
        : [text('desktop.desktop-environment.display-manager')]),
    ],
  },
]
