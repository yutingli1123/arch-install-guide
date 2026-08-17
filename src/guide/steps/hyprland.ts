import { cmd, text } from '../blocks'
import type { Config, HyprlandAddon, Step } from '../types'

const hasAddon = (cfg: Config, addon: HyprlandAddon) =>
  cfg.hyprland?.addons.includes(addon) ?? false

/** Command the launcher choice binds to; rofi and wofi need an explicit application mode. */
const LAUNCHER_COMMANDS = {
  hyprlauncher: 'hyprlauncher',
  rofi: 'rofi -show drun',
  wofi: 'wofi --show drun',
  walker: 'walker',
}

export const hyprlandSteps: Step[] = [
  {
    id: 'hyprland-extras',
    section: 'hyprland',
    title: 'hyprland.hyprland-extras.title',
    when: (cfg) => cfg.hyprland !== null,
    body: ({ cfg, hyprlandPackages, hyprlandServices, hyprlandAurPackages }) => [
      text('hyprland.hyprland-extras.intro'),
      cmd(
        `pacman -S ${hyprlandPackages.join(' ')}${
          hyprlandServices.length
            ? `\nsystemctl --global enable ${hyprlandServices.map((name) => `${name}.service`).join(' ')}`
            : ''
        }`,
      ),
      ...(hyprlandServices.length ? [text('hyprland.hyprland-extras.global')] : []),
      ...(hyprlandAurPackages.length
        ? [
            text('hyprland.hyprland-extras.aur'),
            cmd(`sudo -u ${cfg.username} paru -S ${hyprlandAurPackages.join(' ')}`),
          ]
        : []),
    ],
  },
  {
    id: 'hyprland-elephant',
    section: 'hyprland',
    title: 'hyprland.hyprland-elephant.title',
    when: (cfg) => cfg.hyprland?.launcher === 'walker',
    body: () => [
      text('hyprland.hyprland-elephant.why'),
      text('hyprland.hyprland-elephant.create'),
      cmd('vim /etc/systemd/user/elephant.service'),
      text('hyprland.hyprland-elephant.write'),
      cmd(
        '[Unit]\n' +
          'Description=Elephant data provider\n' +
          'PartOf=graphical-session.target\n' +
          'After=graphical-session.target\n' +
          '\n' +
          '[Service]\n' +
          'Type=simple\n' +
          'ExecStart=/usr/bin/elephant\n' +
          'Restart=on-failure\n' +
          '\n' +
          '[Install]\n' +
          'WantedBy=graphical-session.target',
      ),
      text('hyprland.hyprland-elephant.enable'),
      cmd('systemctl --global enable elephant.service'),
      text('hyprland.hyprland-elephant.providers'),
    ],
  },
  {
    id: 'hyprland-programs',
    section: 'hyprland',
    title: 'hyprland.hyprland-programs.title',
    when: (cfg) => cfg.hyprland !== null,
    body: ({ cfg }) => {
      const { terminal, fileManager, launcher } = cfg.hyprland!

      return [
        text('hyprland.hyprland-programs.edit'),
        cmd(`vim /home/${cfg.username}/.config/hypr/hyprland.lua`),
        text('hyprland.hyprland-programs.section'),
        cmd(
          `local terminal    = "${terminal}"\n` +
            `local fileManager = "${fileManager}"\n` +
            `local menu        = "${LAUNCHER_COMMANDS[launcher]}"`,
          'lua',
        ),
        text('hyprland.hyprland-programs.binds'),
      ]
    },
  },
  {
    id: 'hyprland-lock',
    section: 'hyprland',
    title: 'hyprland.hyprland-lock.title',
    when: (cfg) => cfg.hyprland?.lock === 'hyprlock',
    body: ({ cfg }) => [
      text('hyprland.hyprland-lock.copy'),
      cmd(
        `install -o ${cfg.username} -g ${cfg.username} -m 644 /usr/share/hypr/hyprlock.conf /home/${cfg.username}/.config/hypr/hyprlock.conf\n` +
          `install -o ${cfg.username} -g ${cfg.username} -m 644 /usr/share/hypr/hypridle.conf /home/${cfg.username}/.config/hypr/hypridle.conf`,
      ),
      text('hyprland.hyprland-lock.bind'),
      cmd('hl.bind(mainMod .. " + L", hl.dsp.exec_cmd("loginctl lock-session"))', 'lua'),
      text('hyprland.hyprland-lock.brightnessctl'),
    ],
  },
  {
    id: 'hyprland-wallpaper',
    section: 'hyprland',
    title: 'hyprland.hyprland-wallpaper.title',
    when: (cfg) => hasAddon(cfg, 'hyprpaper'),
    body: ({ cfg }) => [
      text('hyprland.hyprland-wallpaper.create'),
      cmd(`vim /home/${cfg.username}/.config/hypr/hyprpaper.conf`),
      text('hyprland.hyprland-wallpaper.write'),
      cmd('wallpaper {\n    monitor =\n    path = /usr/share/hypr/wall2.png\n}'),
      text('hyprland.hyprland-wallpaper.chown'),
      cmd(
        `chown ${cfg.username}:${cfg.username} /home/${cfg.username}/.config/hypr/hyprpaper.conf`,
      ),
    ],
  },
  {
    id: 'hyprland-screenshot',
    section: 'hyprland',
    title: 'hyprland.hyprland-screenshot.title',
    when: (cfg) => hasAddon(cfg, 'hyprshot'),
    body: () => [
      text('hyprland.hyprland-screenshot.binds'),
      cmd(
        'hl.bind("PRINT",         hl.dsp.exec_cmd("hyprshot -m output"))\n' +
          'hl.bind("SHIFT + PRINT", hl.dsp.exec_cmd("hyprshot -m region"))\n' +
          'hl.bind("CTRL + PRINT",  hl.dsp.exec_cmd("hyprshot -m window"))',
        'lua',
      ),
      text('hyprland.hyprland-screenshot.location'),
    ],
  },
  {
    id: 'hyprland-keyring',
    section: 'hyprland',
    title: 'hyprland.hyprland-keyring.title',
    when: (cfg) => hasAddon(cfg, 'gnome-keyring'),
    body: ({ cfg }) => [
      text('hyprland.hyprland-keyring.edit'),
      cmd('vim /etc/pam.d/greetd'),
      text('hyprland.hyprland-keyring.append'),
      cmd(
        'auth       optional     pam_gnome_keyring.so\n' +
          'session    optional     pam_gnome_keyring.so auto_start',
      ),
      text('hyprland.hyprland-keyring.unlock'),
      ...(cfg.hyprland!.addons.includes('seahorse')
        ? [text('hyprland.hyprland-keyring.seahorse')]
        : []),
    ],
  },
]
