import { packagePurposeRows } from '../../packages'
import type { Context } from '../../types'
import type { ChoiceCatalog, DescriptionCatalog, ProseCatalog, UiCatalog } from '../index'

export const name = '简体中文'
/** Any Chinese tag; the longer Traditional Chinese prefixes claimed elsewhere take precedence. */
export const browserTags = ['zh']

/** Simplified Chinese guide prose. Keys left out fall back to the English entry. */
export const prose: ProseCatalog = {
  'live.boot-mode.intro': '从 Arch 安装介质启动后，先确认固件模式：',
  'live.boot-mode.output': '输出 `64` 表示 64 位 UEFI，可以继续。',
  'live.boot-mode.bios':
    '如果提示文件不存在，说明安装介质当前以 BIOS/CSM 模式启动。本指南仅适用于 UEFI；请在固件设置中关闭 CSM，然后重新启动安装介质。',
  'live.keymap.list': '列出全部可用布局：',
  'live.keymap.load': '加载所需布局：',
  'live.network.wired': '有线网络通常已经自动获取地址。验证连通性：',
  'live.network.wireless':
    '无线网络使用 `iwctl` 连接。先查询无线网卡名称，再建立连接；请将 `wlan0` 和 `SSID` 替换为实际值：',
  'live.network.verify': '连接后再次执行 `ping` 以确认网络可用。后续步骤需要保持网络连接。',
  'live.network.ssh':
    '如果有第二台设备，安装介质自带的 `sshd` 已经在运行，可以从那台设备上 SSH 进来，在支持复制粘贴的终端里执行后续命令。使用 `passwd` 设置 root 密码，再用 `ip a` 查看当前分配到的 IP 地址：',
  'live.network.address': '记下地址后，在第二台设备上执行 `ssh root@<地址>`。',
  'live.clock.intro': '安装介质会自动同步时间。检查同步状态：',
  'live.clock.check':
    '`System clock synchronized` 应为 `yes`。系统时间不准确可能导致后续 pacman 签名校验失败。',
  'live.mirrors.intro': ({ cfg }: Context) =>
    `使用 reflector 筛选 ${cfg.reflector.countries.join(',')} 中最近 ${cfg.reflector.ageHours} 小时内同步的 HTTPS 镜像，再按下载速度排序并保留 ${cfg.reflector.number} 个：`,
  'live.mirrors.inspect': '检查生成的列表：',
  'live.mirrors.https':
    '列表中的每个 `Server` 地址都应以 `https://` 开头。安装介质中生成的 mirrorlist 会由后续的 `pacstrap` 复制到新系统。',

  'disk.identify.intro': '列出所有块设备：',
  'disk.identify.warning': ({ cfg }: Context) =>
    `本指南以 \`${cfg.disk}\` 为目标磁盘。**下一步会清除该磁盘上的全部数据**。请根据容量和型号确认实际目标磁盘就是 \`${cfg.disk}\`；如果设备名不同，请不要继续执行。`,
  'disk.partition.table': ({ cfg, espDevice, rootDevice }: Context) =>
    '创建 GPT 分区表和两个分区：\n\n' +
    '| 分区 | 大小 | 类型 | 用途 |\n' +
    '| --- | --- | --- | --- |\n' +
    `| \`${espDevice}\` | ${cfg.espSize} | EFI System | ESP，存内核与引导器 |\n` +
    `| \`${rootDevice}\` | 剩余全部 | Linux filesystem | btrfs 根 |`,
  'disk.partition.flags':
    '参数从左到右执行：`-o` 清空分区表，`-n 编号:起点:终点` 创建分区（`0` 表示采用默认值，终点为 `0` 表示使用全部剩余空间），`-t` 设置类型；`ef00` 是 EFI System，`8300` 是 Linux filesystem。核对结果：',
  'disk.luks.intro': ({ luksName }: Context) =>
    `为根分区设置 LUKS 密码，并打开为 \`/dev/mapper/${luksName}\`：`,
  'disk.luks.slot':
    '此密码占用一个独立密钥槽。即使后续配置 TPM2，也必须保留它，TPM 状态变化时用作后备解锁方式。',
  'disk.format.intro': ({ cfg }: Context) =>
    `将 ESP 格式化为 UEFI 固件普遍支持的 FAT32 文件系统，并在${cfg.encryption.mode === 'luks2' ? '已打开的 LUKS 映射' : '根分区'}上创建 btrfs：`,
  'disk.subvolumes.create': '先挂载 btrfs 顶层，创建子卷，然后卸载：',
  'disk.subvolumes.table': ({ subvolumes }: Context) =>
    '子卷平铺在顶层，各自的用途：\n\n' +
    '| 子卷 | 挂载点 |\n' +
    '| --- | --- |\n' +
    subvolumes.map((s) => `| \`${s.name}\` | \`${s.mountPoint}\` |`).join('\n'),
  'disk.subvolumes.snapshots': ({ cfg }: Context) =>
    cfg.subvolumeLayout === 'separated'
      ? '`@log`、`@pkg` 和 `@boot` 均不包含在 `@` 的快照中。此布局可以不配置快照，也可以配置 snapper。'
      : '',
  'disk.mount.intro': '按照挂载点的层级依次挂载，最后挂载 ESP：',
  'disk.mount.options': ({ mountOptions }: Context) =>
    `这些挂载选项会由 \`genfstab\` 写入 fstab。btrfs 子卷使用 \`${mountOptions}\`；ESP 使用 \`noatime\` 避免读取文件时更新访问时间，并使用 \`umask=0077\` 限制为仅 root 可访问。`,
  'disk.mount.esp': ({ cfg, espMountPoint }: Context) =>
    `ESP 挂载在 \`${espMountPoint}\`：用于引导的 UKI 最终会生成到此处，固件和 systemd-boot 需要从 FAT 文件系统读取它。${cfg.subvolumeLayout === 'separated' ? '`/boot` 是根 btrfs 文件系统上的 `@boot` 子卷，仅存放 pacman 安装的 vmlinuz 和 mkinitcpio 的中间产物。' : '`/boot` 是根子卷内的普通目录。'}`,
  'disk.mount.check': '核对：',
  'disk.mount.count': ({ subvolumes }: Context) =>
    `应当能看到 ${subvolumes.length} 个 btrfs 子卷加一个 ESP。`,

  'live.boot-mode.title': '确认以 UEFI 模式启动',
  'live.keymap.title': '键盘布局',
  'live.network.title': '连接网络',
  'live.clock.title': '校时',
  'live.mirrors.title': '选择镜像源',
  'disk.identify-disk.title': '确认目标磁盘',
  'disk.partition.title': '分区',
  'disk.luks-format.title': '创建 LUKS2 加密容器',
  'disk.format.title': '格式化',
  'disk.subvolumes.title': '创建子卷',
  'disk.mount.title': '挂载',
  'install.pacstrap.title': '安装基本系统',
  'install.fstab.title': '生成 fstab',
  'system.chroot.title': '进入新系统',
  'system.timezone.title': '时区',
  'system.locale.title': '本地化',
  'system.hostname.title': '主机名',
  'system.root-password.title': 'root 密码',
  'system.user.title': '创建用户',
  'system.aur-helper.title': '安装 AUR 助手',
  'system.network-service.title': '启用网络',
  'storage.zram.title': '配置 zram',
  'storage.swapfile.title': '创建 swapfile',
  'storage.initramfs-encryption.title': '启用 systemd initramfs 解锁',
  'storage.snapper-config.title': '配置 Snapper',
  'storage.pcr-signing-policy.title': '创建 PCR 11 签名策略',
  'boot.bootloader-install.title': '安装 systemd-boot',
  'boot.kernel-cmdline.title': '内核命令行',
  'boot.uki.title': '构建 UKI',
  'boot.secure-boot-custom-db.title': '注册自定义 Secure Boot 密钥',
  'boot.secure-boot-shim.title': '建立 shim 与 MOK 信任链',
  'desktop.graphics-driver.title': '安装显卡驱动',
  'desktop.audio.title': '安装音频服务',
  'desktop.desktop-common.title': '安装蓝牙、字体与输入法',
  'desktop.cjk-font-priority.title': '设置字体优先级',
  'desktop.gnome-kimpanel.title': '启用 Kimpanel 扩展',
  'desktop.kde-fcitx.title': '启用 KDE 输入法',
  'desktop.desktop-environment.title': '安装桌面环境',
  'hyprland.hyprland-extras.title': '安装配套软件',
  'hyprland.hyprland-elephant.title': '启用 Elephant 服务',
  'hyprland.hyprland-programs.title': '设置默认程序',
  'hyprland.hyprland-lock.title': '配置锁屏与空闲',
  'hyprland.hyprland-wallpaper.title': '配置壁纸',
  'hyprland.hyprland-screenshot.title': '配置截图快捷键',
  'hyprland.hyprland-keyring.title': '配置密钥环自动解锁',
  'finish.reboot.title': '重启',
  'finish.post-install.title': '进系统之后',
  'finish.secure-boot-shim-verify.title': '验证 shim 安全启动',
  'finish.tpm2-enroll.title': '注册 TPM2 解锁',
  'section.live': '安装环境',
  'section.disk': '磁盘',
  'section.install': '安装系统',
  'section.system': '系统配置',
  'section.storage': '存储配置',
  'section.boot': '引导',
  'section.desktop': '桌面与显卡',
  'section.hyprland': 'Hyprland 配套',
  'section.finish': '收尾',

  'install.pacstrap.purposes': (ctx: Context, t: (key: string) => string) =>
    '`-K` 会在目标系统中创建并初始化新的 pacman 密钥环，而不复制安装介质中的密钥环。\n\n包的用途：\n\n| 包 | 用途 |\n| --- | --- |\n' +
    packagePurposeRows(ctx, t) +
    '\n\n这一步会下载几百 MB，耗时取决于镜像源速度。',
  'package.base': '基本系统',
  'package.linux': '内核与固件',
  'package.btrfs-progs': 'btrfs 工具，根文件系统需要',
  'package.microcode': 'CPU 微码，引导时加载',
  'package.cryptsetup': '创建和打开 LUKS2 加密卷',
  'package.networkmanager': '管理网络连接',
  'package.sudo': '以 Root 权限执行命令',
  'package.vim': '编辑配置文件',
  'package.zram-generator': '配置 zram',
  'package.snapper': '管理 btrfs 快照',
  'package.sbctl': '管理自定义 Secure Boot 密钥并签名 EFI 文件',
  'package.systemd-ukify': '生成 UKI，并按配置创建 Secure Boot 或 PCR 11 签名',
  'package.base-devel': '编译与打包软件的基础工具链',
  'package.git': '版本控制，克隆代码仓库',
  'package.secure-boot-tools': '创建 UEFI 启动项、导入 MOK 并签名 EFI 文件',
  'install.fstab.uuid':
    '`-U` 使用 UUID 而非设备名，确保更换插槽或增加磁盘后仍能挂载正确的文件系统。\n\n检查生成的文件，确认每个子卷均包含正确的 `subvol=` 参数和挂载选项：',
  'install.fstab.check': 'fstab 配置错误可能导致系统无法启动，因此请在继续前仔细核对。',

  'system.chroot.scope':
    '从此步骤到「离开 chroot」为止，所有命令均在新系统中执行。命令提示符将变为 `[root@archiso /]#`。',
  'system.timezone.hwclock':
    '`hwclock --systohc` 按当前系统时间写硬件时钟，并生成 `/etc/adjtime`。',
  'system.timezone.list': '可以使用 `timedatectl list-timezones` 查询其他时区名称。',
  'system.locale.uncomment': ({ cfg }: Context) =>
    `编辑 \`/etc/locale.gen\`，取消 \`en_US.UTF-8\`${
      cfg.systemLocale === 'en_US.UTF-8' ? '' : ` 和 \`${cfg.systemLocale}\``
    } 对应 UTF-8 locale 行的注释：`,
  'system.locale.generate': '生成 locale：',
  'system.locale.lang': '设定系统语言：',
  'system.locale.console': ({ cfg, consoleFont }: Context) =>
    cfg.keymap === 'us'
      ? '设定虚拟控制台字体：'
      : consoleFont
        ? '设定虚拟控制台键盘布局和字体：'
        : '设定虚拟控制台键盘布局：',
  'system.locale.vconsole': ({ consoleFont }: Context) =>
    `${
      consoleFont
        ? '内核内置的控制台字体缺少该语言的部分字母，`FONT=` 选用 kbd 自带的一款覆盖拉丁、希腊和基本西里尔字母的字体。'
        : ''
    }\`/etc/vconsole.conf\` 仅影响 TTY；桌面环境使用其自身的键盘布局配置。`,
  'system.user.create': ({ cfg }: Context) =>
    `创建用户 \`${cfg.username}\` 并将其加入 \`wheel\` 组：`,
  'system.user.sudo':
    '授予 `wheel` 组 sudo 权限。执行以下命令打开编辑器，并删除 `%wheel ALL=(ALL:ALL) ALL` 所在行行首的 `#`：',
  'system.user.visudo':
    '必须使用 `visudo`，不要直接编辑 `/etc/sudoers`。`visudo` 会在保存前检查语法，避免配置错误导致 sudo 无法使用。',
  'system.aur-helper.why':
    '`pacman` 不管理 AUR，手动构建的包不会随 `pacman -Syu` 更新，交由 `paru` 管理才能收到后续更新。',
  'system.aur-helper.build': '`paru` 自身也来自 AUR，只能手动构建。AUR 构建必须使用普通用户：',
  'system.aur-helper.update': '此后用 `paru -Syu` 同时更新官方仓库和 AUR 软件包。',
  'system.network-service.why':
    '如果不启用该服务，重启后新系统将无法自动连接网络。安装介质中的网络配置不会保留到新系统中。',

  'finish.reboot.unmount': '离开 chroot，卸载全部挂载点，重启：',
  'finish.reboot.recursive':
    '`umount -R` 会递归卸载全部挂载点，避免 btrfs 中仍有尚未写入磁盘的数据。',
  'finish.reboot.media': ({ cfg }: Context) =>
    `重启前请移除安装介质。systemd-boot 菜单默认隐藏，系统会直接启动常规 UKI；如需选择 fallback，请在开机时按住 Space 调出菜单。进入系统后，使用 \`${cfg.username}\` 登录。`,
  'finish.post-install.terminal': '登录后按 `SUPER + Q` 打开终端。',
  'finish.post-install.network': '确认网络：',
  'finish.post-install.offline': ({ cfg }: Context) =>
    `如果网络不通，请${
      cfg.desktop === 'gnome' || cfg.desktop === 'kde'
        ? '在桌面环境自带的设置应用中配置网络'
        : '使用 \`nmtui\` 进行配置'
    }。`,
  'finish.post-install.done': ({ cfg }: Context) =>
    `至此，最小系统应当能够启动和联网，并可使用普通用户登录。${cfg.snapper === 'none' ? '当前未配置快照。' : ''}`,
  'finish.secure-boot-shim-verify.expect':
    '三条命令应分别确认 Secure Boot 已启用、MOK 已注册，并显示 `/EFI/systemd/grubx64.efi`。',
  'finish.tpm2-enroll.intro': ({ cfg }: Context) =>
    `在安装后的系统中注册 TPM2 解锁${cfg.secureBoot === 'none' ? '。当前未启用 Secure Boot，PCR 7 只记录“安全启动关闭”，不能验证启动文件签名' : ''}：`,
  'finish.tpm2-enroll.slots': ({ cfg }: Context) =>
    `注册时输入保留的 LUKS 密码${cfg.encryption.mode === 'luks2' && cfg.encryption.unlock.method === 'tpm2' && cfg.encryption.unlock.pin ? '，再设置 TPM PIN' : ''}。列表中必须同时保留 \`password\` 槽和新增的 \`tpm2\` token。`,
  'finish.tpm2-enroll.done': '至此，TPM2 解锁配置完成。',

  'storage.zram.create': '新建 zram-generator 配置：',
  'storage.zram.write': '写入：',
  'storage.zram.result': '重启后 systemd 会创建容量为物理内存一半的压缩交换设备 `/dev/zram0`。',
  'storage.swapfile.create': ({ cfg }: Context) =>
    `在独立的 \`@swap\` 子卷中创建 ${cfg.diskSwapSizeGiB} GiB swapfile：`,
  'storage.swapfile.notes':
    '`@swap` 不会包含在根子卷快照中。`--uuid clear` 避免 swapfile 被误识别为可挂载文件系统。',
  'storage.initramfs-encryption.edit': '编辑 mkinitcpio 配置：',
  'storage.initramfs-encryption.hooks': '在 `HOOKS` 行的 `block` 后添加 `sd-encrypt`：',
  'storage.initramfs-encryption.warning':
    '不要改动该行的其他内容或顺序。`systemd` 与 `sd-encrypt` 负责在挂载根文件系统前打开 LUKS2。',
  'storage.snapper-config.intro':
    '让 Snapper 创建配置，再将它自动创建的嵌套快照子卷替换为安装时准备的顶层子卷：',
  'storage.snapper-config.dbus':
    '安装时的 chroot 没有运行 system D-Bus，因此使用 `--no-dbus` 让 Snapper 直接完成配置。',
  'storage.snapper-config.verify': '核对配置和独立挂载点：',
  'storage.pcr-signing-policy.key': '创建由 ukify 在每次构建 UKI 时使用的 PCR 签名密钥：',
  'storage.pcr-signing-policy.conf':
    '新建 mkinitcpio 传给 ukify 的配置文件 `/etc/kernel/uki.conf`：',
  'storage.pcr-signing-policy.write': '写入：',
  'storage.pcr-signing-policy.phases':
    '`Phases=enter-initrd` 将这套签名策略限制在 initrd 阶段，使根分区解锁密钥在切换到主系统后不能再次由 TPM 解封。',
  'storage.pcr-signing-policy.rebuild':
    '生成 UKI 时，mkinitcpio 检测到已安装的 ukify 后会自动调用它，并读取 `/etc/kernel/uki.conf`。ukify 会在每次内核更新重建 UKI 时重新计算 PCR 11、签名策略，并将公钥和签名嵌入镜像。',

  'hyprland.hyprland-extras.intro': '安装所选的 Hyprland 配套软件：',
  'hyprland.hyprland-extras.global':
    '`--global` 为所有用户启用这些用户服务，它们随 `hyprland-session.target` 启动。',
  'hyprland.hyprland-extras.aur': '以下软件包以普通用户构建：',
  'hyprland.hyprland-elephant.why':
    'Walker 自身不检索数据，启动前 Elephant 必须已在用户会话中运行。它需要用户会话的环境变量，因此作为用户服务启用，而不是系统服务。',
  'hyprland.hyprland-elephant.create': '新建 `/etc/systemd/user/elephant.service`：',
  'hyprland.hyprland-elephant.write': '写入：',
  'hyprland.hyprland-elephant.enable': '启用：',
  'hyprland.hyprland-elephant.providers':
    'Walker 的每个数据源都是独立的 `elephant-*` 软件包，上一步只装了应用列表。计算、文件、剪贴板、窗口等其余数据源按需另装，各自的运行时依赖由对应软件包声明。',
  'hyprland.hyprland-programs.edit': ({ cfg }: Context) =>
    `编辑 \`/home/${cfg.username}/.config/hypr/hyprland.lua\`：`,
  'hyprland.hyprland-programs.section': '把 `MY PROGRAMS` 一节改为：',
  'hyprland.hyprland-programs.binds': '这三行分别对应 `SUPER + Q`、`SUPER + E` 和 `SUPER + R`。',
  'hyprland.hyprland-lock.copy': '复制 Hyprlock 与 Hypridle 的示例配置：',
  'hyprland.hyprland-lock.bind': ({ cfg }: Context) =>
    `在 \`/home/${cfg.username}/.config/hypr/hyprland.lua\` 的 \`KEYBINDINGS\` 一节加入手动锁屏：`,
  'hyprland.hyprland-lock.brightnessctl':
    '示例 `hypridle.conf` 中调节背光的两条 listener 依赖 `brightnessctl`，未安装时它们不生效，锁屏、息屏与挂起不受影响。',
  'hyprland.hyprland-wallpaper.create': ({ cfg }: Context) =>
    `Hyprpaper 没有默认壁纸，需要指定要加载的图片。新建 \`/home/${cfg.username}/.config/hypr/hyprpaper.conf\`：`,
  'hyprland.hyprland-wallpaper.write': '写入（`monitor` 留空表示应用到全部显示器）：',
  'hyprland.hyprland-wallpaper.chown': '修正所有者：',
  'hyprland.hyprland-screenshot.binds': ({ cfg }: Context) =>
    `在 \`/home/${cfg.username}/.config/hypr/hyprland.lua\` 的 \`KEYBINDINGS\` 一节加入：`,
  'hyprland.hyprland-screenshot.location':
    '截图保存到 `XDG_PICTURES_DIR` 指向的目录，未设置时保存到 `~`，同时写入剪贴板。',
  'hyprland.hyprland-keyring.edit': '编辑 `/etc/pam.d/greetd`：',
  'hyprland.hyprland-keyring.append': '在文件末尾加入：',
  'hyprland.hyprland-keyring.unlock':
    '登录密码将同时解锁默认密钥环。缺少这两行时密钥环仍可使用，但每次访问都要单独输入密码。',
  'hyprland.hyprland-keyring.seahorse': 'Seahorse 提供查看和管理已存密码的图形界面。',

  'boot.bootloader-install.esp': ({ cfg, espMountPoint }: Context) =>
    `\`bootctl\` 会依次检查 \`/efi\`、\`/boot\`、\`/boot/efi\` 以定位 ESP，此处会找到 \`${espMountPoint}\`。它会将引导器安装到 ESP${cfg.secureBoot === 'shim-mok' ? '，但不创建直接指向 systemd-boot 的固件启动项；后面只注册 shim 启动项' : '、把对应条目置于固件启动项列表首位'}，并创建 ESP 目录结构；其中 \`EFI/Linux/\` 是后续 UKI 的输出位置。`,
  'boot.kernel-cmdline.intro': '内核参数写进 `/etc/kernel/cmdline`，构建 UKI 时会内嵌进镜像：',
  'boot.kernel-cmdline.notes': ({ cfg, rootSubvolume }: Context) =>
    `- \`$(blkid ...)\` 会在执行命令时展开为${cfg.encryption.mode === 'luks2' ? ' LUKS2 容器' : ' btrfs'} UUID，无需手动录入。\n` +
    `- \`rootflags=subvol=${rootSubvolume.name}\` 不可省略。btrfs 默认挂载顶层；缺少该参数时，内核无法定位根子卷。\n` +
    '- 参数内嵌在镜像中；后续修改后必须重新执行 `mkinitcpio -P` 才能生效。',
  'boot.kernel-cmdline.verify': '核对展开结果：',
  'boot.uki.preset': '编辑内核预设，将输出形式从分离镜像改为 UKI：',
  'boot.uki.edits':
    '按如下方式修改预设：\n\n' +
    "- 注释 `PRESETS=('default')`，并取消注释 `PRESETS=('default' 'fallback')`，以同时生成常规镜像和 fallback 镜像。\n" +
    '- 取消注释 `default_uki` 和 `fallback_uki`。\n' +
    '- 注释 `default_image`。',
  'boot.uki.paths': ({ cfg, espMountPoint }: Context) =>
    `\`default_uki\` 和 \`fallback_uki\` 中的路径应为 \`${espMountPoint}/EFI/Linux/\`，无需修改。${cfg.encryption.mode === 'none' ? '' : '\n\n前面配置的 systemd initramfs 会把 LUKS2 解锁逻辑一并放入 UKI。'}`,
  'boot.uki.rebuild': '重新构建：',
  'boot.uki.menu': ({ espMountPoint }: Context) =>
    `systemd-boot 会自动枚举 \`${espMountPoint}/EFI/Linux/\` 中的镜像并生成启动菜单，常规启动项排列在 fallback 之前。fallback 镜像不进行 autodetect 裁剪，可在常规镜像因缺少驱动而无法启动时用于恢复系统。`,
  'boot.uki.check': '核对：',
  'boot.uki.entries': '应当看到两个 `type #2` 条目，指向 `EFI/Linux/` 下的两个镜像。',
  'boot.secure-boot-custom-db.setup-mode': '确认固件已进入 Setup Mode，再创建并注册密钥：',
  'boot.secure-boot-custom-db.resign':
    '`sbctl status` 必须显示 Setup Mode；否则进入固件设置启用 Setup Mode，具体入口和选项名称因主板固件而异。sbctl 会记录已签名文件，并在后续内核更新重建 UKI 后重新签名——但这只覆盖 UKI，ESP 里 `EFI/systemd/systemd-bootx64.efi` 和 `EFI/BOOT/BOOTX64.EFI` 这两份 systemd-boot 二进制不会被自动刷新，需要单独处理。',
  'boot.secure-boot-custom-db.script': '创建 `/usr/local/sbin/update-sbctl-systemd-boot`：',
  'boot.secure-boot-custom-db.run': '执行脚本：',
  'boot.secure-boot-custom-db.hook': '创建 `/etc/pacman.d/hooks/95-sbctl-systemd-boot.hook`：',
  'boot.secure-boot-shim.install': '安装 Fedora 预签名的 `shim-signed`。AUR 操作必须使用普通用户：',
  'boot.secure-boot-shim.version':
    '`shim-signed` 必须为 16.1 或更高版本，systemd-boot 才能通过 shim 的 loader protocol 加载 MOK 签名的 UKI。',
  'boot.secure-boot-shim.mok': '创建 MOK：',
  'boot.secure-boot-shim.uki-conf': '编辑 `/etc/kernel/uki.conf`：',
  'boot.secure-boot-shim.uki-append': '加入：',
  'boot.secure-boot-shim.keep-pcr': '如果文件中已经存在 PCR 签名配置，请保留原有内容。',
  'boot.secure-boot-shim.script': '创建 `/usr/local/sbin/update-shim-systemd-boot`：',
  'boot.secure-boot-shim.run': '执行脚本：',
  'boot.secure-boot-shim.hook': '创建 `/etc/pacman.d/hooks/95-shim-systemd-boot.hook`：',
  'boot.secure-boot-shim.verify': '重新构建 UKI，并核对 systemd-boot 与两个 UKI 均由 MOK 签名：',
  'boot.secure-boot-shim.enroll': '创建 shim 启动项并提交 MOK 注册请求：',
  'boot.secure-boot-shim.mokmanager':
    '为 `mokutil --import` 设置一次性密码。重启时先进入固件启用 Secure Boot，再从 `Arch Linux (shim)` 启动；在 MokManager 中选择 `Enroll MOK`，输入一次性密码并确认。',

  'desktop.graphics-driver.intro': ({ cfg }: Context) =>
    `安装 ${cfg.graphics.toUpperCase()} 显卡所需的软件包：`,
  'desktop.graphics-driver.nvidia':
    '`nvidia-open` 适用于 Turing 及更新架构。Pascal 或更早的显卡不要执行此命令，应先根据具体型号确认对应的旧版驱动。',
  'desktop.audio.intro': '安装 PipeWire 音频服务、WirePlumber 会话管理器和音量控制界面：',
  'desktop.desktop-common.intro': ({ cfg, inputMethodEngine }: Context) =>
    `安装 Noto 字体家族（含 CJK、emoji）。${
      cfg.desktop === 'hyprland'
        ? '安装 BlueZ 蓝牙后端与工具、Blueman 管理界面、Fcitx 5、GTK/Qt 前端和配置工具'
        : '安装 Fcitx 5、GTK/Qt 前端和配置工具'
    }${
      inputMethodEngine === 'fcitx5-chinese-addons'
        ? '；当前中文 locale 同时安装拼音输入引擎'
        : inputMethodEngine === 'fcitx5-mozc'
          ? '；当前日文 locale 同时安装 Mozc 输入引擎'
          : inputMethodEngine === 'fcitx5-hangul'
            ? '；当前韩文 locale 同时安装 Hangul 输入引擎'
            : ''
    }：`,
  'desktop.desktop-common.gnome-ibus':
    'GNOME 会把会话的输入法配置成 ibus，Fcitx 5 由自启动项拉起后取代 ibus，无需设置环境变量。',
  'desktop.desktop-common.kimpanel': '安装 Kimpanel 扩展。AUR 操作必须使用普通用户：',
  'desktop.desktop-common.kde-env': '为 XWayland 应用设置输入法环境变量：',
  'desktop.desktop-common.write': '写入：',
  'desktop.desktop-common.gtk':
    'GTK 应用改用配置文件指定输入法模块，只作用于 X11/XWayland 下的 GTK 程序：',
  'desktop.desktop-common.gtk2': ({ cfg }: Context) =>
    `如果要运行 GTK2 程序，另建 \`/home/${cfg.username}/.gtkrc-2.0\`：`,
  'desktop.desktop-common.chown': '修正这两个文件的所有者：',
  'desktop.desktop-common.kde-autostart': 'KDE 下 Fcitx 5 由 KWin 启动，屏蔽 XDG 自启动项：',
  'desktop.cjk-font-priority.create': '新建 `/etc/fonts/conf.d/64-noto-cjk.conf`：',
  'desktop.cjk-font-priority.write': '写入：',
  'desktop.gnome-kimpanel.enable':
    '首次登录 GNOME 后，在扩展管理中启用 Kimpanel，输入法候选窗口才会显示。',
  'desktop.kde-fcitx.enable': '首次登录 KDE Plasma 后，打开“系统设置 → 虚拟键盘”，选择 Fcitx 5。',
  'desktop.desktop-environment.intro': ({ desktopName }: Context) => `安装 ${desktopName}：`,
  'desktop.desktop-environment.greetd':
    '配置 greetd 使用 ReGreet 图形登录界面。新建 `/etc/greetd/hyprland.lua`：',
  'desktop.desktop-environment.write': '写入：',
  'desktop.desktop-environment.greetd-config': '编辑 `/etc/greetd/config.toml`：',
  'desktop.desktop-environment.greetd-command': '将 `[default_session]` 中的 `command` 改为：',
  'desktop.desktop-environment.session-target':
    '新建 `/etc/systemd/user/hyprland-session.target`：',
  'desktop.desktop-environment.session-write': '写入：',
  'desktop.desktop-environment.copy-config': '复制默认配置作为该用户的 Hyprland 配置：',
  'desktop.desktop-environment.env': '在 `ENVIRONMENT VARIABLES` 一节加入：',
  'desktop.desktop-environment.autostart': '在 `AUTOSTART` 一节加入：',
  'desktop.desktop-environment.display-manager': ({ displayManager }: Context) =>
    `重启后由 \`${displayManager}\` 提供图形登录界面。`,
}

