<script setup lang="ts">
import { computed } from 'vue'
import ChoicePicker from '@/components/ChoicePicker.vue'
import LanguagePicker from '@/components/LanguagePicker.vue'
import ThemePicker from '@/components/ThemePicker.vue'
import {
  HYPRLAND_ADDONS,
  HYPRLAND_CHOICES,
  KEYMAPS,
  MIRROR_COUNTRIES,
  NEW_HYPRLAND_DRAFT,
  SYSTEM_LOCALES,
  TIMEZONES,
  hyprlandAddonGroups,
  makeTpm2Encryption,
  orderAddons,
  tpm2Preset,
  validate,
  type ConfigChoice,
} from '@/guide/config'
import type {
  ConfigDraft,
  HyprlandAddon,
  HyprlandExtras,
  Locale,
  Localized,
  Tpm2Preset,
} from '@/guide/types'
import { choiceDescriptions, choices, pick, ui } from '@/guide/i18n'

const props = defineProps<{
  locale: Locale
  summary: { label: string; value: string }[]
}>()
const emit = defineEmits<{ finish: []; cancel: []; 'update:locale': [Locale] }>()
const model = defineModel<ConfigDraft>({ required: true })
const step = defineModel<number>('step', { required: true })
const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
const canUseDetectedTimezone = TIMEZONES.includes(detectedTimezone)
const sortedSystemLocales = [...SYSTEM_LOCALES].sort()
const mirrorCountryCodes = MIRROR_COUNTRIES.map(([code]) => code)
const isCjkSystemLocale = computed(() =>
  ['zh_CN.UTF-8', 'zh_TW.UTF-8', 'zh_HK.UTF-8', 'ja_JP.UTF-8', 'ko_KR.UTF-8'].includes(
    model.value.systemLocale ?? '',
  ),
)

