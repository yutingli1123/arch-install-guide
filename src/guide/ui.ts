import type { Locale, Localized } from './types'

export function pick<T>(value: Localized<T>, locale: Locale): T {
  return value[locale] ?? value.zh
}

export const ui = {
  title: { zh: 'Arch Linux 安装指南' },
  copy: { zh: '复制' },
  copied: { zh: '已复制' },
  print: { zh: '保存为 PDF' },
  verifiedAgainst: { zh: '对照 Arch 状态验证于' },
  configSummary: { zh: '本指南配置' },
  enabled: { zh: '开启' },
  disabled: { zh: '关闭' },
  none: { zh: '无' },
  targetDisk: { zh: '目标磁盘' },
  cpu: { zh: 'CPU' },
  swap: { zh: 'swap' },
  subvolumes: { zh: '子卷布局' },
  rootOnlySubvolumes: { zh: '单一根子卷' },
  separatedSubvolumes: { zh: '标准分离子卷' },
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