/** Simplified Chinese interface labels; wording that never changes lives in `neutral.ts`. */
export const ui: UiCatalog = {
  title: 'Arch Linux 安装指南',
  welcomeTitle: '生成适合你的 Arch Linux 安装指南',
  welcomeBody: '通过分步向导完成系统配置，最后生成一份可以逐项执行和打印的安装指南。',
  start: '开始配置',
  copy: '复制',
  copied: '已复制',
  print: '保存为 PDF',
  editConfig: '修改配置',
  installationTarget: '安装目标',
  diskTutorial: '确认目标磁盘',
  diskTutorialBeforeCommand: '在准备安装 Arch Linux 的电脑上启动安装介质，然后运行',
  diskTutorialAfterCommand:
    '。根据 SIZE 和 TYPE 找到目标整盘。在固定的 /dev/ 前缀后填写设备名，例如 nvme0n1 或 sda，不要填写 nvme0n1p1、sda1 这样的分区名。',
  diskEraseWarning: '执行指南中的分区命令将清除目标磁盘上的所有数据，请确认设备名无误。',
  storage: '存储',
  regionLanguage: '区域与语言',
  baseSystem: '基础系统',
  review: '确认配置',
  backToWelcome: '返回主页',
  previous: '上一步',
  next: '下一步',
  selectPlaceholder: '请选择',
  unavailable: (reason: string) => `当前不可用：${reason}`,
  generateGuide: '生成安装指南',
  wizardProgress: (current: number, total: number) => `第 ${current} 步，共 ${total} 步`,
  verifiedAgainst: '对照 Arch 状态验证于',
  configSummary: '本指南配置',
  enabled: '开启',
  disabled: '关闭',
  none: '无',
  /** Joins the selected add-ons of one group in the configuration summary. */
  listSeparator: '、',
  targetDisk: '目标磁盘',
  diskSwap: '磁盘 swap',
  diskSwapSize: '容量（GiB）',
  subvolumes: '子卷布局',
  encryption: '磁盘加密',
  unlock: '解锁方式',
  password: '密码',
  tpmPolicy: 'TPM2 绑定策略',
  requireTpmPin: '启动时要求输入 TPM PIN',
  pcr7Warning: '仅绑定 PCR 7 不区分具体 UKI；关闭安全启动时只记录“安全启动关闭”。',
  tpmPolicyRequiresSecureBoot: (mode: string) => `当前 TPM2 绑定策略要求${mode}`,
  snapperRequiresSeparated: '需要标准分离子卷布局',
  hashPcrs: 'PCR 哈希绑定',
  signedPcrs: 'PCR 签名策略',
  secureBoot: '安全启动',
  snapperUnsupportedRootOnly: '单一根子卷不推荐 Snapper',
  desktop: '桌面环境',
  hyprlandExtras: 'Hyprland 配套',
  hyprlandExtrasHint: 'Hyprland 只提供合成器和会话，以下各类均可单独选择。',
  hyprlandNotifications: '通知中心',
  hyprlandLauncher: '应用启动器',
  hyprlandFileManager: '文件管理器',
  hyprlandTerminal: '终端',
  hyprlandBar: '状态栏',
  hyprlandLock: '锁屏与空闲管理',
  hyprlandWallpaper: '壁纸与色温',
  hyprlandScreenshot: '截图工具',
  hyprlandKeyring: '密钥环',
  graphics: '显卡',
  reflector: '镜像源',
  mirrorCountry: '国家代码',
  mirrorCountryHint: '可填写多个 ISO 国家代码，用英文逗号分隔。',
  mirrorCountryInvalid: '请输入有效的 ISO 国家代码，并用英文逗号分隔',
  mirrorAge: '最近同步（小时）',
  mirrorNumber: '保留数量',
  timezone: '时区',
  timezoneHint: '选择安装后系统使用的时区。',
  detectedTimezone: (timezone: string) => `检测到当前时区：${timezone}`,
  useDetectedTimezone: '使用此时区',
  systemLocale: '系统语言',
  systemLocaleHint: '选择系统服务、终端和登录界面默认使用的语言环境。',
  ttyFontWarning:
    'TTY 字体无法显示该语言的部分或全部字符，会显示为方框。仅当你明确计划安装并使用图形界面时，才推荐选择它；纯命令行系统请选择控制台能显示的语言。',
  keymap: '键盘布局',
  keymapHint: '选择安装环境和虚拟控制台使用的键盘布局。',
  hostname: '主机名',
  hostnameHint: '这台电脑在本机和网络中使用的名称，例如 archlinux 或 workstation。',
  username: '用户名',
  usernameHint: '日常登录使用的普通用户账户；不能使用 root。',
  language: '界面语言',
  theme: '主题',
  themeAuto: '跟随系统',
  themeLight: '浅色',
  themeDark: '深色',
  wizardSteps: '配置进度',
  disclaimer: '本站与 Arch Linux 官方无关。',
  stepCount: (total: number) => `共 ${total} 步`,
}

