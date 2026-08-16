import type { Config, Context, Subvolume, SubvolumeLayout } from './types'

/** Devices whose partitions carry a `p` before the partition number. */
const PARTITION_SUFFIX = /^\/dev\/(nvme|mmcblk|loop|md)/

export function partition(disk: string, index: number): string {
  return PARTITION_SUFFIX.test(disk) ? `${disk}p${index}` : `${disk}${index}`
}

/** systemLocale -> tesseract-data language code, for locales Tesseract has separate training data for. */
const TESSERACT_LOCALE_DATA: Record<string, string> = {
  'zh_CN.UTF-8': 'chi_sim',
  'zh_TW.UTF-8': 'chi_tra',
  'de_DE.UTF-8': 'deu',
  'de_AT.UTF-8': 'deu',
  'de_CH.UTF-8': 'deu',
  'fr_FR.UTF-8': 'fra',
  'fr_BE.UTF-8': 'fra',
  'fr_CA.UTF-8': 'fra',
  'fr_CH.UTF-8': 'fra',
  'es_ES.UTF-8': 'spa',
  'es_AR.UTF-8': 'spa',
  'es_CL.UTF-8': 'spa',
  'es_CO.UTF-8': 'spa',
  'es_MX.UTF-8': 'spa',
  'it_IT.UTF-8': 'ita',
  'ja_JP.UTF-8': 'jpn',
  'ko_KR.UTF-8': 'kor',
  'ru_RU.UTF-8': 'rus',
  'ar_EG.UTF-8': 'ara',
  'bg_BG.UTF-8': 'bul',
  'ca_ES.UTF-8': 'cat',
  'cs_CZ.UTF-8': 'ces',
  'da_DK.UTF-8': 'dan',
  'el_GR.UTF-8': 'ell',
  'et_EE.UTF-8': 'est',
  fa_IR: 'fas',
  'fi_FI.UTF-8': 'fin',
  'he_IL.UTF-8': 'heb',
  hi_IN: 'hin',
  'hr_HR.UTF-8': 'hrv',
  'hu_HU.UTF-8': 'hun',
  hy_AM: 'hye',
  'id_ID.UTF-8': 'ind',
  'is_IS.UTF-8': 'isl',
  'ka_GE.UTF-8': 'kat',
  'kk_KZ.UTF-8': 'kaz',
  'lt_LT.UTF-8': 'lit',
  'lv_LV.UTF-8': 'lav',
  'ms_MY.UTF-8': 'msa',
  'nb_NO.UTF-8': 'nor',
  'nn_NO.UTF-8': 'nor',
  'nl_BE.UTF-8': 'nld',
  'nl_NL.UTF-8': 'nld',
  'pl_PL.UTF-8': 'pol',
  'pt_BR.UTF-8': 'por',
  'pt_PT.UTF-8': 'por',
  'ro_RO.UTF-8': 'ron',
  'sk_SK.UTF-8': 'slk',
  'sl_SI.UTF-8': 'slv',
  sr_RS: 'srp',
  'sv_SE.UTF-8': 'swe',
  'th_TH.UTF-8': 'tha',
  'tr_TR.UTF-8': 'tur',
  'uk_UA.UTF-8': 'ukr',
  ur_PK: 'urd',
  vi_VN: 'vie',
}

const BASE_PACKAGES = [
  'base',
  'linux',
  'linux-firmware',
  'btrfs-progs',
  'networkmanager',
  'sudo',
  'vim',
]

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

export function derive(cfg: Config): Context {
  if (cfg.subvolumeLayout === 'root-only' && cfg.snapper !== 'none') {
    throw new Error('snapper requires the separated subvolume layout')
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
        ...(TESSERACT_LOCALE_DATA[cfg.systemLocale]
          ? [`tesseract-data-${TESSERACT_LOCALE_DATA[cfg.systemLocale]}`]
          : []),
      ],
      displayManager: 'sddm',
    },
    hyprland: {
      packages: [
        'hyprland',
        'ghostty',
        'xdg-desktop-portal-hyprland',
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
          ...(cfg.desktop === 'hyprland' ? ['pavucontrol'] : []),
        ]
  const inputMethodEngine = cfg.systemLocale.startsWith('zh_')
    ? 'fcitx5-chinese-addons'
    : cfg.systemLocale.startsWith('ja_')
      ? 'fcitx5-mozc'
      : cfg.systemLocale.startsWith('ko_')
        ? 'fcitx5-hangul'
        : undefined
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
    packages.push(
      'base-devel',
      'efibootmgr',
      'git',
      'mokutil',
      'sbsigntools',
      'systemd-ukify',
    )
  }
  if (
    cfg.encryption.mode === 'luks2' &&
    cfg.encryption.unlock.method === 'tpm2' &&
    cfg.encryption.unlock.signedPcrs.includes(11)
  ) {
    packages.push('systemd-ukify')
  }

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
    desktopPackages: desktop.packages,
    displayManager: 'displayManager' in desktop ? desktop.displayManager : undefined,
  }
}
