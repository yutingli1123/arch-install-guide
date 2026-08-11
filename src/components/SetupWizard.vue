<script setup lang="ts">
import { computed } from 'vue'
import ChoicePicker from '@/components/ChoicePicker.vue'
import { KEYMAPS, SYSTEM_LOCALES, TIMEZONES, validate, type ConfigChoice } from '@/guide/config'
import type { ConfigDraft, Locale } from '@/guide/types'
import { choiceDescriptions, choices, pick, ui } from '@/guide/ui'

const props = defineProps<{
  locale: Locale
  summary: { label: string; value: string }[]
}>()
const emit = defineEmits<{ finish: []; cancel: [] }>()
const model = defineModel<ConfigDraft>({ required: true })
const step = defineModel<number>('step', { required: true })

const titles = computed(() => [
  pick(ui.installationTarget, props.locale),
  pick(ui.storage, props.locale),
  pick(ui.regionLanguage, props.locale),
  pick(ui.keymap, props.locale),
  pick(ui.baseSystem, props.locale),
  pick(ui.review, props.locale),
])
const unavailable = computed(() => validate(model.value))
const reason = (choice: ConfigChoice) => unavailable.value[choice]
const unavailableReason = (choice: ConfigChoice) => {
  const message = reason(choice)
  return message ? `${pick(ui.unavailable, props.locale)}：${message}` : undefined
}

const cpuOptions = computed(() => [
  {
    value: 'intel',
    label: pick(choices.cpu.intel, props.locale),
    description: pick(choiceDescriptions.cpu.intel, props.locale),
  },
  {
    value: 'amd',
    label: pick(choices.cpu.amd, props.locale),
    description: pick(choiceDescriptions.cpu.amd, props.locale),
  },
])
const subvolumeOptions = computed(() => [
  {
    value: 'root-only',
    label: pick(choices.subvolumeLayout['root-only'], props.locale),
    description: pick(choiceDescriptions.subvolumeLayout['root-only'], props.locale),
  },
  {
    value: 'separated',
    label: pick(choices.subvolumeLayout.separated, props.locale),
    description: pick(choiceDescriptions.subvolumeLayout.separated, props.locale),
  },
])
const swapOptions = computed(() => [
  {
    value: 'none',
    label: pick(choices.swap.none, props.locale),
    description: pick(choiceDescriptions.swap.none, props.locale),
  },
  ...(['zram', 'swapfile', 'partition'] as const).map((value) => ({
    value,
    label: pick(choices.swap[value], props.locale),
    description: pick(choiceDescriptions.swap[value], props.locale),
    disabledReason: unavailableReason(`swap.${value}`),
  })),
])
const encryptionOptions = computed(() => [
  {
    value: 'none',
    label: pick(choices.encryption.none, props.locale),
    description: pick(choiceDescriptions.encryption.none, props.locale),
  },
  ...(['password', 'tpm2-pin'] as const).map((value) => ({
    value,
    label: pick(choices.encryption[value], props.locale),
    description: pick(choiceDescriptions.encryption[value], props.locale),
    disabledReason: unavailableReason(`encryption.${value}`),
  })),
])
const secureBootOptions = computed(() => [
  {
    value: 'none',
    label: pick(choices.secureBoot.none, props.locale),
    description: pick(choiceDescriptions.secureBoot.none, props.locale),
  },
  ...(['custom-db', 'shim-mok'] as const).map((value) => ({
    value,
    label: pick(choices.secureBoot[value], props.locale),
    description: pick(choiceDescriptions.secureBoot[value], props.locale),
    disabledReason: unavailableReason(`secureBoot.${value}`),
  })),
])
const snapperOptions = computed(() => [
  {
    value: 'none',
    label: pick(choices.snapper.none, props.locale),
    description: pick(choiceDescriptions.snapper.none, props.locale),
  },
  ...(['root', 'root-home'] as const).map((value) => ({
    value,
    label: pick(choices.snapper[value], props.locale),
    description: pick(choiceDescriptions.snapper[value], props.locale),
    disabledReason: unavailableReason(`snapper.${value}`),
  })),
])
const desktopOptions = computed(() => [
  {
    value: 'none',
    label: pick(choices.desktop.none, props.locale),
    description: pick(choiceDescriptions.desktop.none, props.locale),
  },
  ...(['gnome', 'kde', 'hyprland'] as const).map((value) => ({
    value,
    label: pick(choices.desktop[value], props.locale),
    description: pick(choiceDescriptions.desktop[value], props.locale),
    disabledReason: unavailableReason(`desktop.${value}`),
  })),
])