/** Simplified Chinese labels of the wizard options; product names live in `neutral.ts`. */
export const choices: ChoiceCatalog = {
  zram: {
    false: '关闭',
    true: '开启',
  },
  diskSwap: {
    none: '无',
  },
  subvolumeLayout: {
    'root-only': '单一根子卷（结构简单）',
    separated: '标准分离子卷（支持快照）',
  },
  encryption: {
    none: '关闭',
    password: 'LUKS2（密码）',
    tpm2: 'LUKS2（TPM2）',
  },
  tpm2Preset: {
    minimal: '最小（PCR 7）',
    'custom-db': '推荐（自定义 db）',
    'shim-mok': '无法自定义 db 时（shim/MOK）',
  },
  secureBoot: {
    none: '关闭',
    'custom-db': '自定义 UEFI db',
  },
  snapper: {
    none: '不配置',
  },
  desktop: {
    none: '无',
  },
  hyprlandNotifications: {
    none: '不安装',
  },
  hyprlandBar: {
    none: '不安装',
  },
  hyprlandLock: {
    none: '不安装',
  },
}

/** Simplified Chinese one-line explanations shown under each wizard option. */
export const choiceDescriptions: DescriptionCatalog = {
  cpu: {
    intel: '安装 Intel 处理器所需的 intel-ucode 微码包。',
    amd: '安装 AMD 处理器所需的 amd-ucode 微码包。',
  },
  zram: {
    false: '不使用 zram。',
    true: '使用 zram，在内存中创建压缩 swap。',
  },
  diskSwap: {
    none: '不配置磁盘 swap。',
    swapfile: '在 Btrfs 文件系统中配置 swapfile。',
  },
  subvolumeLayout: {
    'root-only': '只创建 @，结构简单，但不能配置 Snapper。',
    separated:
      '在同一个 Btrfs 文件系统中，将 /boot、/home、日志和软件包缓存置于独立子卷，控制根快照包含的内容，并允许配置 Snapper。',
  },
  encryption: {
    none: '不加密根文件系统；ESP 无论选择哪种模式都不会加密。',
    password: '使用 LUKS2 保护系统数据，每次启动时手动输入密码解锁。',
    tpm2: '使用 LUKS2，由 TPM2 验证启动状态；可另行要求输入 PIN。',
  },
  tpm2Preset: {
    minimal: '哈希绑定 PCR 7；内核更新不需重新注册，但不能区分由同一密钥签名的镜像。',
    'custom-db': '绑定 PCR 7，并用签名策略绑定 PCR 11；同时选择自定义 UEFI db。',
    'shim-mok':
      '绑定 PCR 7+14，并用签名策略绑定 PCR 11；同时选择 shim-signed + MOK，面向无法注册自定义证书的固件。',
  },
  secureBoot: {
    none: '不验证启动文件的签名。',
    'custom-db': '将自定义证书注册到固件 UEFI db；要求固件支持 Setup Mode。',
    'shim-mok':
      '面向无法向 UEFI db 注册自定义证书的固件：通过微软签名的 shim 和自行注册的 MOK 建立信任链。',
  },
  snapper: {
    none: '不创建 Snapper 配置。',
    root: '只为根系统创建和管理快照。',
    'root-home': '分别为根系统和 home 创建独立的快照配置。',
  },
  desktop: {
    none: '只安装命令行基础系统；之后仍可自行安装桌面。',
    gnome: '安装 GNOME 桌面环境。',
    kde: '安装 KDE Plasma 桌面环境。',
    hyprland: '安装 Hyprland Wayland 合成器。',
  },
  graphics: {
    intel: '安装 Mesa、Intel Vulkan 驱动和现代 Intel 核显的视频加速驱动。',
    amd: '安装 Mesa、AMD Vulkan 驱动和 Mesa 视频加速驱动。',
    nvidia: '安装 NVIDIA 开放内核模块和用户空间驱动，适用于 Turing 及更新架构。',
  },
  hyprlandNotifications: {
    none: '不安装通知守护进程，应用发出的通知不会显示。',
    swaync: '带通知中心面板，可回看历史通知。',
    mako: '仅显示通知，无面板。',
  },
  hyprlandLauncher: {
    hyprlauncher: 'Hyprland 生态自带的启动器，也是默认配置里 SUPER + R 指向的程序。',
    rofi: '同时支持窗口切换、dmenu 输入等模式。',
    wofi: '仅做应用启动，配置项少。',
    walker: 'GTK4 启动器，检索数据由 Elephant 服务提供。',
  },
  hyprlandFileManager: {
    nautilus: 'GNOME 的文件管理器，随选安装 SMB 支持与空格预览。',
    dolphin: 'KDE 的文件管理器，随选安装缩略图插件；SMB 支持来自其依赖 kio-extras。',
    thunar: 'Xfce 的文件管理器，随选安装 GVfs、SMB 支持、缩略图、可移动介质和压缩包插件。',
  },
  hyprlandTerminal: {
    ghostty: 'GPU 渲染的现代终端。',
    kitty: 'GPU 渲染的现代终端。',
  },
  hyprlandBar: {
    none: '不安装状态栏。',
    waybar: '显示工作区、托盘和系统状态，使用发行版自带的默认配置。',
  },
  hyprlandLock: {
    none: '不安装锁屏，空闲时不会自动息屏或挂起。',
    hyprlock: 'Hyprlock 负责锁屏界面，Hypridle 按空闲时间触发锁屏、息屏和挂起。',
  },
  hyprlandAddons: {
    hyprpaper: '设置壁纸，需要指定图片。',
    hyprsunset: '色温滤镜，用 hyprsunset -t 4000 调整。',
    hyprshot: '按区域、窗口或显示器截图，同时写入剪贴板。',
    'gnome-keyring': '存储应用密码，可由登录密码自动解锁。',
    seahorse: '密钥环的图形管理界面。',
  },
}
