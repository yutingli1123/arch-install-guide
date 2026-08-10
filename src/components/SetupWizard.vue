<script setup lang="ts">
import { computed } from 'vue'
import { validate, type ConfigChoice } from '@/guide/config'
import type { Config, Locale } from '@/guide/types'
import { choices, pick, ui } from '@/guide/ui'

const props = defineProps<{
  locale: Locale
  summary: { label: string; value: string }[]
}>()
const emit = defineEmits<{ finish: []; cancel: [] }>()
const model = defineModel<Config>({ required: true })
const step = defineModel<number>('step', { required: true })

const titles = computed(() => [
  pick(ui.installationTarget, props.locale),
  pick(ui.storage, props.locale),
  pick(ui.baseSystem, props.locale),
  pick(ui.review, props.locale),
])
const unavailable = computed(() => validate(model.value))
const reason = (choice: ConfigChoice) => unavailable.value[choice]

type TextField = 'disk' | 'timezone' | 'systemLocale' | 'keymap' | 'hostname' | 'username'
type SelectField = 'cpu' | 'swap' | 'subvolumeLayout' | 'secureBoot' | 'snapper' | 'desktop'

function commitText(field: TextField, event: Event) {
  const input = event.currentTarget as HTMLInputElement
  if (!input.reportValidity()) {
    input.value = model.value[field]
    return
  }
  model.value = { ...model.value, [field]: input.value }
}

function commitSelect(field: SelectField, event: Event) {
  const select = event.currentTarget as HTMLSelectElement
  model.value = { ...model.value, [field]: select.value } as Config
}

