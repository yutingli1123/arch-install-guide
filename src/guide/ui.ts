import type { HyprlandAddon, Locale, Localized } from './types'

export function pick<T>(value: Localized<T>, locale: Locale): T {
  return value[locale] ?? value.zh
}

export const ui = {
  title: { zh: 'Arch Linux 安装指南', en: 'Arch Linux Installation Guide' },
  welcomeTitle: {
    zh: '生成适合你的 Arch Linux 安装指南',
    en: 'Generate an Arch Linux installation guide that fits your machine',
  },
  welcomeBody: {
    zh: '通过分步向导完成系统配置，最后生成一份可以逐项执行和打印的安装指南。',
    en: 'Work through the wizard to configure the system, and end with an installation guide you can follow command by command or print.',
  },
  start: { zh: '开始配置', en: 'Start configuring' },
  copy: { zh: '复制', en: 'Copy' },
  copied: { zh: '已复制', en: 'Copied' },
  print: { zh: '保存为 PDF', en: 'Save as PDF' },
  editConfig: { zh: '修改配置', en: 'Edit configuration' },
  installationTarget: { zh: '安装目标', en: 'Installation target' },
  diskTutorial: { zh: '确认目标磁盘', en: 'Confirm the target disk' },
  diskTutorialBeforeCommand: {
    zh: '在准备安装 Arch Linux 的电脑上启动安装介质，然后运行',
    en: 'Boot the installation media on the computer you are installing Arch Linux on, then run',
  },
  diskTutorialAfterCommand: {
    zh: '。根据 SIZE 和 TYPE 找到目标整盘。在固定的 /dev/ 前缀后填写设备名，例如 nvme0n1 或 sda，不要填写 nvme0n1p1、sda1 这样的分区名。',
    en: '. Use SIZE and TYPE to find the whole target disk. Enter the device name after the fixed /dev/ prefix, such as nvme0n1 or sda, not a partition name like nvme0n1p1 or sda1.',
  },
  diskEraseWarning: {
    zh: '执行指南中的分区命令将清除目标磁盘上的所有数据，请确认设备名无误。',
    en: 'The partitioning commands in the guide erase all data on the target disk. Make sure the device name is correct.',
  },
  storage: { zh: '存储', en: 'Storage' },
  regionLanguage: { zh: '区域与语言', en: 'Region and language' },
  baseSystem: { zh: '基础系统', en: 'Base system' },
  review: { zh: '确认配置', en: 'Review' },
  backToWelcome: { zh: '返回主页', en: 'Back to start' },
  previous: { zh: '上一步', en: 'Previous' },
  next: { zh: '下一步', en: 'Next' },
  selectPlaceholder: { zh: '请选择', en: 'Select' },
  unavailable: {
    zh: (reason: string) => `当前不可用：${reason}`,
    en: (reason: string) => `Unavailable: ${reason}`,
  },
  generateGuide: { zh: '生成安装指南', en: 'Generate the guide' },
  wizardProgress: {
    zh: (current: number, total: number) => `第 ${current} 步，共 ${total} 步`,
    en: (current: number, total: number) => `Step ${current} of ${total}`,
  },
  verifiedAgainst: { zh: '对照 Arch 状态验证于', en: 'Verified against Arch as of' },
  configSummary: { zh: '本指南配置', en: 'Configuration for this guide' },
  enabled: { zh: '开启', en: 'Enabled' },
  disabled: { zh: '关闭', en: 'Disabled' },
  none: { zh: '无', en: 'None' },
  /** Joins the selected add-ons of one group in the configuration summary. */
  listSeparator: { zh: '、', en: ', ' },
  targetDisk: { zh: '目标磁盘', en: 'Target disk' },
  cpu: { zh: 'CPU' },
  zram: { zh: 'zram' },
  diskSwap: { zh: '磁盘 swap', en: 'Disk swap' },
  diskSwapSize: { zh: '容量（GiB）', en: 'Size (GiB)' },
  subvolumes: { zh: '子卷布局', en: 'Subvolume layout' },
  encryption: { zh: '磁盘加密', en: 'Disk encryption' },
  unlock: { zh: '解锁方式', en: 'Unlock method' },
  password: { zh: '密码', en: 'Password' },
  tpmPin: { zh: 'TPM PIN' },
  tpmPolicy: { zh: 'TPM2 绑定策略', en: 'TPM2 binding policy' },
  requireTpmPin: { zh: '启动时要求输入 TPM PIN', en: 'Require a TPM PIN at boot' },
  pcr7Warning: {
    zh: '仅绑定 PCR 7 不区分具体 UKI；关闭安全启动时只记录“安全启动关闭”。',
    en: 'Binding PCR 7 alone does not distinguish one UKI from another, and with Secure Boot off it records only that Secure Boot is disabled.',
  },
  tpmPolicyRequiresSecureBoot: {
    zh: (mode: string) => `当前 TPM2 绑定策略要求${mode}`,
    en: (mode: string) => `The current TPM2 binding policy requires ${mode}`,
  },
  snapperRequiresSeparated: {
    zh: '需要标准分离子卷布局',
    en: 'Requires the separate subvolume layout',
  },
  hashPcrs: { zh: 'PCR 哈希绑定', en: 'PCR hash binding' },
  signedPcrs: { zh: 'PCR 签名策略', en: 'PCR signing policy' },
  secureBoot: { zh: '安全启动', en: 'Secure Boot' },
  snapper: { zh: 'snapper' },
  snapperUnsupportedRootOnly: {
    zh: '单一根子卷不推荐 Snapper',
    en: 'Snapper is not recommended with a single root subvolume',
  },
  desktop: { zh: '桌面环境', en: 'Desktop environment' },
  hyprlandExtras: { zh: 'Hyprland 配套', en: 'Hyprland session' },
  hyprlandExtrasHint: {
    zh: 'Hyprland 只提供合成器和会话，以下各类均可单独选择。',
    en: 'Hyprland provides only the compositor and the session; each of the following is chosen separately.',
  },
  hyprlandNotifications: { zh: '通知中心', en: 'Notifications' },
  hyprlandLauncher: { zh: '应用启动器', en: 'Application launcher' },
  hyprlandFileManager: { zh: '文件管理器', en: 'File manager' },
  hyprlandTerminal: { zh: '终端', en: 'Terminal' },
  hyprlandBar: { zh: '状态栏', en: 'Status bar' },
  hyprlandLock: { zh: '锁屏与空闲管理', en: 'Lock screen and idle' },
  hyprlandWallpaper: { zh: '壁纸与色温', en: 'Wallpaper and color temperature' },
  hyprlandScreenshot: { zh: '截图工具', en: 'Screenshots' },
  hyprlandKeyring: { zh: '密钥环', en: 'Keyring' },
  graphics: { zh: '显卡', en: 'Graphics' },
  reflector: { zh: '镜像源', en: 'Mirrors' },
  mirrorCountry: { zh: '国家代码', en: 'Country codes' },
  mirrorCountryHint: {
    zh: '可填写多个 ISO 国家代码，用英文逗号分隔，例如 CA,US。',
    en: 'One or more ISO country codes separated by commas, for example CA,US.',
  },
  mirrorCountryInvalid: {
    zh: '请输入有效的 ISO 国家代码，并用英文逗号分隔',
    en: 'Enter valid ISO country codes separated by commas',
  },
  mirrorAge: { zh: '最近同步（小时）', en: 'Synchronized within (hours)' },
  mirrorNumber: { zh: '保留数量', en: 'Mirrors to keep' },
  timezone: { zh: '时区', en: 'Time zone' },
  timezoneHint: {
    zh: '选择安装后系统使用的时区。',
    en: 'The time zone the installed system will use.',
  },
  detectedTimezone: {
    zh: (timezone: string) => `检测到当前时区：${timezone}`,
    en: (timezone: string) => `Detected time zone: ${timezone}`,
  },
  useDetectedTimezone: { zh: '使用此时区', en: 'Use it' },
  systemLocale: { zh: '系统语言', en: 'System language' },
  systemLocaleHint: {
    zh: '选择系统服务、终端和登录界面默认使用的语言环境。',
    en: 'The locale system services, the terminal, and the login screen use by default.',
  },
  cjkTtyWarning: {
    zh: 'TTY 无法显示 CJK 字符，会显示为方框。仅当你明确计划安装并使用图形界面时，才推荐选择 CJK 系统语言；纯命令行系统请选择非 CJK locale。',
    en: 'The TTY cannot display CJK characters and shows boxes instead. Choose a CJK system language only with a graphical interface planned; for a command-line system, pick a non-CJK locale.',
  },
  keymap: { zh: '键盘布局', en: 'Keyboard layout' },
  keymapHint: {
    zh: '选择安装环境和虚拟控制台使用的键盘布局。',
    en: 'The keyboard layout used in the installation environment and the virtual console.',
  },
  hostname: { zh: '主机名', en: 'Hostname' },
  hostnameHint: {
    zh: '这台电脑在本机和网络中使用的名称，例如 archlinux 或 workstation。',
    en: 'The name this computer uses locally and on the network, such as archlinux or workstation.',
  },
  username: { zh: '用户名', en: 'Username' },
  usernameHint: {
    zh: '日常登录使用的普通用户账户；不能使用 root。',
    en: 'The regular account used for everyday logins; root is not allowed.',
  },
  language: { zh: '界面语言', en: 'Language' },
  theme: { zh: '主题', en: 'Theme' },
  themeAuto: { zh: '跟随系统', en: 'System' },
  themeLight: { zh: '浅色', en: 'Light' },
  themeDark: { zh: '深色', en: 'Dark' },
  wizardSteps: { zh: '配置进度', en: 'Configuration progress' },
  disclaimer: {
    zh: '本站与 Arch Linux 官方无关。',
    en: 'This site is not affiliated with Arch Linux.',
  },
  stepCount: { zh: (total: number) => `共 ${total} 步`, en: (total: number) => `${total} steps` },
} satisfies Record<string, Localized<unknown>>

