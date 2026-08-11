<script setup lang="ts">
defineProps<{
  name: string
  options: {
    value: string
    label: string
    description: string
    disabledReason?: string
  }[]
}>()

const model = defineModel<string>()
</script>

<template>
  <div class="choice-picker">
    <label
      v-for="option in options"
      :key="option.value"
      class="choice"
      :class="{ selected: model === option.value, disabled: option.disabledReason }"
    >
      <input
        v-model="model"
        type="radio"
        :name="name"
        :value="option.value"
        :disabled="Boolean(option.disabledReason)"
        required
      />
      <span class="choice-label">{{ option.label }}</span>
      <small class="choice-description">
        {{ option.description }}
        <span v-if="option.disabledReason" class="unavailable">{{ option.disabledReason }}</span>
      </small>
    </label>
  </div>
</template>

<style scoped>
.choice-picker {
  display: grid;
  gap: 0.4rem;
}

.choice {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0 0.55rem;
  padding: 0.55rem 0.65rem;
  border: 1px solid var(--rule);
  border-radius: 5px;
  background: var(--bg);
  color: var(--fg);
  cursor: pointer;
}

.choice:hover,
.choice:focus-within,
.choice.selected {
  border-color: var(--accent);
}

.choice.disabled {
  color: var(--faint);
  cursor: not-allowed;
}

input {
  margin: 0.15rem 0 0;
  accent-color: var(--accent);
}

.choice-label {
  font-family: var(--mono);
  font-size: 0.78rem;
}

.choice-description {
  grid-column: 2;
  margin-top: 0.25rem;
  color: var(--muted);
  font-size: 0.7rem;
  line-height: 1.4;
}

.unavailable {
  display: block;
  margin-top: 0.2rem;
  color: var(--faint);
}
</style>
