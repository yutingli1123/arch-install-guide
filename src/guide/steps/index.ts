import type { Localized, Step } from '../types'
import { liveSteps } from './live'
import { diskSteps } from './disk'
import { installSteps } from './install'
import { systemSteps } from './system'
import { bootSteps } from './boot'
import { finishSteps } from './finish'

export const sectionTitles: Record<string, Localized<string>> = {
  live: { zh: '安装环境' },
  disk: { zh: '磁盘' },
  install: { zh: '安装系统' },
  system: { zh: '系统配置' },
  boot: { zh: '引导' },
  finish: { zh: '收尾' },
}

/** Order here is the order of the generated guide. */
export const steps: Step[] = [
  ...liveSteps,
  ...diskSteps,
  ...installSteps,
  ...systemSteps,
  ...bootSteps,
  ...finishSteps,
]