/** Written the way each language names itself, so it reads the same whatever the interface is set to. */
export const localeNames: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
}

export const choices = {
  cpu: {
    intel: { zh: 'Intel' },
    amd: { zh: 'AMD' },
  },
  zram: {
    false: { zh: '关闭', en: 'Off' },
    true: { zh: '开启', en: 'On' },
  },
  diskSwap: {
    none: { zh: '无', en: 'None' },
    swapfile: { zh: 'swapfile' },
  },
  subvolumeLayout: {
    'root-only': { zh: '单一根子卷（结构简单）', en: 'Single root subvolume (simpler)' },
    separated: { zh: '标准分离子卷（支持快照）', en: 'Separate subvolumes (supports snapshots)' },
  },
  encryption: {
    none: { zh: '关闭', en: 'Off' },
    password: { zh: 'LUKS2（密码）', en: 'LUKS2 (password)' },
    tpm2: { zh: 'LUKS2（TPM2）', en: 'LUKS2 (TPM2)' },
  },
  tpm2Preset: {
    minimal: { zh: '最小（PCR 7）', en: 'Minimal (PCR 7)' },
    'custom-db': { zh: '推荐（自定义 db）', en: 'Recommended (custom db)' },
    'shim-mok': { zh: '推荐（shim/MOK）', en: 'Recommended (shim/MOK)' },
  },
  secureBoot: {
    none: { zh: '关闭', en: 'Off' },
    'custom-db': { zh: '自定义 UEFI db', en: 'Custom UEFI db' },
    'shim-mok': { zh: 'shim-signed + MOK' },
  },
  snapper: {
    none: { zh: '不配置', en: 'Not configured' },
    root: { zh: 'root' },
    'root-home': { zh: 'root + home' },
  },
  desktop: {
    none: { zh: '无', en: 'None' },
    gnome: { zh: 'GNOME' },
    kde: { zh: 'KDE Plasma' },
    hyprland: { zh: 'Hyprland' },
  },
  graphics: {
    intel: { zh: 'Intel' },
    amd: { zh: 'AMD' },
    nvidia: { zh: 'NVIDIA' },
  },
  hyprlandNotifications: {
    none: { zh: '不安装', en: 'Not installed' },
    swaync: { zh: 'SwayNC' },
    mako: { zh: 'mako' },
  },
  hyprlandLauncher: {
    hyprlauncher: { zh: 'Hyprlauncher' },
    rofi: { zh: 'rofi' },
    wofi: { zh: 'wofi' },
    walker: { zh: 'Walker + Elephant' },
  },
  hyprlandFileManager: {
    nautilus: { zh: 'Nautilus' },
    dolphin: { zh: 'Dolphin' },
    thunar: { zh: 'Thunar' },
  },
  hyprlandTerminal: {
    ghostty: { zh: 'Ghostty' },
    kitty: { zh: 'Kitty' },
  },
  hyprlandBar: {
    none: { zh: '不安装', en: 'Not installed' },
    waybar: { zh: 'Waybar' },
  },
  hyprlandLock: {
    none: { zh: '不安装', en: 'Not installed' },
    hyprlock: { zh: 'Hyprlock + Hypridle' },
  },
  hyprlandAddons: {
    hyprpaper: { zh: 'Hyprpaper' },
    hyprsunset: { zh: 'Hyprsunset' },
    hyprshot: { zh: 'Hyprshot' },
    'gnome-keyring': { zh: 'GNOME Keyring' },
    seahorse: { zh: 'Seahorse' },
  },
  /** Every locale is named in its own language, so these entries read the same in any interface. */
  systemLocale: {
    'en_US.UTF-8': { zh: 'English (United States)' },
    'en_GB.UTF-8': { zh: 'English (United Kingdom)' },
    'en_CA.UTF-8': { zh: 'English (Canada)' },
    'zh_CN.UTF-8': { zh: '简体中文' },
    'zh_TW.UTF-8': { zh: '繁體中文' },
    'zh_HK.UTF-8': { zh: '繁體中文（香港）' },
    'de_DE.UTF-8': { zh: 'Deutsch' },
    'fr_FR.UTF-8': { zh: 'Français' },
    'es_ES.UTF-8': { zh: 'Español' },
    'it_IT.UTF-8': { zh: 'Italiano' },
    'ja_JP.UTF-8': { zh: '日本語' },
    'ko_KR.UTF-8': { zh: '한국어' },
    'ru_RU.UTF-8': { zh: 'Русский' },
    'ar_EG.UTF-8': { zh: 'العربية（مصر）' },
    'bg_BG.UTF-8': { zh: 'Български' },
    'ca_ES.UTF-8': { zh: 'Català' },
    'cs_CZ.UTF-8': { zh: 'Čeština' },
    'da_DK.UTF-8': { zh: 'Dansk' },
    'de_AT.UTF-8': { zh: 'Deutsch（Österreich）' },
    'de_CH.UTF-8': { zh: 'Deutsch（Schweiz）' },
    'el_GR.UTF-8': { zh: 'Ελληνικά' },
    'en_AU.UTF-8': { zh: 'English (Australia)' },
    'en_IE.UTF-8': { zh: 'English (Ireland)' },
    'en_NZ.UTF-8': { zh: 'English (New Zealand)' },
    'en_SG.UTF-8': { zh: 'English (Singapore)' },
    'en_ZA.UTF-8': { zh: 'English (South Africa)' },
    'es_AR.UTF-8': { zh: 'Español（Argentina）' },
    'es_CL.UTF-8': { zh: 'Español（Chile）' },
    'es_CO.UTF-8': { zh: 'Español（Colombia）' },
    'es_MX.UTF-8': { zh: 'Español（México）' },
    'et_EE.UTF-8': { zh: 'Eesti' },
    fa_IR: { zh: 'فارسی' },
    'fi_FI.UTF-8': { zh: 'Suomi' },
    'fr_BE.UTF-8': { zh: 'Français（Belgique）' },
    'fr_CA.UTF-8': { zh: 'Français（Canada）' },
    'fr_CH.UTF-8': { zh: 'Français（Suisse）' },
    'he_IL.UTF-8': { zh: 'עברית' },
    hi_IN: { zh: 'हिन्दी' },
    'hr_HR.UTF-8': { zh: 'Hrvatski' },
    'hu_HU.UTF-8': { zh: 'Magyar' },
    hy_AM: { zh: 'Հայերեն' },
    'id_ID.UTF-8': { zh: 'Bahasa Indonesia' },
    'is_IS.UTF-8': { zh: 'Íslenska' },
    'ka_GE.UTF-8': { zh: 'ქართული' },
    'kk_KZ.UTF-8': { zh: 'Қазақша' },
    'lt_LT.UTF-8': { zh: 'Lietuvių' },
    'lv_LV.UTF-8': { zh: 'Latviešu' },
    'ms_MY.UTF-8': { zh: 'Bahasa Melayu' },
    'nb_NO.UTF-8': { zh: 'Norsk bokmål' },
    'nl_BE.UTF-8': { zh: 'Nederlands（België）' },
    'nl_NL.UTF-8': { zh: 'Nederlands（Nederland）' },
    'nn_NO.UTF-8': { zh: 'Norsk nynorsk' },
    'pl_PL.UTF-8': { zh: 'Polski' },
    'pt_BR.UTF-8': { zh: 'Português（Brasil）' },
    'pt_PT.UTF-8': { zh: 'Português（Portugal）' },
    'ro_RO.UTF-8': { zh: 'Română' },
    'sk_SK.UTF-8': { zh: 'Slovenčina' },
    'sl_SI.UTF-8': { zh: 'Slovenščina' },
    sr_RS: { zh: 'Српски' },
    'sv_SE.UTF-8': { zh: 'Svenska' },
    'th_TH.UTF-8': { zh: 'ไทย' },
    'tr_TR.UTF-8': { zh: 'Türkçe' },
    'uk_UA.UTF-8': { zh: 'Українська' },
    ur_PK: { zh: 'اردو' },
    vi_VN: { zh: 'Tiếng Việt' },
  },
  keymap: {
    us: { zh: 'English (US)' },
    uk: { zh: 'English (UK)' },
    'de-latin1': { zh: 'Deutsch' },
    'fr-latin9': { zh: 'Français' },
    es: { zh: 'Español' },
    it: { zh: 'Italiano' },
    jp106: { zh: '日本語' },
    ru: { zh: 'Русский' },
  },
} satisfies Record<string, Record<string, Localized<string>>>