type TextField = 'disk' | 'hostname' | 'username'
type ChoiceField = Exclude<keyof ConfigDraft, 'encryption'>
type SelectField = 'timezone' | 'systemLocale' | 'keymap'

function commitText(field: TextField, event: Event) {
  const input = event.currentTarget as HTMLInputElement
  if (!input.reportValidity()) {
    input.value = model.value[field] ?? ''
    return
  }
  model.value = { ...model.value, [field]: input.value }
}

function commitSelect(field: SelectField, event: Event) {
  const select = event.currentTarget as HTMLSelectElement
  model.value = { ...model.value, [field]: select.value } as ConfigDraft
}

function commitChoice(field: ChoiceField, value: string | undefined) {
  if (value !== undefined) model.value = { ...model.value, [field]: value } as ConfigDraft
}

function commitEncryption(value: string | undefined) {
  if (value === 'none') model.value = { ...model.value, encryption: { mode: 'none' } }
}

function advance(event: Event) {
  const form = event.currentTarget as HTMLFormElement
  if (!form.reportValidity()) return
  if (step.value === titles.value.length - 1) emit('finish')
  else step.value += 1
}
</script>

<template>
  <main class="wizard">
    <header>
      <p class="product">{{ pick(ui.title, props.locale) }}</p>
      <p class="progress">
        {{ pick(ui.wizardProgress, props.locale)(step + 1, titles.length) }}
      </p>
      <h1>{{ titles[step] }}</h1>
      <ol aria-label="配置进度" :style="{ gridTemplateColumns: `repeat(${titles.length}, 1fr)` }">
        <li
          v-for="(title, index) in titles"
          :key="title"
          :class="{ complete: index < step }"
          :aria-current="index === step ? 'step' : undefined"
        >
          <span>{{ index + 1 }}</span>
          {{ title }}
        </li>
      </ol>
    </header>

    <form @submit.prevent="advance">
      <fieldset v-if="step === 0">
        <aside class="tutorial">
          <h2>{{ pick(ui.diskTutorial, props.locale) }}</h2>
          <p>{{ pick(ui.diskTutorialBody, props.locale) }}</p>
          <pre><code>lsblk</code></pre>
          <p class="warning">{{ pick(ui.diskEraseWarning, props.locale) }}</p>
        </aside>

        <label>
          <span>{{ pick(ui.targetDisk, props.locale) }}</span>
          <input
            name="disk"
            required
            pattern="/dev/(nvme[0-9]+n[0-9]+|mmcblk[0-9]+|loop[0-9]+|md[0-9]+|(sd|vd|xvd|hd)[a-z]+)"
            :value="model.disk ?? ''"
            @change="commitText('disk', $event)"
          />
        </label>

        <div class="field">
          <span>{{ pick(ui.cpu, props.locale) }}</span>
          <ChoicePicker
            name="cpu"
            :model-value="model.cpu"
            :options="cpuOptions"
            @update:model-value="commitChoice('cpu', $event)"
          />
        </div>
      </fieldset>

      <fieldset v-else-if="step === 1">
        <div class="field">
          <span>{{ pick(ui.subvolumes, props.locale) }}</span>
          <ChoicePicker
            name="subvolumeLayout"
            :model-value="model.subvolumeLayout"
            :options="subvolumeOptions"
            @update:model-value="commitChoice('subvolumeLayout', $event)"
          />
        </div>

        <div class="field">
          <span>{{ pick(ui.swap, props.locale) }}</span>
          <ChoicePicker
            name="swap"
            :model-value="model.swap"
            :options="swapOptions"
            @update:model-value="commitChoice('swap', $event)"
          />
        </div>

        <div class="field">
          <span>{{ pick(ui.encryption, props.locale) }}</span>
          <ChoicePicker
            name="encryption"
            :model-value="model.encryption?.mode"
            :options="encryptionOptions"
            @update:model-value="commitEncryption"
          />
        </div>

        <div class="field">
          <span>{{ pick(ui.secureBoot, props.locale) }}</span>
          <ChoicePicker
            name="secureBoot"
            :model-value="model.secureBoot"
            :options="secureBootOptions"
            @update:model-value="commitChoice('secureBoot', $event)"
          />
        </div>

        <div class="field">
          <span>{{ pick(ui.snapper, props.locale) }}</span>
          <ChoicePicker
            name="snapper"
            :model-value="model.snapper"
            :options="snapperOptions"
            @update:model-value="commitChoice('snapper', $event)"
          />
        </div>
      </fieldset>

      <fieldset v-else-if="step === 2">
        <label>
          <span>{{ pick(ui.timezone, props.locale) }}</span>
          <select
            name="timezone"
            required
            :value="model.timezone ?? ''"
            @change="commitSelect('timezone', $event)"
          >
            <option value="" disabled>{{ pick(ui.selectPlaceholder, props.locale) }}</option>
            <option v-for="timezone in TIMEZONES" :key="timezone" :value="timezone">
              {{ timezone }}
            </option>
          </select>
          <small>{{ pick(ui.timezoneHint, props.locale) }}</small>
        </label>
        <label>
          <span>{{ pick(ui.systemLocale, props.locale) }}</span>
          <select
            name="systemLocale"
            required
            :value="model.systemLocale ?? ''"
            @change="commitSelect('systemLocale', $event)"
          >
            <option value="" disabled>{{ pick(ui.selectPlaceholder, props.locale) }}</option>
            <option v-for="value in SYSTEM_LOCALES" :key="value" :value="value">
              {{ pick(choices.systemLocale[value], props.locale) }} — {{ value }}
            </option>
          </select>
          <small>{{ pick(ui.systemLocaleHint, props.locale) }}</small>
        </label>
      </fieldset>

      <fieldset v-else-if="step === 3" class="single">
        <label>
          <span>{{ pick(ui.keymap, props.locale) }}</span>
          <select
            name="keymap"
            required
            :value="model.keymap ?? ''"
            @change="commitSelect('keymap', $event)"
          >
            <option value="" disabled>{{ pick(ui.selectPlaceholder, props.locale) }}</option>
            <option v-for="value in KEYMAPS" :key="value" :value="value">
              {{ pick(choices.keymap[value], props.locale) }} — {{ value }}
            </option>
          </select>
          <small>{{ pick(ui.keymapHint, props.locale) }}</small>
        </label>
      </fieldset>

      <fieldset v-else-if="step === 4">
        <label>
          <span>{{ pick(ui.hostname, props.locale) }}</span>
          <input
            name="hostname"
            required
            pattern="[A-Za-z0-9][A-Za-z0-9.\-]*[A-Za-z0-9]|[A-Za-z0-9]"
            :value="model.hostname ?? ''"
            @change="commitText('hostname', $event)"
          />
          <small class="description">{{ pick(ui.hostnameHint, props.locale) }}</small>
        </label>

        <label>
          <span>{{ pick(ui.username, props.locale) }}</span>
          <input
            name="username"
            required
            maxlength="32"
            pattern="(?!root$)[a-z_][a-z0-9_\-]*"
            :value="model.username ?? ''"
            @change="commitText('username', $event)"
          />
          <small class="description">{{ pick(ui.usernameHint, props.locale) }}</small>
        </label>

        <div class="field">
          <span>{{ pick(ui.desktop, props.locale) }}</span>
          <ChoicePicker
            name="desktop"
            :model-value="model.desktop"
            :options="desktopOptions"
            @update:model-value="commitChoice('desktop', $event)"
          />
        </div>
      </fieldset>

      <section v-else class="review">
        <ul>
          <li v-for="item in props.summary" :key="item.label">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </li>
        </ul>
      </section>

      <div class="actions">
        <button v-if="step > 0" type="button" @click="step -= 1">
          {{ pick(ui.previous, props.locale) }}
        </button>
        <button v-else type="button" @click="emit('cancel')">
          {{ pick(ui.backToWelcome, props.locale) }}
        </button>
        <button class="primary" type="submit">
          {{
            step === titles.length - 1
              ? pick(ui.generateGuide, props.locale)
              : pick(ui.next, props.locale)
          }}
        </button>
      </div>
    </form>

    <p class="url-note">{{ pick(ui.urlSync, props.locale) }}</p>
  </main>
