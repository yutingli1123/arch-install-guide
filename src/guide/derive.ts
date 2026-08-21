import type {
  Config,
  Context,
  HyprlandExtras,
  HyprlandFileManager,
  Subvolume,
  SubvolumeLayout,
} from './types'
import { consoleFont } from './console'

/** Devices whose partitions carry a `p` before the partition number. */
const PARTITION_SUFFIX = /^\/dev\/(nvme|mmcblk|loop|md)/

export function partition(disk: string, index: number): string {
  return PARTITION_SUFFIX.test(disk) ? `${disk}p${index}` : `${disk}${index}`
}

/** The language subtag of a locale name such as `sr_RS@latin`. */
export function localeLanguage(locale: string): string {
  return locale.split(/[_.@]/, 1)[0]!
}

/** Language subtag -> tesseract-data language code, for languages Tesseract has training data for. */
const TESSERACT_LANGUAGE_DATA: Record<string, string> = {
  af: 'afr',
  am: 'amh',
  ar: 'ara',
  as: 'asm',
  az: 'aze',
  be: 'bel',
  bg: 'bul',
  bn: 'ben',
  bo: 'bod',
  br: 'bre',
  bs: 'bos',
  ca: 'cat',
  chr: 'chr',
  cs: 'ces',
  cy: 'cym',
  da: 'dan',
  de: 'deu',
  dv: 'div',
  dz: 'dzo',
  el: 'ell',
  eo: 'epo',
  es: 'spa',
  et: 'est',
  eu: 'eus',
  fa: 'fas',
  fi: 'fin',
  fil: 'fil',
  fo: 'fao',
  fr: 'fra',
  fy: 'fry',
  ga: 'gle',
  gd: 'gla',
  gl: 'glg',
  gu: 'guj',
  he: 'heb',
  hi: 'hin',
  hr: 'hrv',
  ht: 'hat',
  hu: 'hun',
  hy: 'hye',
  id: 'ind',
  is: 'isl',
  it: 'ita',
  iu: 'iku',
  ja: 'jpn',
  ka: 'kat',
  kk: 'kaz',
  km: 'khm',
  kn: 'kan',
  ko: 'kor',
  ku: 'kmr',
  ky: 'kir',
  lb: 'ltz',
  lo: 'lao',
  lt: 'lit',
  lv: 'lav',
  mi: 'mri',
  mk: 'mkd',
  ml: 'mal',
  mn: 'mon',
  mr: 'mar',
  ms: 'msa',
  mt: 'mlt',
  my: 'mya',
  nb: 'nor',
  ne: 'nep',
  nl: 'nld',
  nn: 'nor',
  oc: 'oci',
  or: 'ori',
  pa: 'pan',
  pl: 'pol',
  ps: 'pus',
  pt: 'por',
  quz: 'que',
  ro: 'ron',
  ru: 'rus',
  sa: 'san',
  sd: 'snd',
  si: 'sin',
  sk: 'slk',
  sl: 'slv',
  sq: 'sqi',
  sr: 'srp',
  su: 'sun',
  sv: 'swe',
  sw: 'swa',
  syr: 'syr',
  ta: 'tam',
  te: 'tel',
  tg: 'tgk',
  th: 'tha',
  ti: 'tir',
  tl: 'tgl',
  to: 'ton',
  tr: 'tur',
  tt: 'tat',
  ug: 'uig',
  uk: 'ukr',
  ur: 'urd',
  uz: 'uzb',
  vi: 'vie',
  yi: 'yid',
  yo: 'yor',
}

/** Locales written in a script other than the one the language's training data covers; null when none fits. */
const TESSERACT_LOCALE_DATA: Record<string, string | null> = {
  'zh_CN.UTF-8': 'chi_sim',
  'zh_SG.UTF-8': 'chi_sim',
  'zh_TW.UTF-8': 'chi_tra',
  'zh_HK.UTF-8': 'chi_tra',
  'sr_RS@latin': 'srp_latn',
  'uz_UZ@cyrillic': 'uzb_cyrl',
  az_IR: null,
  'be_BY@latin': null,
  pa_PK: null,
  'sd_IN@devanagari': null,
  'tt_RU@iqtelif': null,
}

function tesseractLanguage(locale: string): string | undefined {
  const override = TESSERACT_LOCALE_DATA[locale]
  if (override !== undefined) return override ?? undefined
  return TESSERACT_LANGUAGE_DATA[localeLanguage(locale)]
}

