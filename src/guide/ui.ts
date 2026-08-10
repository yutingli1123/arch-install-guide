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
  disclaimer: { zh: '本站与 Arch Linux 官方无关。' },
  stepCount: { zh: (total: number) => `共 ${total} 步` },
} satisfies Record<string, Localized<unknown>>