</template>

<style scoped>
.wizard {
  padding-top: 1.5rem;
}

.product,
.progress,
.url-note {
  color: var(--faint);
  font-size: 0.76rem;
}

.product {
  margin: 0;
  color: var(--accent);
  font-weight: 650;
}

.progress {
  margin: 1.5rem 0 0.2rem;
}

h1 {
  margin: 0;
  font-size: 2rem;
}

ol {
  display: grid;
  gap: 0.5rem;
  margin: 1.75rem 0 0;
  padding: 0;
  list-style: none;
}

ol li {
  display: grid;
  gap: 0.3rem;
  padding-top: 0.55rem;
  border-top: 2px solid var(--rule);
  color: var(--faint);
  font-size: 0.72rem;
}

ol li span {
  font-family: var(--mono);
}

ol li.complete,
ol li[aria-current='step'] {
  border-color: var(--accent);
  color: var(--fg);
}

form {
  margin-top: 2rem;
  padding: 1.25rem;
  border: 1px solid var(--rule);
  border-radius: 10px;
  background: var(--code-bg);
}

fieldset {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

fieldset.single {
  grid-template-columns: 1fr;
}

.tutorial {
  grid-column: 1 / -1;
  padding: 0.9rem 1rem;
  border-left: 3px solid var(--accent);
  background: var(--bg);
}

.tutorial h2 {
  margin: 0;
  font-size: 0.9rem;
}

.tutorial p {
  margin: 0.55rem 0 0;
  color: var(--muted);
  font-size: 0.78rem;
}

.tutorial pre {
  margin: 0.7rem 0 0;
  padding: 0.6rem 0.75rem;
  border-radius: 5px;
  background: var(--code-bg);
}

.tutorial .warning {
  color: var(--warn);
  font-weight: 600;
}

label,
.field {
  display: grid;
  align-content: start;
  gap: 0.3rem;
  color: var(--muted);
  font-size: 0.78rem;
}

input,
select {
  width: 100%;
  min-width: 0;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--rule);
  border-radius: 5px;
  background: var(--bg);
  color: var(--fg);
  font: inherit;
  font-family: var(--mono);
}

input:focus,
select:focus {
  border-color: var(--accent);
  outline: 2px solid color-mix(in srgb, var(--accent) 20%, transparent);
}

small {
  color: var(--faint);
  font-size: 0.7rem;
  line-height: 1.4;
}

small.description {
  color: var(--muted);
}

.review ul {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem 1.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.review li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.45rem;
  border-bottom: 1px solid var(--rule);
  font-size: 0.78rem;
}

.review li span {
  color: var(--muted);
}

.review li strong {
  font-family: var(--mono);
  font-weight: 500;
  text-align: right;
}

.actions {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--rule);
  border-radius: 999px;
  background: var(--bg);
  color: var(--muted);
  font: inherit;
  cursor: pointer;
}

button.primary {
  border-color: var(--accent);
  background: var(--accent);
  color: white;
}

.url-note {
  margin: 0.75rem 0 0;
  text-align: center;
}

@media (max-width: 38rem) {
  fieldset,
  .review ul {
    grid-template-columns: 1fr;
  }

  ol li {
    font-size: 0;
  }

  ol li span {
    font-size: 0.72rem;
  }
}
</style>