/** systemLocale -> the Noto CJK regional variant used as the default CJK face. */
export const CJK_VARIANTS: Record<string, string> = {
  'zh_CN.UTF-8': 'SC',
  'zh_SG.UTF-8': 'SC',
  'zh_TW.UTF-8': 'TC',
  'zh_HK.UTF-8': 'HK',
  'ja_JP.UTF-8': 'JP',
  'ko_KR.UTF-8': 'KR',
}

/** Language subtag -> fcitx5 engine, for languages that need more than a keyboard layout. */
const INPUT_METHOD_ENGINES: Record<string, string> = {
  zh: 'fcitx5-chinese-addons',
  ja: 'fcitx5-mozc',
  ko: 'fcitx5-hangul',
}

const BASE_PACKAGES = [
  'base',
  'base-devel',
  'git',
  'linux',
  'linux-firmware',
  'btrfs-progs',
  'networkmanager',
  'sudo',
  'vim',
]

const DESKTOP_NAMES = {
  none: '',
  gnome: 'GNOME',
  kde: 'KDE Plasma',
  hyprland: 'Hyprland',
} satisfies Record<Config['desktop'], string>

const SUBVOLUME_LAYOUTS = {
  'root-only': [{ name: '@', mountPoint: '/' }],
  separated: [
    { name: '@', mountPoint: '/' },
    { name: '@boot', mountPoint: '/boot' },
    { name: '@home', mountPoint: '/home' },
    { name: '@log', mountPoint: '/var/log' },
    { name: '@pkg', mountPoint: '/var/cache/pacman/pkg' },
  ],
} satisfies Record<SubvolumeLayout, [Subvolume, ...Subvolume[]]>

/** A file manager only integrates with the rest of the system through these. */
const FILE_MANAGER_PACKAGES: Record<HyprlandFileManager, string[]> = {
  nautilus: ['nautilus', 'gvfs-smb', 'sushi'],
  dolphin: ['dolphin', 'ffmpegthumbs', 'kdegraphics-thumbnailers'],
  thunar: [
    'thunar',
    'gvfs',
    'gvfs-smb',
    'tumbler',
    'ffmpegthumbnailer',
    'thunar-volman',
    'thunar-archive-plugin',
  ],
}

/** Packages that ship a systemd user unit wanted by graphical-session.target. */
const HYPRLAND_SERVICE_PACKAGES = [
  'swaync',
  'mako',
  'waybar',
  'hypridle',
  'hyprpaper',
  'hyprsunset',
]

/** Walker itself holds no data; launching applications needs the matching elephant provider. */
const WALKER_AUR_PACKAGES = ['walker', 'elephant', 'elephant-desktopapplications']

function hyprlandPackages(extras: HyprlandExtras): string[] {
  return [
    extras.terminal,
    ...(extras.launcher === 'walker' ? [] : [extras.launcher]),
    ...FILE_MANAGER_PACKAGES[extras.fileManager],
    ...(extras.notifications === 'none' ? [] : [extras.notifications]),
    ...(extras.bar === 'none' ? [] : [extras.bar]),
    ...(extras.lock === 'none' ? [] : ['hyprlock', 'hypridle']),
    ...extras.addons,
  ]
}

