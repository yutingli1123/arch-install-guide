import type { Config, HyprlandAddon, Step } from '../types'

const selected = (cfg: Config) => cfg.desktop === 'hyprland'
const hasAddon = (cfg: Config, addon: HyprlandAddon) =>
  selected(cfg) && cfg.hyprland.addons.includes(addon)

/** Command the launcher choice binds to; both need an explicit application mode. */
const LAUNCHER_COMMANDS = { rofi: 'rofi -show drun', wofi: 'wofi --show drun' }

export const hyprlandSteps: Step[] = [
  {
    id: 'hyprland-extras',
    section: 'hyprland',
    title: { zh: '安装配套软件' },
    when: (cfg) => selected(cfg) && cfg.hyprland.addons.length + chosenCategories(cfg) > 0,
    body: {
      zh: ({ hyprlandPackages, hyprlandServices }) => `安装所选的 Hyprland 配套软件：

\`\`\`
pacman -S ${hyprlandPackages.join(' ')}${
        hyprlandServices.length
          ? `\nsystemctl --global enable ${hyprlandServices.map((name) => `${name}.service`).join(' ')}`
          : ''
      }
\`\`\`

以上软件包均来自官方仓库。${
        hyprlandServices.length
          ? `\`--global\` 为所有用户启用这些用户服务，它们随 \`hyprland-session.target\` 启动。`
          : ''
      }`,
    },
  },
  {
    id: 'hyprland-programs',
    section: 'hyprland',
    title: { zh: '设置默认程序' },
    when: (cfg) =>
      selected(cfg) &&
      (cfg.hyprland.terminal !== 'none' ||
        cfg.hyprland.fileManager !== 'none' ||
        cfg.hyprland.launcher !== 'none'),
    body: {
      zh: ({ cfg }) => {
        const { terminal, fileManager, launcher } = cfg.hyprland
        const lines = [
          terminal === 'none' ? '' : `local terminal    = "${terminal}"`,
          fileManager === 'none' ? '' : `local fileManager = "${fileManager}"`,
          launcher === 'none' ? '' : `local menu        = "${LAUNCHER_COMMANDS[launcher]}"`,
        ].filter(Boolean)
        const missing = [
          terminal === 'none' ? '`SUPER + Q`' : '',
          fileManager === 'none' ? '`SUPER + E`' : '',
          launcher === 'none' ? '`SUPER + R`' : '',
        ].filter(Boolean)

        return `编辑 \`/home/${cfg.username}/.config/hypr/hyprland.lua\`：

\`\`\`
vim /home/${cfg.username}/.config/hypr/hyprland.lua
\`\`\`

把 \`MY PROGRAMS\` 一节中对应的行改为：

\`\`\`lua
${lines.join('\n')}
\`\`\`${
          missing.length
            ? `\n\n${missing.join('、')} 仍指向默认配置里未安装的程序，按下不会有反应；可以在 \`KEYBINDINGS\` 一节删除对应的 \`hl.bind\`。`
            : ''
        }`
      },
    },
  },
  {
    id: 'hyprland-lock',
    section: 'hyprland',
    title: { zh: '配置锁屏与空闲' },
    when: (cfg) => selected(cfg) && cfg.hyprland.lock !== 'none',
    body: {
      zh: ({ cfg }) => `复制 Hyprlock 与 Hypridle 的示例配置：

\`\`\`
install -o ${cfg.username} -g ${cfg.username} -m 644 /usr/share/hypr/hyprlock.conf /home/${cfg.username}/.config/hypr/hyprlock.conf
install -o ${cfg.username} -g ${cfg.username} -m 644 /usr/share/hypr/hypridle.conf /home/${cfg.username}/.config/hypr/hypridle.conf
\`\`\`

在 \`/home/${cfg.username}/.config/hypr/hyprland.lua\` 的 \`KEYBINDINGS\` 一节加入手动锁屏：

\`\`\`lua
hl.bind(mainMod .. " + L", hl.dsp.exec_cmd("loginctl lock-session"))
\`\`\`

示例 \`hypridle.conf\` 中调节背光的两条 listener 依赖 \`brightnessctl\`，未安装时它们不生效，锁屏、息屏与挂起不受影响。`,
    },
  },
  {
    id: 'hyprland-wallpaper',
    section: 'hyprland',
    title: { zh: '配置壁纸' },
    when: (cfg) => hasAddon(cfg, 'hyprpaper'),
    body: {
      zh: ({
        cfg,
      }) => `Hyprpaper 没有默认壁纸，需要指定要加载的图片。新建 \`/home/${cfg.username}/.config/hypr/hyprpaper.conf\`：

\`\`\`
vim /home/${cfg.username}/.config/hypr/hyprpaper.conf
\`\`\`

写入（\`wallpaper\` 的显示器留空表示应用到全部显示器）：

\`\`\`
preload = /usr/share/hypr/wall2.png
wallpaper = , /usr/share/hypr/wall2.png
\`\`\`

修正所有者：

\`\`\`
chown ${cfg.username}:${cfg.username} /home/${cfg.username}/.config/hypr/hyprpaper.conf
\`\`\``,
    },
  },
  {
    id: 'hyprland-screenshot',
    section: 'hyprland',
    title: { zh: '配置截图快捷键' },
    when: (cfg) => hasAddon(cfg, 'hyprshot'),
    body: {
      zh: ({ cfg }) => {
        const region = cfg.hyprland.addons.includes('satty')
          ? 'hyprshot -m region --raw | satty --filename -'
          : 'hyprshot -m region'

        return `在 \`/home/${cfg.username}/.config/hypr/hyprland.lua\` 的 \`KEYBINDINGS\` 一节加入：

\`\`\`lua
hl.bind("PRINT",         hl.dsp.exec_cmd("hyprshot -m output"))
hl.bind("SHIFT + PRINT", hl.dsp.exec_cmd("${region}"))
hl.bind("CTRL + PRINT",  hl.dsp.exec_cmd("hyprshot -m window"))
\`\`\`

截图保存在 \`~/Pictures\`，同时写入剪贴板。`
      },
    },
  },
  {
    id: 'hyprland-keyring',
    section: 'hyprland',
    title: { zh: '配置密钥环自动解锁' },
    when: (cfg) => hasAddon(cfg, 'gnome-keyring'),
    body: {
      zh: ({ cfg }) => `编辑 \`/etc/pam.d/greetd\`：

\`\`\`
vim /etc/pam.d/greetd
\`\`\`

在文件末尾加入：

\`\`\`
auth       optional     pam_gnome_keyring.so
session    optional     pam_gnome_keyring.so auto_start
\`\`\`

登录密码将同时解锁默认密钥环。缺少这两行时密钥环仍可使用，但每次访问都要单独输入密码。${
        cfg.hyprland.addons.includes('seahorse')
          ? '\n\nSeahorse 提供查看和管理已存密码的图形界面。'
          : ''
      }`,
    },
  },
]

function chosenCategories(cfg: Config): number {
  const { notifications, launcher, fileManager, terminal, bar, lock } = cfg.hyprland
  return [notifications, launcher, fileManager, terminal, bar, lock].filter(
    (choice) => choice !== 'none',
  ).length
}