const titles = computed(() => [
  pick(ui.regionLanguage, props.locale),
  pick(ui.keymap, props.locale),
  pick(ui.storage, props.locale),
  pick(ui.baseSystem, props.locale),
  pick(ui.installationTarget, props.locale),
  pick(ui.review, props.locale),
])
const unavailable = computed(() => validate(model.value))
const reason = (choice: ConfigChoice) => unavailable.value[choice]
const unavailableReason = (choice: ConfigChoice) => {
  const message = reason(choice)
  return message ? pick(ui.unavailable, props.locale)(pick(message, props.locale)) : undefined
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
const zramOptions = computed(() =>
  (['false', 'true'] as const).map((value) => ({
    value,
    label: pick(choices.zram[value], props.locale),
    description: pick(choiceDescriptions.zram[value], props.locale),
  })),
)
const diskSwapOptions = computed(() => [
  {
    value: 'none',
    label: pick(choices.diskSwap.none, props.locale),
    description: pick(choiceDescriptions.diskSwap.none, props.locale),
  },
  {
    value: 'swapfile',
    label: pick(choices.diskSwap.swapfile, props.locale),
    description: pick(choiceDescriptions.diskSwap.swapfile, props.locale),
  },
])
const encryptionOptions = computed(() => [
  {
    value: 'none',
    label: pick(choices.encryption.none, props.locale),
    description: pick(choiceDescriptions.encryption.none, props.locale),
  },
  ...(['password', 'tpm2'] as const).map((value) => ({
    value,
    label: pick(choices.encryption[value], props.locale),
    description: pick(choiceDescriptions.encryption[value], props.locale),
    disabledReason: unavailableReason(`encryption.${value}`),
  })),
])
const selectedEncryption = computed(() => {
  const encryption = model.value.encryption
  if (!encryption || encryption.mode === 'none') return encryption?.mode
  return encryption.unlock.method === 'password' ? 'password' : 'tpm2'
})
const tpmPresetOptions = computed(() =>
  (['minimal', 'custom-db', 'shim-mok'] as const).map((value) => ({
    value,
    label: pick(choices.tpm2Preset[value], props.locale),
    description: pick(choiceDescriptions.tpm2Preset[value], props.locale),
  })),
)
const requiredSecureBoot = computed(() => {
  const preset = tpm2Preset(model.value.encryption)
  return preset === 'custom-db' || preset === 'shim-mok' ? preset : undefined
})
const secureBootOptions = computed(() =>
  (['none', 'custom-db', 'shim-mok'] as const).map((value) => ({
    value,
    label: pick(choices.secureBoot[value], props.locale),
    description: pick(choiceDescriptions.secureBoot[value], props.locale),
    disabledReason:
      requiredSecureBoot.value && value !== requiredSecureBoot.value
        ? pick(
            ui.tpmPolicyRequiresSecureBoot,
            props.locale,
          )(pick(choices.secureBoot[requiredSecureBoot.value], props.locale))
        : value === 'none'
          ? undefined
          : unavailableReason(`secureBoot.${value}`),
  })),
)
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
type HyprlandCategory = keyof typeof HYPRLAND_CHOICES
type HyprlandCategoryUi = {
  label: Localized<string>
  choices: Record<string, Localized<string>>
  descriptions: Record<string, Localized<string>>
}
const HYPRLAND_CATEGORY_UI: Record<HyprlandCategory, HyprlandCategoryUi> = {
  notifications: {
    label: ui.hyprlandNotifications,
    choices: choices.hyprlandNotifications,
    descriptions: choiceDescriptions.hyprlandNotifications,
  },
  launcher: {
    label: ui.hyprlandLauncher,
    choices: choices.hyprlandLauncher,
    descriptions: choiceDescriptions.hyprlandLauncher,
  },
  fileManager: {
    label: ui.hyprlandFileManager,
    choices: choices.hyprlandFileManager,
    descriptions: choiceDescriptions.hyprlandFileManager,
  },
  terminal: {
    label: ui.hyprlandTerminal,
    choices: choices.hyprlandTerminal,
    descriptions: choiceDescriptions.hyprlandTerminal,
  },
  bar: {
    label: ui.hyprlandBar,
    choices: choices.hyprlandBar,
    descriptions: choiceDescriptions.hyprlandBar,
  },
  lock: {
    label: ui.hyprlandLock,
    choices: choices.hyprlandLock,
    descriptions: choiceDescriptions.hyprlandLock,
  },
}

const hyprland = computed<Partial<HyprlandExtras>>(() => model.value.hyprland ?? NEW_HYPRLAND_DRAFT)
const hyprlandCategories = computed(() =>
  (Object.keys(HYPRLAND_CHOICES) as HyprlandCategory[]).map((category) => ({
    category,
    label: pick(HYPRLAND_CATEGORY_UI[category].label, props.locale),
    selected: hyprland.value[category] as string | undefined,
    options: (HYPRLAND_CHOICES[category] as readonly string[]).map((value) => ({
      value,
      label: pick(HYPRLAND_CATEGORY_UI[category].choices[value]!, props.locale),
      description: pick(HYPRLAND_CATEGORY_UI[category].descriptions[value]!, props.locale),
    })),
  })),
)
const addonGroups = computed(() =>
  hyprlandAddonGroups.map((group) => ({
    label: pick(group.label, props.locale),
    addons: group.addons.map((addon) => ({
      value: addon,
      label: pick(choices.hyprlandAddons[addon], props.locale),
      description: pick(choiceDescriptions.hyprlandAddons[addon], props.locale),
      checked: hyprland.value.addons?.includes(addon) ?? false,
    })),
  })),
)

function commitHyprland(category: HyprlandCategory, value: string | undefined) {
  if (!value) return
  model.value = {
    ...model.value,
    hyprland: { ...hyprland.value, [category]: value } as Partial<HyprlandExtras>,
  }
}

function toggleHyprlandAddon(addon: HyprlandAddon, event: Event) {
  const addons = (hyprland.value.addons ?? []).filter((selected) => selected !== addon)
  if ((event.currentTarget as HTMLInputElement).checked) addons.push(addon)
  model.value = { ...model.value, hyprland: { ...hyprland.value, addons: orderAddons(addons) } }
}

const graphicsOptions = computed(() =>
  (['intel', 'amd', 'nvidia'] as const).map((value) => ({
    value,
    label: pick(choices.graphics[value], props.locale),
    description: pick(choiceDescriptions.graphics[value], props.locale),
  })),
)
type TextField = 'hostname' | 'username'
type ChoiceField = Exclude<
  keyof ConfigDraft,
  'encryption' | 'reflector' | 'zram' | 'diskSwap' | 'diskSwapSizeGiB'
>
type SelectField = 'timezone' | 'systemLocale' | 'keymap'

function commitText(field: TextField, event: Event) {
  const input = event.currentTarget as HTMLInputElement
  if (!input.reportValidity()) {
    input.value = model.value[field] ?? ''
    return
  }
  model.value = { ...model.value, [field]: input.value }
}

function commitDisk(event: Event) {
  const input = event.currentTarget as HTMLInputElement
  if (!input.reportValidity()) {
    input.value = model.value.disk?.replace(/^\/dev\//, '') ?? ''
    return
  }
  model.value = { ...model.value, disk: `/dev/${input.value}` }
}

function commitSelect(field: SelectField, event: Event) {
  const select = event.currentTarget as HTMLSelectElement
  model.value = { ...model.value, [field]: select.value } as ConfigDraft
}

function useDetectedTimezone() {
  if (canUseDetectedTimezone) model.value = { ...model.value, timezone: detectedTimezone }
}

function commitChoice(field: ChoiceField, value: string | undefined) {
  if (value === undefined) return
  const next = { ...model.value, [field]: value } as ConfigDraft
  if (field === 'subvolumeLayout' && value === 'root-only') delete next.snapper
  if (field === 'desktop') {
    if (value === 'hyprland') next.hyprland ??= NEW_HYPRLAND_DRAFT
    else delete next.hyprland
  }
  model.value = next
}

function commitEncryption(value: string | undefined) {
  if (value === 'none') model.value = { ...model.value, encryption: { mode: 'none' } }
  if (value === 'password') {
    model.value = { ...model.value, encryption: { mode: 'luks2', unlock: { method: 'password' } } }
  }
  if (value === 'tpm2') {
    model.value = { ...model.value, encryption: makeTpm2Encryption('minimal') }
  }
}

function commitZram(value: string | undefined) {
  if (!value) return
  model.value = { ...model.value, zram: value === 'true' }
}

function commitDiskSwap(value: string | undefined) {
  if (!value) return
  model.value = {
    ...model.value,
    diskSwap: value as ConfigDraft['diskSwap'],
    diskSwapSizeGiB: value === 'swapfile' ? model.value.diskSwapSizeGiB : null,
  }
}

function commitDiskSwapSize(event: Event) {
  const size = Number((event.currentTarget as HTMLInputElement).value)
  model.value = { ...model.value, diskSwapSizeGiB: size }
}

function commitTpm2Preset(value: string | undefined) {
  if (!value) return
  const preset = value as Tpm2Preset
  const current = model.value.encryption
  const pin =
    current?.mode === 'luks2' && current.unlock.method === 'tpm2' ? current.unlock.pin : true
  const next = { ...model.value, encryption: makeTpm2Encryption(preset, pin) }
  if (preset === 'custom-db') next.secureBoot = 'custom-db'
  if (preset === 'shim-mok') next.secureBoot = 'shim-mok'
  model.value = next
}

function commitTpmPin(event: Event) {
  const encryption = model.value.encryption
  if (encryption?.mode !== 'luks2' || encryption.unlock.method !== 'tpm2') return
  model.value = {
    ...model.value,
    encryption: {
      mode: 'luks2',
      unlock: { ...encryption.unlock, pin: (event.currentTarget as HTMLInputElement).checked },
    },
  }
}

function commitSecureBoot(value: string | undefined) {
  if (!value) return
  const next = { ...model.value, secureBoot: value as ConfigDraft['secureBoot'] }
  const preset = tpm2Preset(next.encryption)
  if (
    (preset === 'custom-db' && value !== 'custom-db') ||
    (preset === 'shim-mok' && value !== 'shim-mok')
  ) {
    const encryption = next.encryption
    const pin =
      encryption?.mode === 'luks2' && encryption.unlock.method === 'tpm2'
        ? encryption.unlock.pin
        : true
    next.encryption = makeTpm2Encryption('minimal', pin)
  }
  model.value = next
}

function commitReflectorCountries(event: Event) {
  const input = event.currentTarget as HTMLInputElement
  const countries = [
    ...new Set(
      input.value
        .toUpperCase()
        .split(',')
        .map((country) => country.trim())
        .filter(Boolean),
    ),
  ]
  input.setCustomValidity(
    countries.length > 0 &&
      countries.every((country) => mirrorCountryCodes.includes(country as never))
      ? ''
      : pick(ui.mirrorCountryInvalid, props.locale),
  )
  if (!input.reportValidity()) {
    input.value = model.value.reflector?.countries.join(',') ?? ''
    return
  }
  model.value = {
    ...model.value,
    reflector: {
      countries,
      ageHours: model.value.reflector?.ageHours ?? 12,
      number: model.value.reflector?.number ?? 10,
    },
  }
}

function commitReflectorAge(event: Event) {
  const ageHours = Number((event.currentTarget as HTMLInputElement).value)
  model.value = {
    ...model.value,
    reflector: {
      countries: model.value.reflector?.countries ?? [],
      ageHours,
      number: model.value.reflector?.number ?? 10,
    },
  }
}

function commitReflectorNumber(event: Event) {
  const number = Number((event.currentTarget as HTMLInputElement).value)
  model.value = {
    ...model.value,
    reflector: {
      countries: model.value.reflector?.countries ?? [],
      ageHours: model.value.reflector?.ageHours ?? 12,
      number,
    },
  }
}

function advance(event: Event) {
  const form = event.currentTarget as HTMLFormElement
  if (!form.reportValidity()) return
  if (step.value === titles.value.length - 1) emit('finish')
  else step.value += 1
}

function goToStep(index: number) {
  if (index < step.value) step.value = index
}
</script>

<template>
  <main class="wizard">
    <header>
      <div class="top-row">
        <p class="product">{{ pick(ui.title, props.locale) }}</p>
        <div class="pickers">
          <LanguagePicker
            :model-value="props.locale"
            @update:model-value="emit('update:locale', $event)"
          />
          <ThemePicker :locale="props.locale" />
        </div>
      </div>
      <p class="progress">
        {{ pick(ui.wizardProgress, props.locale)(step + 1, titles.length) }}
      </p>
      <h1>{{ titles[step] }}</h1>
      <ol
        :aria-label="pick(ui.wizardSteps, props.locale)"
        :style="{ gridTemplateColumns: `repeat(${titles.length}, 1fr)` }"
      >
        <li
          v-for="(title, index) in titles"
          :key="title"
          :class="{ complete: index < step }"
          :aria-current="index === step ? 'step' : undefined"
        >
          <button
            class="step-link"
            type="button"
            :data-step="index"
            :disabled="index >= step"
            @click="goToStep(index)"
          >
            <span>{{ index + 1 }}</span>
            {{ title }}
          </button>
        </li>
      </ol>
    </header>

    <form @submit.prevent="advance">
      <fieldset v-if="step === 4">
        <aside class="tutorial">
          <h2>{{ pick(ui.diskTutorial, props.locale) }}</h2>
          <p>
            {{ pick(ui.diskTutorialBeforeCommand, props.locale) }}<code>lsblk</code
            >{{ pick(ui.diskTutorialAfterCommand, props.locale) }}
          </p>
          <p class="warning">{{ pick(ui.diskEraseWarning, props.locale) }}</p>
        </aside>

        <label>
          <span>{{ pick(ui.targetDisk, props.locale) }}</span>
          <span class="device-input">
            <span class="device-prefix">/dev/</span>
            <input
              name="disk"
              required
              pattern="nvme[0-9]+n[0-9]+|mmcblk[0-9]+|loop[0-9]+|md[0-9]+|(sd|vd|xvd|hd)[a-z]+"
              placeholder="nvme0n1"
              :value="model.disk?.replace(/^\/dev\//, '') ?? ''"
              @change="commitDisk"
            />
          </span>
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

        <div class="field">
          <span>{{ pick(ui.graphics, props.locale) }}</span>
          <ChoicePicker
            name="graphics"
            :model-value="model.graphics"
            :options="graphicsOptions"
            @update:model-value="commitChoice('graphics', $event)"
          />
        </div>
      </fieldset>

      <fieldset v-if="step === 2">
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
          <span>{{ pick(ui.zram, props.locale) }}</span>
          <ChoicePicker
            name="zram"
            :model-value="model.zram === undefined ? undefined : String(model.zram)"
            :options="zramOptions"
            @update:model-value="commitZram"
          />
        </div>

        <div class="field">
          <span>{{ pick(ui.diskSwap, props.locale) }}</span>
          <ChoicePicker
            name="diskSwap"
            :model-value="model.diskSwap"
            :options="diskSwapOptions"
            @update:model-value="commitDiskSwap"
          />
          <label v-if="model.diskSwap === 'swapfile'" class="nested-field">
            <span>{{ pick(ui.diskSwapSize, props.locale) }}</span>
            <input
              name="diskSwapSizeGiB"
              required
              type="number"
              min="1"
              max="1024"
              :value="model.diskSwapSizeGiB ?? ''"
              @change="commitDiskSwapSize"
            />
          </label>
        </div>

        <div class="field" :class="{ 'disabled-field': model.subvolumeLayout === 'root-only' }">
          <span>{{ pick(ui.snapper, props.locale) }}</span>
          <ChoicePicker
            v-if="model.subvolumeLayout !== 'root-only'"
            name="snapper"
            :model-value="model.snapper"
            :options="snapperOptions"
            @update:model-value="commitChoice('snapper', $event)"
          />
          <p v-else class="constraint-message">
            {{ pick(ui.snapperUnsupportedRootOnly, props.locale) }}
          </p>
        </div>

        <div class="encryption-row">
          <div class="field encryption-field">
            <span>{{ pick(ui.encryption, props.locale) }}</span>
            <ChoicePicker
              name="encryption"
              :model-value="selectedEncryption"
              :options="encryptionOptions"
              @update:model-value="commitEncryption"
            />
            <div
              v-if="model.encryption?.mode === 'luks2' && model.encryption.unlock.method === 'tpm2'"
              class="field nested-field"
            >
              <span>{{ pick(ui.tpmPolicy, props.locale) }}</span>
              <ChoicePicker
                name="tpm2Preset"
                :model-value="tpm2Preset(model.encryption)"
                :options="tpmPresetOptions"
                @update:model-value="commitTpm2Preset"
              />
              <label class="check-option">
                <input
                  name="tpmPin"
                  type="checkbox"
                  :checked="model.encryption.unlock.pin"
                  @change="commitTpmPin"
                />
                <span>{{ pick(ui.requireTpmPin, props.locale) }}</span>
              </label>
              <p v-if="tpm2Preset(model.encryption) === 'minimal'" class="constraint-message">
                {{ pick(ui.pcr7Warning, props.locale) }}
              </p>
            </div>
          </div>

          <div class="field secure-boot-field">
            <span>{{ pick(ui.secureBoot, props.locale) }}</span>
            <ChoicePicker
              name="secureBoot"
              :model-value="model.secureBoot"
              :options="secureBootOptions"
              @update:model-value="commitSecureBoot"
            />
          </div>
        </div>
      </fieldset>

      <fieldset v-if="step === 0">
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
          <div v-if="canUseDetectedTimezone" class="detected-timezone">
            <span>{{ pick(ui.detectedTimezone, props.locale)(detectedTimezone) }}</span>
            <button
              v-if="model.timezone !== detectedTimezone"
              data-action="use-timezone"
              type="button"
              @click="useDetectedTimezone"
            >
              {{ pick(ui.useDetectedTimezone, props.locale) }}
            </button>
          </div>
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
            <option v-for="value in sortedSystemLocales" :key="value" :value="value">
              {{ pick(choices.systemLocale[value], props.locale) }} — {{ value }}
            </option>
          </select>
          <small>{{ pick(ui.systemLocaleHint, props.locale) }}</small>
          <p v-if="isCjkSystemLocale" class="locale-warning" role="alert">
            {{ pick(ui.cjkTtyWarning, props.locale) }}
          </p>
        </label>
      </fieldset>

      <fieldset v-if="step === 1" class="single">
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

      <fieldset v-if="step === 3">
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

        <div class="field reflector-field">
          <span>{{ pick(ui.reflector, props.locale) }}</span>
          <div class="field nested-field">
            <label>
              <span>{{ pick(ui.mirrorCountry, props.locale) }}</span>
              <input
                name="mirrorCountries"
                required
                placeholder="CA,US"
                :value="model.reflector?.countries.join(',') ?? ''"
                @change="commitReflectorCountries"
              />
              <small>{{ pick(ui.mirrorCountryHint, props.locale) }}</small>
            </label>
            <label>
              <span>{{ pick(ui.mirrorAge, props.locale) }}</span>
              <input
                name="mirrorAge"
                required
                type="number"
                min="1"
                max="168"
                :value="model.reflector?.ageHours ?? 12"
                @change="commitReflectorAge"
              />
            </label>
            <label>
              <span>{{ pick(ui.mirrorNumber, props.locale) }}</span>
              <input
                name="mirrorNumber"
                required
                type="number"
                min="1"
                max="50"
                :value="model.reflector?.number ?? 10"
                @change="commitReflectorNumber"
              />
            </label>
          </div>
        </div>

        <div v-if="model.desktop === 'hyprland'" class="field nested-field hyprland-field">
          <span>{{ pick(ui.hyprlandExtras, props.locale) }}</span>
          <small>{{ pick(ui.hyprlandExtrasHint, props.locale) }}</small>
          <div v-for="entry in hyprlandCategories" :key="entry.category" class="field">
            <span>{{ entry.label }}</span>
            <ChoicePicker
              :name="`hyprland.${entry.category}`"
              :model-value="entry.selected"
              :options="entry.options"
              @update:model-value="commitHyprland(entry.category, $event)"
            />
          </div>
          <div v-for="group in addonGroups" :key="group.label" class="field">
            <span>{{ group.label }}</span>
            <label v-for="addon in group.addons" :key="addon.value" class="check-option">
              <input
                type="checkbox"
                :name="`hyprland.${addon.value}`"
                :checked="addon.checked"
                @change="toggleHyprlandAddon(addon.value, $event)"
              />
              <span>{{ addon.label }}</span>
              <small>{{ addon.description }}</small>
            </label>
          </div>
        </div>
      </fieldset>

      <section v-if="step === 5" class="review">
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
  </main>
</template>

<style scoped>
.wizard {
  padding-top: 1.5rem;
}

.product,
.progress {
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

.top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.pickers {
  display: flex;
  gap: 0.5rem;
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
  color: var(--faint);
  font-size: 0.72rem;
}

.step-link {
  all: unset;
  position: relative;
  display: grid;
  box-sizing: border-box;
  width: 100%;
  gap: 0.3rem;
  padding-top: 0.7rem;
}

.step-link::before {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 2px;
  background: var(--rule);
  content: '';
  transition:
    height 0.15s ease,
    background-color 0.15s ease;
}

.step-link:not(:disabled) {
  cursor: pointer;
}

.step-link:not(:disabled):hover,
.step-link:not(:disabled):focus-visible {
  color: var(--accent);
}

.step-link:not(:disabled):hover::before,
.step-link:not(:disabled):focus-visible::before {
  height: 4px;
}

.step-link:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}

.step-link span {
  font-family: var(--mono);
}

ol li.complete,
ol li[aria-current='step'] {
  color: var(--fg);
}

ol li.complete .step-link::before,
ol li[aria-current='step'] .step-link::before {
  background: var(--accent);
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

.tutorial code {
  padding: 0.08rem 0.28rem;
  border-radius: 3px;
  background: var(--code-bg);
  color: var(--fg);
  font-family: var(--mono);
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

.device-input {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
}

.device-prefix {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--rule);
  border-right: 0;
  border-radius: 5px 0 0 5px;
  background: var(--bg);
  color: var(--muted);
  font-family: var(--mono);
}

.device-input input {
  border-radius: 0 5px 5px 0;
}

.device-input:focus-within .device-prefix {
  border-color: var(--accent);
}

.detected-timezone {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.25rem;
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--rule);
  border-radius: 5px;
  background: var(--bg);
  color: var(--muted);
  font-size: 0.72rem;
}

.detected-timezone button {
  padding: 0.25rem 0.6rem;
  font-size: 0.72rem;
}

small {
  color: var(--faint);
  font-size: 0.7rem;
  line-height: 1.4;
}

small.description {
  color: var(--muted);
}

/** Keeps secure boot beside encryption, so the TPM policy block cannot push it down. */
.encryption-row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 1rem;
}

.disabled-field {
  color: var(--faint);
}

/** Title row plus a box that fills the rest, so it ends level with the field beside it. */
.reflector-field {
  grid-template-rows: auto 1fr;
}

.reflector-field .nested-field {
  margin-top: 0;
}

.nested-field {
  margin-top: 0.5rem;
  padding: 0.8rem;
  border: 1px solid var(--rule);
  border-radius: 5px;
  background: var(--bg);
}

.check-option {
  display: flex;
  grid-column: 1 / -1;
  align-items: center;
  gap: 0.5rem;
  color: var(--fg);
}

.hyprland-field {
  grid-column: 1 / -1;
}

.hyprland-field > .field {
  margin-top: 0.9rem;
}

.hyprland-field .check-option {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 0.25rem 0.55rem;
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--rule);
  border-radius: 5px;
  cursor: pointer;
}

.hyprland-field .check-option input {
  margin: 0.15rem 0 0;
  accent-color: var(--accent);
}

.hyprland-field .check-option:hover,
.hyprland-field .check-option:focus-within {
  border-color: var(--accent);
}

.hyprland-field .check-option span {
  font-family: var(--mono);
  font-size: 0.78rem;
}

.hyprland-field .check-option small {
  grid-column: 2;
  color: var(--muted);
}

.check-option input {
  width: auto;
}

.constraint-message {
  margin: 0;
  padding: 0.65rem;
  border: 1px dashed var(--rule);
  border-radius: 5px;
  background: var(--bg);
  color: var(--faint);
  font-size: 0.72rem;
}

.locale-warning {
  margin: 0.25rem 0 0;
  padding: 0.65rem;
  border-left: 3px solid var(--warn);
  background: var(--bg);
  color: var(--warn);
  font-size: 0.72rem;
  line-height: 1.5;
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
  .encryption-row,
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
