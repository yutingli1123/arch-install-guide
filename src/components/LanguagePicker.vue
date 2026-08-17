<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Locale } from '@/guide/types'
import { localeNames, pick, ui } from '@/guide/ui'

const props = defineProps<{ modelValue: Locale }>()
// Not defineModel: picking the language already shown still has to notify, because that
// records an explicit choice even when the value does not change.
const emit = defineEmits<{ 'update:modelValue': [Locale] }>()
const locale = computed(() => props.modelValue)
const open = ref(false)
const root = ref<HTMLElement>()
const locales = Object.keys(localeNames) as Locale[]
const label = computed(() => pick(ui.language, locale.value))

function choose(value: Locale) {
  emit('update:modelValue', value)
  open.value = false
  ;(root.value?.firstElementChild as HTMLElement | undefined)?.focus()
}

/** Closes once the focus leaves the whole control, so a click elsewhere dismisses it. */
function closeOnLeave(event: FocusEvent) {
  const next = event.relatedTarget as Node | null
  open.value = next !== null && (root.value?.contains(next) ?? false)
}

/** Moves through the list with the arrow keys while the button keeps the focus. */
function step(offset: number) {
  open.value = true
  const next = locales[(locales.indexOf(locale.value) + offset + locales.length) % locales.length]
  if (next) emit('update:modelValue', next)
}
</script>

<template>
  <div ref="root" class="language-picker no-print" @focusout="closeOnLeave">
    <button
      type="button"
      name="language"
      :aria-label="label"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="open = !open"
      @keydown.down.prevent="step(1)"
      @keydown.up.prevent="step(-1)"
      @keydown.esc="open = false"
    >
      {{ localeNames[locale] }}
    </button>
    <ul v-if="open" role="listbox" :aria-label="label">
      <li
        v-for="(name, value) in localeNames"
        :key="value"
        role="option"
        :aria-selected="value === locale"
        :data-locale="value"
        tabindex="0"
        @click="choose(value)"
        @keydown.enter.prevent="choose(value)"
        @keydown.space.prevent="choose(value)"
        @keydown.esc="open = false"
      >
        {{ name }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.language-picker {
  position: relative;
  display: inline-flex;
}

button {
  /** Right side also holds the caret, so the label reads centered with less padding left. */
  padding: 0.35rem 1.6rem 0.35rem 0.9rem;
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

button:hover,
button:focus-visible {
  border-color: var(--accent);
  color: var(--accent);
}

/** Caret drawn in currentColor, so it follows the theme and the hover state. */
button::after {
  position: absolute;
  top: 50%;
  right: 0.75rem;
  width: 0.32rem;
  height: 0.32rem;
  border-right: 1px solid currentColor;
  border-bottom: 1px solid currentColor;
  content: '';
  transform: translateY(-70%) rotate(45deg);
  pointer-events: none;
}

ul {
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  z-index: 1;
  min-width: 100%;
  margin: 0;
  padding: 0.25rem;
  border: 1px solid var(--rule);
  border-radius: 8px;
  background: var(--bg);
  box-shadow: 0 6px 18px color-mix(in srgb, var(--fg) 12%, transparent);
  list-style: none;
}

li {
  padding: 0.3rem 0.7rem;
  border-radius: 5px;
  color: var(--muted);
  font-size: 0.8rem;
  white-space: nowrap;
  cursor: pointer;
}

li[aria-selected='true'] {
  color: var(--accent);
}

li:hover,
li:focus-visible {
  outline: none;
  background: var(--code-bg);
  color: var(--accent);
}
</style>
