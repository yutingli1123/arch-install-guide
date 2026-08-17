import type { Localized, Step } from '../types'
import { liveSteps } from './live'
import { diskSteps } from './disk'
import { installSteps } from './install'
import { systemSteps } from './system'
import { storageSteps } from './storage'
import { bootSteps } from './boot'
import { desktopSteps } from './desktop'
import { hyprlandSteps } from './hyprland'
import { finishSteps } from './finish'

export const sectionTitles: Record<string, Localized<string>> = {
  live: { zh: '安装环境' },
  disk: { zh: '磁盘' },
  install: { zh: '安装系统' },
  system: { zh: '系统配置' },
  storage: { zh: '存储配置' },
  boot: { zh: '引导' },
  desktop: { zh: '桌面与显卡' },
  hyprland: { zh: 'Hyprland 配套' },
  finish: { zh: '收尾' },
}

/** Order here is the order of the generated guide. */
export const steps: Step[] = [
  ...liveSteps,
  ...diskSteps,
  ...installSteps,
  ...systemSteps,
  ...storageSteps,
  ...bootSteps,
  ...desktopSteps,
  ...hyprlandSteps,
  ...finishSteps,
]