export function derive(cfg: Config): Context {
  if (cfg.subvolumeLayout === 'root-only' && cfg.snapper !== 'none') {
    throw new Error('snapper requires the separated subvolume layout')
  }
  if (cfg.desktop !== 'hyprland' && cfg.hyprland) {
    throw new Error('hyprland extras require the hyprland desktop')
  }
  if (cfg.encryption.mode === 'luks2' && cfg.encryption.unlock.method === 'tpm2') {
    const { hashPcrs, signedPcrs } = cfg.encryption.unlock
    if (signedPcrs.includes(11) && cfg.secureBoot === 'none') {
      throw new Error('signed PCR 11 policy requires secure boot')
    }
    if (hashPcrs.includes(14) && cfg.secureBoot !== 'shim-mok') {
      throw new Error('PCR 14 requires shim/MOK secure boot')
    }
  }

  const subvolumes: Subvolume[] = [...SUBVOLUME_LAYOUTS[cfg.subvolumeLayout]]
  if (cfg.snapper === 'root' || cfg.snapper === 'root-home') {
    subvolumes.push({ name: '@snapshots', mountPoint: '/.snapshots' })
  }
  if (cfg.snapper === 'root-home') {
    subvolumes.push({ name: '@home_snapshots', mountPoint: '/home/.snapshots' })
  }
  if (cfg.diskSwap === 'swapfile') {
    subvolumes.push({ name: '@swap', mountPoint: '/swap', mountOptions: ['noatime'] })
  }
  const rootSubvolume = subvolumes[0]!

  const microcode = `${cfg.cpu}-ucode`
  const luksName = 'cryptroot'
  const rootDevice = partition(cfg.disk, 2)
  const rootFsDevice = cfg.encryption.mode === 'luks2' ? `/dev/mapper/${luksName}` : rootDevice
  const packages = [...BASE_PACKAGES, microcode]
  const tesseract = tesseractLanguage(cfg.systemLocale)
  const graphicsPackages = {
    intel: ['mesa', 'vulkan-intel', 'intel-media-driver'],
    amd: ['mesa', 'vulkan-radeon', 'libva-mesa-driver'],
    nvidia: ['nvidia-open', 'nvidia-utils'],
  }[cfg.graphics]
  const desktop = {
    none: { packages: [] },
    gnome: { packages: ['gnome'], displayManager: 'gdm' },
    kde: {
      packages: [
        'plasma-meta',
        'sddm',
        'konsole',
        'dolphin',
        'qt6-multimedia-ffmpeg',
        'tesseract-data-eng',
        ...(tesseract ? [`tesseract-data-${tesseract}`] : []),
      ],
      displayManager: 'sddm',
    },
    hyprland: {
      packages: [
        'hyprland',
        'xdg-desktop-portal-hyprland',
        'wl-clipboard',
        'playerctl',
        'hyprpolkitagent',
        'greetd',
        'greetd-regreet',
      ],
      displayManager: 'greetd',
    },
  }[cfg.desktop]
  const audioPackages =
    cfg.desktop === 'none'
      ? []
      : [
          'pipewire',
          'pipewire-audio',
          'pipewire-alsa',
          'pipewire-pulse',
          'pipewire-jack',
          'wireplumber',
        ]
  const inputMethodEngine = INPUT_METHOD_ENGINES[localeLanguage(cfg.systemLocale)]
  const desktopCommonPackages =
    cfg.desktop === 'none'
      ? []
      : [
          ...(cfg.desktop === 'hyprland' ? ['bluez', 'bluez-utils', 'blueman'] : []),
          'noto-fonts',
          'noto-fonts-cjk',
          'noto-fonts-extra',
          'noto-fonts-emoji',
          'fcitx5-im',
          ...(inputMethodEngine ? [inputMethodEngine] : []),
        ]
  if (cfg.encryption.mode === 'luks2') packages.push('cryptsetup')
  if (cfg.zram) packages.push('zram-generator')
  if (cfg.snapper !== 'none') packages.push('snapper')
  if (cfg.secureBoot === 'custom-db') packages.push('sbctl')
  if (cfg.secureBoot === 'shim-mok') {
    packages.push('efibootmgr', 'mokutil', 'sbsigntools', 'systemd-ukify')
  }
  if (
    cfg.encryption.mode === 'luks2' &&
    cfg.encryption.unlock.method === 'tpm2' &&
    cfg.encryption.unlock.signedPcrs.includes(11)
  ) {
    packages.push('systemd-ukify')
  }

  const hyprland = cfg.hyprland ? hyprlandPackages(cfg.hyprland) : []

  return {
    cfg,
    espDevice: partition(cfg.disk, 1),
    rootDevice,
    rootFsDevice,
    luksName,
    espMountPoint: '/efi',
    rootSubvolume,
    subvolumes,
    nestedSubvolumes: subvolumes.slice(1),
    mountOptions: cfg.mountOptions.join(','),
    packages: [...new Set(packages)].sort(),
    microcode,
    graphicsPackages,
    audioPackages,
    desktopCommonPackages,
    inputMethodEngine,
    consoleFont: consoleFont(cfg.systemLocale),
    desktopPackages: desktop.packages,
    desktopName: DESKTOP_NAMES[cfg.desktop],
    hyprlandPackages: hyprland,
    hyprlandAurPackages: cfg.hyprland?.launcher === 'walker' ? WALKER_AUR_PACKAGES : [],
    hyprlandServices: hyprland.filter((name) => HYPRLAND_SERVICE_PACKAGES.includes(name)),
    cjkVariant: cfg.desktop === 'none' ? undefined : CJK_VARIANTS[cfg.systemLocale],
    displayManager: 'displayManager' in desktop ? desktop.displayManager : undefined,
  }
}
