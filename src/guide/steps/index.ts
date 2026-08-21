import type { ProseKey } from '../i18n'
import type { Step } from '../types'
import { liveSteps } from './live'
import { diskSteps } from './disk'
import { installSteps } from './install'
import { systemSteps } from './system'
import { storageSteps } from './storage'
import { bootSteps } from './boot'
import { desktopSteps } from './desktop'
import { hyprlandSteps } from './hyprland'
import { finishSteps } from './finish'

export const sectionTitles: Record<string, ProseKey> = {
  live: 'section.live',
  disk: 'section.disk',
  install: 'section.install',
  system: 'section.system',
  storage: 'section.storage',
  boot: 'section.boot',
  desktop: 'section.desktop',
  hyprland: 'section.hyprland',
  finish: 'section.finish',
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
