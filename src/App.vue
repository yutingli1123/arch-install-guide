<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import GuideDoc from './components/GuideDoc.vue'
import SetupWizard from './components/SetupWizard.vue'
import { VERIFIED_AGAINST, completeConfig, parseDraft, serializeDraft } from './guide/config'
import { selectSteps } from './guide/render'
import type { ConfigDraft, Locale } from './guide/types'
import { choices, pick, ui } from './guide/ui'

function firstIncompleteStep(draft: ConfigDraft): number {
  if (!draft.disk || !draft.cpu) return 0
  if (
    !draft.subvolumeLayout ||
    !draft.swap ||
    !draft.encryption ||
    !draft.secureBoot ||
    !draft.snapper
  )
    return 1
  if (!draft.timezone || !draft.systemLocale) return 2
  if (!draft.keymap) return 3
  if (!draft.hostname || !draft.username || !draft.desktop) return 4
  return 5
}

const locale = ref<Locale>('zh')
const initialParams = new URLSearchParams(window.location.search)
const initialStep = Number(initialParams.get('step'))
const draft = ref<ConfigDraft>(parseDraft(window.location.search))
const config = computed(() => completeConfig(draft.value))
const requestedGuide = initialParams.get('step') === 'guide'
const screen = ref<'welcome' | 'configure' | 'guide'>(
  requestedGuide && config.value
    ? 'guide'
    : requestedGuide || (Number.isInteger(initialStep) && initialStep >= 1 && initialStep <= 6)
      ? 'configure'
      : 'welcome',
)
const wizardStep = ref(
  initialStep >= 1 && initialStep <= 6 ? initialStep - 1 : firstIncompleteStep(draft.value),
)

watch(
  [draft, screen, wizardStep],
  ([value, currentScreen, currentStep]) => {
    const params =
      currentScreen === 'welcome'
        ? new URLSearchParams()
        : new URLSearchParams(serializeDraft(value))

    if (currentScreen === 'configure') params.set('step', String(currentStep + 1))
    if (currentScreen === 'guide') params.set('step', 'guide')

    const query = params.toString()
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
    )
  },
  { deep: true, immediate: true },
)

const printPage = () => window.print()
const startConfiguration = () => {
  wizardStep.value = 0
  screen.value = 'configure'
}
const showGuide = () => {
  if (config.value) screen.value = 'guide'
  else wizardStep.value = firstIncompleteStep(draft.value)
}
const editConfiguration = () => {
  wizardStep.value = 5
  screen.value = 'configure'
}

const total = computed(() => (config.value ? selectSteps(config.value).length : 0))

const summary = computed(() => {
  const cfg = config.value
  if (!cfg) return []
  const disabled = pick(ui.disabled, locale.value)
  const none = pick(ui.none, locale.value)
  const items = [
    { label: pick(ui.targetDisk, locale.value), value: cfg.disk },
    { label: pick(ui.cpu, locale.value), value: pick(choices.cpu[cfg.cpu], locale.value) },
    { label: pick(ui.swap, locale.value), value: pick(choices.swap[cfg.swap], locale.value) },
    {
      label: pick(ui.subvolumes, locale.value),
      value: pick(choices.subvolumeLayout[cfg.subvolumeLayout], locale.value),
    },
    {
      label: pick(ui.encryption, locale.value),
      value: cfg.encryption.mode === 'luks2' ? 'LUKS2' : disabled,
    },
    {
      label: pick(ui.secureBoot, locale.value),
      value: pick(choices.secureBoot[cfg.secureBoot], locale.value),
    },
    {
      label: pick(ui.snapper, locale.value),
      value: pick(choices.snapper[cfg.snapper], locale.value),
    },
    {
      label: pick(ui.desktop, locale.value),
      value: pick(choices.desktop[cfg.desktop], locale.value),
    },
    { label: pick(ui.timezone, locale.value), value: cfg.timezone },
    { label: pick(ui.systemLocale, locale.value), value: cfg.systemLocale },
    { label: pick(ui.keymap, locale.value), value: cfg.keymap },
    { label: pick(ui.hostname, locale.value), value: cfg.hostname },
    { label: pick(ui.username, locale.value), value: cfg.username },
  ]

  if (cfg.encryption.mode === 'luks2') {
    items.splice(5, 0, {
      label: pick(ui.unlock, locale.value),
      value: cfg.encryption.unlock.method === 'tpm2' ? 'TPM2' : pick(ui.password, locale.value),
    })

    if (cfg.encryption.unlock.method === 'tpm2') {
      items.splice(
        6,
        0,
        {
          label: pick(ui.tpmPin, locale.value),
          value: cfg.encryption.unlock.pin ? pick(ui.enabled, locale.value) : disabled,
        },
        {
          label: pick(ui.hashPcrs, locale.value),
          value: cfg.encryption.unlock.hashPcrs.join('+') || none,
        },
        {
          label: pick(ui.signedPcrs, locale.value),
          value: cfg.encryption.unlock.signedPcrs.join('+') || none,
        },
      )
    }
  }

  return items
})
</script>

