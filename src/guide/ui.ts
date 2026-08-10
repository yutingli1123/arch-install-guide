import type { Locale, Localized } from './types'

export function pick<T>(value: Localized<T>, locale: Locale): T {
  return value[locale] ?? value.zh
}

export const ui = {
  title: { zh: 'Arch Linux 安装指南' },
  welcomeTitle: { zh: '生成适合你的 Arch Linux 安装指南' },
  welcomeBody: { zh: '通过分步向导完成系统配置，最后生成一份可以逐项执行和打印的安装指南。' },
  start: { zh: '开始配置' },
  copy: { zh: '复制' },
  copied: { zh: '已复制' },
  print: { zh: '保存为 PDF' },
  editConfig: { zh: '修改配置' },
  installationTarget: { zh: '安装目标' },
  storage: { zh: '存储' },
  baseSystem: { zh: '基础系统' },
  review: { zh: '确认配置' },
  backToWelcome: { zh: '返回欢迎页' },
  previous: { zh: '上一步' },
  next: { zh: '下一步' },
  generateGuide: { zh: '生成安装指南' },
  wizardProgress: { zh: (current: number, total: number) => `第 ${current} 步，共 ${total} 步` },
  urlSync: { zh: '配置会自动保存到当前网址，可直接复制分享。' },
  verifiedAgainst: { zh: '对照 Arch 状态验证于' },
  configSummary: { zh: '本指南配置' },
  enabled: { zh: '开启' },
  disabled: { zh: '关闭' },
  none: { zh: '无' },
  targetDisk: { zh: '目标磁盘' },
  cpu: { zh: 'CPU' },
  swap: { zh: 'swap' },
  subvolumes: { zh: '子卷布局' },
  encryption: { zh: '磁盘加密' },
  unlock: { zh: '解锁方式' },
  password: { zh: '密码' },
  tpmPin: { zh: 'TPM PIN' },
  hashPcrs: { zh: 'PCR 哈希绑定' },
  signedPcrs: { zh: 'PCR 签名策略' },
  secureBoot: { zh: '安全启动' },
  snapper: { zh: 'snapper' },
  desktop: { zh: '桌面环境' },
  timezone: { zh: '时区' },
  systemLocale: { zh: '系统语言' },
  keymap: { zh: '键盘布局' },
  hostname: { zh: '主机名' },
  username: { zh: '用户名' },
  disclaimer: { zh: '本站与 Arch Linux 官方无关。' },
  stepCount: { zh: (total: number) => `共 ${total} 步` },
} satisfies Record<string, Localized<unknown>>

export const choices = {
  cpu: {
    intel: { zh: 'Intel' },
    amd: { zh: 'AMD' },
  },
  swap: {
    none: { zh: '无' },
    zram: { zh: 'zram' },
    swapfile: { zh: 'swapfile' },
    partition: { zh: '独立分区' },
  },
  subvolumeLayout: {
    'root-only': { zh: '单一根子卷' },
    separated: { zh: '标准分离子卷' },
  },
  encryption: {
    none: { zh: '关闭' },
    password: { zh: 'LUKS2（密码）' },
    'tpm2-pin': { zh: 'LUKS2（TPM2 + PIN）' },
  },
  secureBoot: {
    none: { zh: '关闭' },
    'custom-db': { zh: '自定义 UEFI db' },
    'shim-mok': { zh: 'shim-signed + MOK' },
  },
  snapper: {
    none: { zh: '不配置' },
    root: { zh: 'root' },
    'root-home': { zh: 'root + home' },
  },
  desktop: {
    none: { zh: '无' },
    gnome: { zh: 'GNOME' },
    kde: { zh: 'KDE Plasma' },
    hyprland: { zh: 'Hyprland' },
  },
} satisfies Record<string, Record<string, Localized<string>>>
