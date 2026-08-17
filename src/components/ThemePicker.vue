<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Locale } from '@/guide/types'
import { pick, ui } from '@/guide/ui'

type Theme = 'auto' | 'light' | 'dark'

const THEMES: readonly Theme[] = ['auto', 'light', 'dark']
const STORAGE_KEY = 'theme'

const props = defineProps<{ locale: Locale }>()
const stored = localStorage.getItem(STORAGE_KEY)
const theme = ref<Theme>(stored === 'light' || stored === 'dark' ? stored : 'auto')
const label = computed(() => pick(ui.theme, props.locale))
const names = computed<Record<Theme, string>>(() => ({
  auto: pick(ui.themeAuto, props.locale),
  light: pick(ui.themeLight, props.locale),
  dark: pick(ui.themeDark, props.locale),
}))

apply(theme.value)

function apply(value: Theme) {
  if (value === 'auto') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = value
}

function set(value: Theme) {
  theme.value = value
  apply(value)
  if (value === 'auto') localStorage.removeItem(STORAGE_KEY)
  else localStorage.setItem(STORAGE_KEY, value)
}
</script>

<template>
  <div class="theme-picker no-print" role="group" :aria-label="label">
    <button
      v-for="value in THEMES"
      :key="value"
      type="button"
      :aria-pressed="value === theme"
      :aria-label="names[value]"
      :title="names[value]"
      :data-theme-option="value"
      @click="set(value)"
    >
      <svg
        v-if="value === 'auto'"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
      <svg
        v-else-if="value === 'light'"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path
          d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        />
      </svg>
      <svg
        v-else
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
/** Buttons stretch to the full inner height: the gap around them stays the padding on every
    side, and two 999px pills nested that way share one center of curvature. */
.theme-picker {
  display: inline-flex;
  padding: 0.15rem;
  border: 1px solid var(--rule);
  border-radius: 999px;
}

button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.55rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--faint);
  cursor: pointer;
  transition:
    background-color 0.15s,
    color 0.15s;
}

button:hover {
  color: var(--accent);
}

button:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 40%, transparent);
}

button[aria-pressed='true'] {
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--accent);
}

svg {
  width: 0.95rem;
  height: 0.95rem;
}
</style>
