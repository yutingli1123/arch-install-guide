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
    title: { zh: '安装配套软件' },
    when: (cfg) => cfg.hyprland !== null,
    body: {
      zh: ({
        cfg,
        hyprlandPackages,
        hyprlandServices,
        hyprlandAurPackages,
      }) => `安装所选的 Hyprland 配套软件：

\`\`\`
pacman -S ${hyprlandPackages.join(' ')}${
        hyprlandServices.length
          ? `\nsystemctl --global enable ${hyprlandServices.map((name) => `${name}.service`).join(' ')}`
          : ''
      }
\`\`\`
${
  hyprlandServices.length
    ? `\n\`--global\` 为所有用户启用这些用户服务，它们随 \`hyprland-session.target\` 启动。\n`
    : ''
}${
        hyprlandAurPackages.length
          ? `
以下软件包以普通用户构建：

\`\`\`
sudo -u ${cfg.username} paru -S ${hyprlandAurPackages.join(' ')}
\`\`\`
`
          : ''
      }`,
    },
  },
  {
    id: 'hyprland-elephant',
    section: 'hyprland',
    title: { zh: '启用 Elephant 服务' },
    when: (cfg) => cfg.hyprland?.launcher === 'walker',
    body: {
      zh: () => `Walker 自身不检索数据，启动前 Elephant 必须已在用户会话中运行。它需要用户会话的环境变量，因此作为用户服务启用，而不是系统服务。

新建 \`/etc/systemd/user/elephant.service\`：

\`\`\`
vim /etc/systemd/user/elephant.service
\`\`\`

写入：

\`\`\`
[Unit]
Description=Elephant data provider
PartOf=graphical-session.target
After=graphical-session.target

[Service]
Type=simple
ExecStart=/usr/bin/elephant
Restart=on-failure

[Install]
WantedBy=graphical-session.target
\`\`\`

启用：

\`\`\`
systemctl --global enable elephant.service
\`\`\`

Walker 的每个数据源都是独立的 \`elephant-*\` 软件包，上一步只装了应用列表。计算、文件、剪贴板、窗口等其余数据源按需另装，各自的运行时依赖由对应软件包声明。`,
    },
  },
  {
    id: 'hyprland-programs',
    section: 'hyprland',
    title: { zh: '设置默认程序' },
    when: (cfg) => cfg.hyprland !== null,
    body: {
      zh: ({ cfg }) => {
        const { terminal, fileManager, launcher } = cfg.hyprland!

        return `编辑 \`/home/${cfg.username}/.config/hypr/hyprland.lua\`：

\`\`\`
vim /home/${cfg.username}/.config/hypr/hyprland.lua
\`\`\`

把 \`MY PROGRAMS\` 一节改为：

\`\`\`lua
local terminal    = "${terminal}"
local fileManager = "${fileManager}"
local menu        = "${LAUNCHER_COMMANDS[launcher]}"
\`\`\`

这三行分别对应 \`SUPER + Q\`、\`SUPER + E\` 和 \`SUPER + R\`。`
      },
    },
  },
  {
    id: 'hyprland-lock',
    section: 'hyprland',
    title: { zh: '配置锁屏与空闲' },
    when: (cfg) => cfg.hyprland?.lock === 'hyprlock',
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

写入（\`monitor\` 留空表示应用到全部显示器）：

\`\`\`
wallpaper {
    monitor =
    path = /usr/share/hypr/wall2.png
}
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
      zh: ({ cfg }) => `在 \`/home/${cfg.username}/.config/hypr/hyprland.lua\` 的 \`KEYBINDINGS\` 一节加入：

\`\`\`lua
hl.bind("PRINT",         hl.dsp.exec_cmd("hyprshot -m output"))
hl.bind("SHIFT + PRINT", hl.dsp.exec_cmd("hyprshot -m region"))
hl.bind("CTRL + PRINT",  hl.dsp.exec_cmd("hyprshot -m window"))
\`\`\`

截图保存在 \`~/Pictures\`，同时写入剪贴板。`,
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
        cfg.hyprland!.addons.includes('seahorse')
          ? '\n\nSeahorse 提供查看和管理已存密码的图形界面。'
          : ''
      }`,
    },
  },
]