function advance() {
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
      <ol aria-label="配置进度">
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
        <label>
          <span>{{ pick(ui.targetDisk, props.locale) }}</span>
          <input
            name="disk"
            required
            pattern="/dev/(nvme[0-9]+n[0-9]+|mmcblk[0-9]+|loop[0-9]+|md[0-9]+|(sd|vd|xvd|hd)[a-z]+)"
            :value="model.disk"
            @change="commitText('disk', $event)"
          />
        </label>

        <label>
          <span>{{ pick(ui.cpu, props.locale) }}</span>
          <select name="cpu" :value="model.cpu" @change="commitSelect('cpu', $event)">
            <option value="intel">{{ pick(choices.cpu.intel, props.locale) }}</option>
            <option value="amd">{{ pick(choices.cpu.amd, props.locale) }}</option>
          </select>
        </label>
      </fieldset>

      <fieldset v-else-if="step === 1">
        <label>
          <span>{{ pick(ui.subvolumes, props.locale) }}</span>
          <select
            name="subvolumeLayout"
            :value="model.subvolumeLayout"
            @change="commitSelect('subvolumeLayout', $event)"
          >
            <option value="root-only">
              {{ pick(choices.subvolumeLayout['root-only'], props.locale) }}
            </option>
            <option value="separated">
              {{ pick(choices.subvolumeLayout.separated, props.locale) }}
            </option>
          </select>
        </label>

        <label>
          <span>{{ pick(ui.swap, props.locale) }}</span>
          <select name="swap" :value="model.swap" @change="commitSelect('swap', $event)">
            <option value="none">{{ pick(choices.swap.none, props.locale) }}</option>
            <option value="zram" :disabled="Boolean(reason('swap.zram'))">
              {{ pick(choices.swap.zram, props.locale) }}
            </option>
            <option value="swapfile" :disabled="Boolean(reason('swap.swapfile'))">
              {{ pick(choices.swap.swapfile, props.locale) }}
            </option>
            <option value="partition" :disabled="Boolean(reason('swap.partition'))">
              {{ pick(choices.swap.partition, props.locale) }}
            </option>
          </select>
          <small>{{ reason('swap.zram') }}</small>
        </label>

        <label>
          <span>{{ pick(ui.encryption, props.locale) }}</span>
          <select name="encryption" value="none">
            <option value="none">{{ pick(choices.encryption.none, props.locale) }}</option>
            <option value="password" :disabled="Boolean(reason('encryption.password'))">
              {{ pick(choices.encryption.password, props.locale) }}
            </option>
            <option value="tpm2-pin" :disabled="Boolean(reason('encryption.tpm2-pin'))">
              {{ pick(choices.encryption['tpm2-pin'], props.locale) }}
            </option>
          </select>
          <small>{{ reason('encryption.password') }}</small>
        </label>

        <label>
          <span>{{ pick(ui.secureBoot, props.locale) }}</span>
          <select
            name="secureBoot"
            :value="model.secureBoot"
            @change="commitSelect('secureBoot', $event)"
          >
            <option value="none">{{ pick(choices.secureBoot.none, props.locale) }}</option>
            <option value="custom-db" :disabled="Boolean(reason('secureBoot.custom-db'))">
              {{ pick(choices.secureBoot['custom-db'], props.locale) }}
            </option>
            <option value="shim-mok" :disabled="Boolean(reason('secureBoot.shim-mok'))">
              {{ pick(choices.secureBoot['shim-mok'], props.locale) }}
            </option>
          </select>
          <small>{{ reason('secureBoot.custom-db') }}</small>
        </label>

        <label>
          <span>{{ pick(ui.snapper, props.locale) }}</span>
          <select name="snapper" :value="model.snapper" @change="commitSelect('snapper', $event)">
            <option value="none">{{ pick(choices.snapper.none, props.locale) }}</option>
            <option value="root" :disabled="Boolean(reason('snapper.root'))">
              {{ pick(choices.snapper.root, props.locale) }}
            </option>
            <option value="root-home" :disabled="Boolean(reason('snapper.root-home'))">
              {{ pick(choices.snapper['root-home'], props.locale) }}
            </option>
          </select>
          <small>{{ reason('snapper.root') }}</small>
        </label>
      </fieldset>

      <fieldset v-else-if="step === 2">
        <label>
          <span>{{ pick(ui.timezone, props.locale) }}</span>
          <input
            name="timezone"
            required
            pattern="[A-Za-z0-9._+\-]+(/[A-Za-z0-9._+\-]+)*"
            :value="model.timezone"
            @change="commitText('timezone', $event)"
          />
        </label>

        <label>
          <span>{{ pick(ui.systemLocale, props.locale) }}</span>
          <input
            name="systemLocale"
            required
            pattern="[A-Za-z0-9_.@\-]+"
            :value="model.systemLocale"
            @change="commitText('systemLocale', $event)"
          />
        </label>

        <label>
          <span>{{ pick(ui.keymap, props.locale) }}</span>
          <input
            name="keymap"
            required
            pattern="[A-Za-z0-9_\-]+"
            :value="model.keymap"
            @change="commitText('keymap', $event)"
          />
        </label>

        <label>
          <span>{{ pick(ui.hostname, props.locale) }}</span>
          <input
            name="hostname"
            required
            pattern="[A-Za-z0-9][A-Za-z0-9.\-]*[A-Za-z0-9]|[A-Za-z0-9]"
            :value="model.hostname"
            @change="commitText('hostname', $event)"
          />
        </label>

        <label>
          <span>{{ pick(ui.username, props.locale) }}</span>
          <input
            name="username"
            required
            maxlength="32"
            pattern="(?!root$)[a-z_][a-z0-9_\-]*"
            :value="model.username"
            @change="commitText('username', $event)"
          />
        </label>

        <label>
          <span>{{ pick(ui.desktop, props.locale) }}</span>
          <select name="desktop" :value="model.desktop" @change="commitSelect('desktop', $event)">
            <option value="none">{{ pick(choices.desktop.none, props.locale) }}</option>
            <option value="gnome" :disabled="Boolean(reason('desktop.gnome'))">
              {{ pick(choices.desktop.gnome, props.locale) }}
            </option>
            <option value="kde" :disabled="Boolean(reason('desktop.kde'))">
              {{ pick(choices.desktop.kde, props.locale) }}
            </option>
            <option value="hyprland" :disabled="Boolean(reason('desktop.hyprland'))">
              {{ pick(choices.desktop.hyprland, props.locale) }}
            </option>
          </select>
          <small>{{ reason('desktop.gnome') }}</small>
        </label>
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
  grid-template-columns: repeat(4, 1fr);
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

label {
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
