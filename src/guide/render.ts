import { derive } from './derive'
import { createMarkdown } from './markdown'
import { pick, prose, ui, type ProseKey } from './i18n'
import { sectionTitles, steps } from './steps'
import type { Config, Locale, Step } from './types'

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
      title: prose(step.title as ProseKey, locale, ctx),
      html: step
        .body(ctx)
        .map((block) =>
          'cmd' in block
            ? md.render(`\`\`\`${block.lang ?? ''}\n${block.cmd}\n\`\`\``)
            : md.render(prose(block.key as ProseKey, locale, ctx)),
        )
        .join(''),
    }

    const last = sections[sections.length - 1]
    if (last?.id === step.section) {
      last.steps.push(rendered)
    } else {
      sections.push({
        id: step.section,
        title: sectionTitles[step.section]
          ? prose(sectionTitles[step.section]!, locale, ctx)
          : step.section,
        steps: [rendered],
      })
    }
  }

  return sections
}