export const choiceDescriptions = {
  cpu: {
    intel: {
      zh: '安装 Intel 处理器所需的 intel-ucode 微码包。',
      en: 'Installs the intel-ucode microcode package that Intel processors need.',
    },
    amd: {
      zh: '安装 AMD 处理器所需的 amd-ucode 微码包。',
      en: 'Installs the amd-ucode microcode package that AMD processors need.',
    },
  },
  zram: {
    false: { zh: '不使用 zram。', en: 'No zram.' },
    true: {
      zh: '使用 zram，在内存中创建压缩 swap。',
      en: 'Uses zram to create compressed swap in memory.',
    },
  },
  diskSwap: {
    none: { zh: '不配置磁盘 swap。', en: 'No swap on disk.' },
    swapfile: {
      zh: '在 Btrfs 文件系统中配置 swapfile。',
      en: 'Creates a swapfile on the Btrfs filesystem.',
    },
  },
  subvolumeLayout: {
    'root-only': {
      zh: '只创建 @，结构简单，但不能配置 Snapper。',
      en: 'Creates only @. Simpler, but Snapper cannot be configured.',
    },
    separated: {
      zh: '在同一个 Btrfs 文件系统中，将 /boot、/home、日志和软件包缓存置于独立子卷，控制根快照包含的内容，并允许配置 Snapper。',
      en: 'Puts /boot, /home, the logs, and the package cache on separate subvolumes of the same Btrfs filesystem, which controls what a root snapshot contains and allows Snapper.',
    },
  },
  encryption: {
    none: {
      zh: '不加密根文件系统；ESP 无论选择哪种模式都不会加密。',
      en: 'Leaves the root filesystem unencrypted; the ESP stays unencrypted in every mode.',
    },
    password: {
      zh: '使用 LUKS2 保护系统数据，每次启动时手动输入密码解锁。',
      en: 'Protects the system data with LUKS2, unlocked by typing a password at every boot.',
    },
    tpm2: {
      zh: '使用 LUKS2，由 TPM2 验证启动状态；可另行要求输入 PIN。',
      en: 'Uses LUKS2 with the TPM2 verifying the boot state; a PIN can be required as well.',
    },
  },
  tpm2Preset: {
    minimal: {
      zh: '哈希绑定 PCR 7；内核更新不需重新注册，但不能区分由同一密钥签名的镜像。',
      en: 'Hash-binds PCR 7. Kernel updates need no re-enrollment, but images signed with the same key cannot be told apart.',
    },
    'custom-db': {
      zh: '绑定 PCR 7，并用签名策略绑定 PCR 11；同时选择自定义 UEFI db。',
      en: 'Binds PCR 7, and binds PCR 11 through a signing policy; selects the custom UEFI db as well.',
    },
    'shim-mok': {
      zh: '绑定 PCR 7+14，并用签名策略绑定 PCR 11；同时选择 shim-signed + MOK。',
      en: 'Binds PCR 7+14, and binds PCR 11 through a signing policy; selects shim-signed + MOK as well.',
    },
  },
  secureBoot: {
    none: { zh: '不验证启动文件的签名。', en: 'Does not verify the signatures of the boot files.' },
    'custom-db': {
      zh: '将自定义证书注册到固件 UEFI db；要求固件支持 Setup Mode。',
      en: 'Enrolls a custom certificate into the firmware UEFI db; the firmware has to support Setup Mode.',
    },
    'shim-mok': {
      zh: '通过微软签名的 shim 和自行注册的 MOK 建立信任链。',
      en: 'Builds the trust chain from the Microsoft-signed shim and a MOK you enroll yourself.',
    },
  },
  snapper: {
    none: { zh: '不创建 Snapper 配置。', en: 'Creates no Snapper configuration.' },
    root: {
      zh: '只为根系统创建和管理快照。',
      en: 'Creates and manages snapshots of the root system only.',
    },
    'root-home': {
      zh: '分别为根系统和 home 创建独立的快照配置。',
      en: 'Creates separate snapshot configurations for the root system and for home.',
    },
  },
  desktop: {
    none: {
      zh: '只安装命令行基础系统；之后仍可自行安装桌面。',
      en: 'Installs the command-line base system only; a desktop can still be added later.',
    },
    gnome: { zh: '安装 GNOME 桌面环境。', en: 'Installs the GNOME desktop environment.' },
    kde: { zh: '安装 KDE Plasma 桌面环境。', en: 'Installs the KDE Plasma desktop environment.' },
    hyprland: {
      zh: '安装 Hyprland Wayland 合成器。',
      en: 'Installs the Hyprland Wayland compositor.',
    },
  },
  graphics: {
    intel: {
      zh: '安装 Mesa、Intel Vulkan 驱动和现代 Intel 核显的视频加速驱动。',
      en: 'Installs Mesa, the Intel Vulkan driver, and video acceleration for modern Intel integrated graphics.',
    },
    amd: {
      zh: '安装 Mesa、AMD Vulkan 驱动和 Mesa 视频加速驱动。',
      en: 'Installs Mesa, the AMD Vulkan driver, and the Mesa video acceleration drivers.',
    },
    nvidia: {
      zh: '安装 NVIDIA 开放内核模块和用户空间驱动，适用于 Turing 及更新架构。',
      en: 'Installs the NVIDIA open kernel modules and userspace drivers, for Turing and newer architectures.',
    },
  },
  hyprlandNotifications: {
    none: {
      zh: '不安装通知守护进程，应用发出的通知不会显示。',
      en: 'Installs no notification daemon, so notifications from applications never appear.',
    },
    swaync: {
      zh: '带通知中心面板，可回看历史通知。',
      en: 'Includes a notification center panel for reviewing past notifications.',
    },
    mako: { zh: '仅显示通知，无面板。', en: 'Displays notifications only, without a panel.' },
  },
  hyprlandLauncher: {
    hyprlauncher: {
      zh: 'Hyprland 生态自带的启动器，也是默认配置里 SUPER + R 指向的程序。',
      en: 'The launcher from the Hyprland ecosystem, and what SUPER + R points at in the default configuration.',
    },
    rofi: {
      zh: '同时支持窗口切换、dmenu 输入等模式。',
      en: 'Also works as a window switcher, a dmenu replacement, and more.',
    },
    wofi: { zh: '仅做应用启动，配置项少。', en: 'Launches applications only, with few options.' },
    walker: {
      zh: 'GTK4 启动器，检索数据由 Elephant 服务提供。',
      en: 'A GTK4 launcher; the Elephant service supplies the data it searches.',
    },
  },
  hyprlandFileManager: {
    nautilus: {
      zh: 'GNOME 的文件管理器，随选安装 SMB 支持与空格预览。',
      en: 'The GNOME file manager, installed with SMB support and space-bar previews.',
    },
    dolphin: {
      zh: 'KDE 的文件管理器，随选安装缩略图插件；SMB 支持来自其依赖 kio-extras。',
      en: 'The KDE file manager, installed with thumbnail plugins; SMB support comes from its kio-extras dependency.',
    },
    thunar: {
      zh: 'Xfce 的文件管理器，随选安装 GVfs、SMB 支持、缩略图、可移动介质和压缩包插件。',
      en: 'The Xfce file manager, installed with GVfs, SMB support, thumbnails, removable media, and archive plugins.',
    },
  },
  hyprlandTerminal: {
    ghostty: {
      zh: 'GPU 渲染，配置文件即生效。',
      en: 'GPU rendered, configured entirely from a plain config file.',
    },
    kitty: {
      zh: 'GPU 渲染，内置分屏与图片协议。',
      en: 'GPU rendered, with built-in splits and an image protocol.',
    },
  },
  hyprlandBar: {
    none: { zh: '不安装状态栏。', en: 'Installs no status bar.' },
    waybar: {
      zh: '显示工作区、托盘和系统状态，使用发行版自带的默认配置。',
      en: 'Shows workspaces, the tray, and system status, using the default configuration from the distribution.',
    },
  },
  hyprlandLock: {
    none: {
      zh: '不安装锁屏，空闲时不会自动息屏或挂起。',
      en: 'Installs no lock screen, and the machine neither blanks nor suspends when idle.',
    },
    hyprlock: {
      zh: 'Hyprlock 负责锁屏界面，Hypridle 按空闲时间触发锁屏、息屏和挂起。',
      en: 'Hyprlock draws the lock screen; Hypridle triggers locking, blanking, and suspend after set idle times.',
    },
  },
  hyprlandAddons: {
    hyprpaper: {
      zh: '设置壁纸，需要指定图片。',
      en: 'Sets the wallpaper; the image has to be named.',
    },
    hyprsunset: {
      zh: '色温滤镜，用 hyprsunset -t 4000 调整。',
      en: 'Color temperature filter, adjusted with hyprsunset -t 4000.',
    },
    hyprshot: {
      zh: '按区域、窗口或显示器截图，同时写入剪贴板。',
      en: 'Captures a region, a window, or a display, and copies the result to the clipboard.',
    },
    'gnome-keyring': {
      zh: '存储应用密码，可由登录密码自动解锁。',
      en: 'Stores application passwords and can be unlocked by the login password.',
    },
    seahorse: { zh: '密钥环的图形管理界面。', en: 'Graphical manager for the keyring.' },
  },
} satisfies Record<string, Record<string, Localized<string>>>

/** Multi-select Hyprland categories, shared by the wizard and the configuration summary. */
export const hyprlandAddonGroups: { label: Localized<string>; addons: HyprlandAddon[] }[] = [
  { label: ui.hyprlandWallpaper, addons: ['hyprpaper', 'hyprsunset'] },
  { label: ui.hyprlandScreenshot, addons: ['hyprshot'] },
  { label: ui.hyprlandKeyring, addons: ['gnome-keyring', 'seahorse'] },
]
