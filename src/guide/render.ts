import { derive } from './derive'
import { createMarkdown } from './markdown'
import { sectionTitles, steps } from './steps'
import type { Config, Locale, Step } from './types'
import { pick, ui } from './ui'

export type RenderedStep = {
  id: string
  /** Continuous across sections, so a printed copy can be read as "step n of total". */
  number: number
  title: string
  html: string
}

export type RenderedSection = {
  id: string
  title: string
  steps: RenderedStep[]
}

export function selectSteps(cfg: Config): Step[] {
  return steps.filter((step) => !step.when || step.when(cfg))
}

export function renderGuide(cfg: Config, locale: Locale): RenderedSection[] {
  const ctx = derive(cfg)
  const md = createMarkdown(pick(ui.copy, locale))
  const sections: RenderedSection[] = []
  let number = 0

  for (const step of selectSteps(cfg)) {
    number += 1
    const rendered: RenderedStep = {
      id: step.id,
      number,
      title: pick(step.title, locale),
      html: step
        .body(ctx)
        .map((block) =>
          'cmd' in block
            ? md.render(`\`\`\`${block.lang ?? ''}\n${block.cmd}\n\`\`\``)
            : md.render(pick(block.prose, locale)),
        )
        .join(''),
    }

    const last = sections[sections.length - 1]
    if (last?.id === step.section) {
      last.steps.push(rendered)
    } else {
      sections.push({
        id: step.section,
        title: pick(sectionTitles[step.section] ?? { zh: step.section }, locale),
        steps: [rendered],
      })
    }
  }

  return sections
}
