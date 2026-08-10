<script setup lang="ts">
import { computed } from 'vue'
import { renderGuide } from '../guide/render'
import type { Config, Locale } from '../guide/types'
import { pick, ui } from '../guide/ui'

const props = defineProps<{ config: Config; locale: Locale }>()

const sections = computed(() => renderGuide(props.config, props.locale))

const pad = (n: number) => String(n).padStart(2, '0')

/** Delegated so command blocks stay plain HTML from the markdown renderer. */
async function onClick(event: MouseEvent) {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.cmd-copy')
  if (!button) return

  await navigator.clipboard.writeText(button.dataset.copy ?? '')
  const label = button.textContent
  button.textContent = pick(ui.copied, props.locale)
  button.classList.add('is-copied')
  setTimeout(() => {
    button.textContent = label
    button.classList.remove('is-copied')
  }, 1200)
}
</script>

<template>
  <div class="guide" @click="onClick">
    <section v-for="section in sections" :key="section.id">
      <h2>{{ section.title }}</h2>
      <article v-for="step in section.steps" :key="step.id" :id="step.id">
        <span class="num" aria-hidden="true">{{ pad(step.number) }}</span>
        <h3>{{ step.title }}</h3>
        <!-- eslint-disable-next-line vue/no-v-html -- markdown-it output, html disabled at parse -->
        <div class="body" v-html="step.html" />
      </article>
    </section>
  </div>
</template>

<style scoped>
h2 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 4rem 0 0;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: var(--accent);
}

/** Rule fills the remaining measure, so sections read as dividers. */
h2::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--rule);
}

section:first-child h2 {
  margin-top: 2.75rem;
}

/**
 * Steps hang on a timeline: each article draws a segment of the left border and
 * spaces itself with padding, so adjacent segments join into a continuous line.
 */
article {
  --gap: 2.4rem;
  position: relative;
  margin-left: 0.95rem;
  padding: var(--gap) 0 0 2.1rem;
  border-left: 1px solid var(--rule);
}

section article:first-of-type {
  --gap: 1.6rem;
}

section article:last-of-type {
  padding-bottom: 0.5rem;
}

.num {
  position: absolute;
  top: calc(var(--gap) - 0.12rem);
  left: -0.95rem;
  display: grid;
  place-items: center;
  width: 1.9rem;
  height: 1.9rem;
  border: 1px solid var(--rule);
  border-radius: 50%;
  background: var(--bg);
  font-family: var(--mono);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
  transition:
    border-color 0.15s,
    color 0.15s;
}

article:hover .num {
  border-color: var(--accent);
  color: var(--accent);
}

h3 {
  margin: 0 0 0.5rem;
  font-size: 1.12rem;
  font-weight: 650;
  letter-spacing: -0.005em;
}

.body :deep(p),
.body :deep(ul),
.body :deep(table) {
  margin: 0.75rem 0;
}

.body :deep(li) {
  margin: 0.35rem 0;
}

.body :deep(strong) {
  color: var(--warn);
}

.body :deep(:not(pre) > code) {
  padding: 0.05em 0.3em;
  border-radius: 3px;
  background: var(--code-bg);
  font-size: 0.86em;
  color: var(--fg);
}

.body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
  line-height: 1.5;
}

.body :deep(th) {
  color: var(--muted);
  font-weight: 600;
}

.body :deep(th),
.body :deep(td) {
  padding: 0.4rem 0.7rem 0.4rem 0;
  border-bottom: 1px solid var(--rule);
  text-align: left;
  vertical-align: top;
}

.body :deep(tr:last-child td) {
  border-bottom: none;
}

.body :deep(.cmd) {
  position: relative;
  margin: 0.9rem 0;
  border: 1px solid var(--rule);
  border-radius: 8px;
  background: var(--code-bg);
  break-inside: avoid;
}

.body :deep(.cmd pre) {
  margin: 0;
  padding: 0.85rem 1.05rem;
  overflow-x: auto;
}

.body :deep(.cmd code) {
  font-size: 0.85rem;
  line-height: 1.65;
}

.body :deep(.cmd-copy) {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  padding: 0.15rem 0.5rem;
  border: 1px solid var(--rule);
  border-radius: 999px;
  background: var(--bg);
  color: var(--muted);
  font: inherit;
  font-size: 0.7rem;
  line-height: 1.6;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.12s;
}

.body :deep(.cmd:hover .cmd-copy),
.body :deep(.cmd-copy:focus-visible),
.body :deep(.cmd-copy.is-copied) {
  opacity: 1;
}

.body :deep(.cmd-copy:hover) {
  color: var(--fg);
}

.body :deep(.cmd-copy.is-copied) {
  color: var(--accent);
}

@media (hover: none) {
  .body :deep(.cmd-copy) {
    opacity: 1;
  }
}

@media (max-width: 34rem) {
  article {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
  }

  .num {
    position: static;
    display: inline-grid;
    margin-bottom: 0.35rem;
  }
}

@media print {
  h2 {
    margin-top: 2rem;
    break-after: avoid;
    color: #000;
  }

  h3 {
    break-after: avoid;
  }

  article {
    --gap: 1.5rem;
  }

  section article:first-of-type {
    --gap: 1rem;
  }

  .body :deep(.cmd-copy) {
    display: none;
  }

  .body :deep(.cmd) {
    border: 1px solid var(--rule);
  }

  /** Paper cannot scroll: an overflowing command would print truncated. */
  .body :deep(.cmd pre) {
    overflow-x: visible;
  }

  .body :deep(.cmd code) {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
}
</style>