<template>
  <main v-if="screen === 'welcome'" class="welcome">
    <h1>{{ pick(ui.title, locale) }}</h1>
    <h2>{{ pick(ui.welcomeTitle, locale) }}</h2>
    <p>{{ pick(ui.welcomeBody, locale) }}</p>
    <button class="primary" data-action="start" type="button" @click="startConfiguration">
      {{ pick(ui.start, locale) }}
    </button>
  </main>

  <SetupWizard
    v-else-if="screen === 'configure'"
    v-model="draft"
    v-model:step="wizardStep"
    :locale="locale"
    :summary="summary"
    @cancel="screen = 'welcome'"
    @finish="showGuide"
  />

  <template v-else-if="config">
    <header>
      <div class="row">
        <h1>{{ pick(ui.title, locale) }}</h1>
        <div class="header-actions no-print">
          <button data-action="edit" type="button" @click="editConfiguration">
            {{ pick(ui.editConfig, locale) }}
          </button>
          <button type="button" @click="printPage">
            {{ pick(ui.print, locale) }}
          </button>
        </div>
      </div>
      <div class="config-summary">
        <p class="summary-title">{{ pick(ui.configSummary, locale) }}</p>
        <ul class="summary">
          <li v-for="item in summary" :key="item.label">
            <span>{{ item.label }}</span>
            {{ item.value }}
          </li>
        </ul>
      </div>
      <p class="meta">
        {{ pick(ui.stepCount, locale)(total) }}
      </p>
    </header>

    <GuideDoc :config="config" :locale="locale" />

    <footer>
      <p>
        {{ pick(ui.verifiedAgainst, locale) }} {{ VERIFIED_AGAINST }} ·
        {{ pick(ui.disclaimer, locale) }}
      </p>
    </footer>
  </template>
</template>

<style scoped>
.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.welcome {
  display: grid;
  justify-items: start;
  align-content: center;
  min-height: 75vh;
}

.welcome h2 {
  max-width: 32rem;
  margin: 2rem 0 0;
  font-size: 2.4rem;
  line-height: 1.2;
  letter-spacing: -0.03em;
}

.welcome p {
  max-width: 34rem;
  margin: 1rem 0 0;
  color: var(--muted);
}

.welcome .primary {
  margin-top: 1.5rem;
  border-color: var(--accent);
  background: var(--accent);
  color: white;
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

.summary li span {
  margin-right: 0.35rem;
  color: var(--faint);
  font-family: var(--sans);
}

footer {
  margin-top: 5rem;
  padding-top: 1.2rem;
  border-top: 1px solid var(--rule);
  color: var(--faint);
  font-size: 0.78rem;
}

.summary-title {
  margin: 0;
  color: var(--muted);
  font-weight: 600;
}

.config-summary {
  margin-top: 1.2rem;
}

.config-summary .summary {
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
