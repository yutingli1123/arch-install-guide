<script setup lang="ts">
import { computed, ref } from 'vue'
import GuideDoc from './components/GuideDoc.vue'
import { VERIFIED_AGAINST, defaultConfig } from './guide/config'
import { derive } from './guide/derive'
import { selectSteps } from './guide/render'
import type { Locale } from './guide/types'
import { pick, ui } from './guide/ui'

const locale = ref<Locale>('zh')
const config = ref(defaultConfig)

const printPage = () => window.print()

const total = computed(() => selectSteps(config.value).length)

const summary = computed(() => {
  const ctx = derive(config.value)
  return [
    'UEFI',
    'btrfs',
    `${ctx.cfg.cpu}-ucode`,
    ctx.cfg.kernelImage === 'split' ? 'vmlinuz + initramfs' : 'UKI',
    'systemd-boot',
    ctx.cfg.disk,
  ]
})
</script>

<template>
  <header>
    <div class="row">
      <h1>{{ pick(ui.title, locale) }}</h1>
      <button class="no-print" type="button" @click="printPage">
        {{ pick(ui.print, locale) }}
      </button>
    </div>
    <p class="meta">
      {{ pick(ui.stepCount, locale)(total) }}
    </p>
  </header>

  <GuideDoc :config="config" :locale="locale" />

  <footer>
    <p class="footer-title">{{ pick(ui.configSummary, locale) }}</p>
    <ul class="summary">
      <li v-for="item in summary" :key="item">{{ item }}</li>
    </ul>
    <p>
      {{ pick(ui.verifiedAgainst, locale) }} {{ VERIFIED_AGAINST }} ·
      {{ pick(ui.disclaimer, locale) }}
    </p>
  </footer>
</template>

<style scoped>
.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/** Arch-blue triangle as a wordless logo mark. */
h1::before {
  content: '';
  display: inline-block;
  width: 0.72em;
  height: 0.66em;
  margin-right: 0.4em;
  background: linear-gradient(
    180deg,
    var(--accent),
    color-mix(in srgb, var(--accent) 65%, #135c8d)
  );
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}

button {
  flex: none;
  padding: 0.35rem 0.8rem;
  border: 1px solid var(--rule);
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s;
}

button:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.meta {
  margin: 0.5rem 0 0;
  color: var(--faint);
  font-size: 0.8rem;
}

.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.45rem;
  margin: 1.2rem 0 0;
  padding: 0;
  list-style: none;
}

.summary li {
  padding: 0.12rem 0.6rem;
  border: 1px solid var(--rule);
  border-radius: 999px;
  background: color-mix(in srgb, var(--code-bg) 55%, var(--bg));
  color: var(--muted);
  font-family: var(--mono);
  font-size: 0.74rem;
}

footer {
  margin-top: 5rem;
  padding-top: 1.2rem;
  border-top: 1px solid var(--rule);
  color: var(--faint);
  font-size: 0.78rem;
}

.footer-title {
  margin: 0;
  color: var(--muted);
  font-weight: 600;
}

footer .summary {
  margin-top: 0.75rem;
}

footer > :last-child {
  margin-bottom: 0;
}

@media print {
  .meta,
  .summary li {
    color: #444;
  }

  footer {
    margin-top: 2rem;
  }
}
</style>
