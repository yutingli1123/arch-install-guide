import { mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App.vue'
import { parseDraft, serializeDraft, stageOneConfig } from '../guide/config'

describe('setup wizard', () => {
  beforeEach(() => window.history.replaceState(null, '', '/'))

  it('opens on a welcome page and reveals configuration only after starting', async () => {
    const wrapper = mount(App)

    expect(wrapper.get('.welcome').text()).toContain('生成适合你的 Arch Linux 安装指南')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.find('.guide').exists()).toBe(false)
    expect(window.location.search).toBe('')

    await wrapper.get('[data-action="start"]').trigger('click')

    expect(wrapper.get('.wizard h1').text()).toBe('区域与语言')
    expect(wrapper.get('.progress').text()).toBe('第 1 步，共 6 步')
    expect(wrapper.find('select[name="timezone"]').exists()).toBe(true)
    expect(wrapper.find('select[name="systemLocale"]').exists()).toBe(true)
    expect(wrapper.find('option[value="pt_BR.UTF-8"]').exists()).toBe(true)
    const localeValues = wrapper
      .findAll('select[name="systemLocale"] option:not([disabled])')
      .map((option) => option.attributes('value'))
    expect(localeValues).toEqual([...localeValues].sort())
    expect(wrapper.text()).not.toContain('配置和当前步骤会自动保存到网址')
    expect(wrapper.get('.detected-timezone').text()).toContain(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    )

    const params = new URLSearchParams(window.location.search)
    expect([...params.entries()]).toEqual([['step', '1']])
    expect((wrapper.get('select[name="timezone"]').element as HTMLSelectElement).value).toBe('')
    expect(params.get('step')).toBe('1')
  })

  it('does not advance until the choices on the current page are explicit', async () => {
    const wrapper = mount(App)
    await start(wrapper)
    await next(wrapper)

    expect(wrapper.get('.wizard h1').text()).toBe('区域与语言')
    expect([...new URLSearchParams(window.location.search).entries()]).toEqual([['step', '1']])
  })

  it('uses the detected system timezone only after confirmation', async () => {
    const wrapper = mount(App)
    await start(wrapper)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    expect(parseDraft(window.location.search).timezone).toBeUndefined()
    await wrapper.get('[data-action="use-timezone"]').trigger('click')

    expect((wrapper.get('select[name="timezone"]').element as HTMLSelectElement).value).toBe(
      timezone,
    )
    expect(parseDraft(window.location.search).timezone).toBe(timezone)
  })

  it('uses completed progress steps as backward navigation', async () => {
    const wrapper = mount(App)
    await start(wrapper)
    expect(wrapper.get('.step-link[data-step="1"]').attributes('disabled')).toBeDefined()

    await wrapper.get('select[name="timezone"]').setValue('America/Toronto')
    await wrapper.get('select[name="systemLocale"]').setValue('en_US.UTF-8')
    await next(wrapper)
    await wrapper.get('.step-link[data-step="0"]').trigger('click')

    expect(wrapper.get('.wizard h1').text()).toBe('区域与语言')
    expect(new URLSearchParams(window.location.search).get('step')).toBe('1')
    expect(parseDraft(window.location.search).timezone).toBe('America/Toronto')
  })

  it('keeps TPM2 presets and their required secure boot path consistent', async () => {
    const wrapper = mount(App)
    await start(wrapper)
    await wrapper.get('select[name="timezone"]').setValue('America/Toronto')
    await wrapper.get('select[name="systemLocale"]').setValue('en_US.UTF-8')
    await next(wrapper)
    await wrapper.get('select[name="keymap"]').setValue('us')
    await next(wrapper)

    expect(
      wrapper.get('input[name="encryption"][value="password"]').attributes('disabled'),
    ).toBeUndefined()
    expect(
      wrapper.get('input[name="secureBoot"][value="shim-mok"]').attributes('disabled'),
    ).toBeUndefined()
    await selectChoice(wrapper, 'encryption', 'tpm2')
    expect(wrapper.get('.nested-field').text()).toContain('最小（PCR 7）')
    expect(wrapper.get('.nested-field').text()).toContain('不区分具体 UKI')
    expect(
      wrapper.get('.encryption-field').element.contains(wrapper.get('.nested-field').element),
    ).toBe(true)
    expect(wrapper.get('.encryption-field').element.nextElementSibling).toBe(
      wrapper.get('.secure-boot-field').element,
    )

    await selectChoice(wrapper, 'tpm2Preset', 'custom-db')
    let saved = parseDraft(window.location.search)
    expect(saved.secureBoot).toBe('custom-db')
    expect(
      wrapper.get('input[name="secureBoot"][value="custom-db"]').attributes('disabled'),
    ).toBeUndefined()
    expect(
      wrapper.get('input[name="secureBoot"][value="none"]').attributes('disabled'),
    ).toBeDefined()
    expect(
      wrapper.get('input[name="secureBoot"][value="shim-mok"]').attributes('disabled'),
    ).toBeDefined()

    await selectChoice(wrapper, 'tpm2Preset', 'shim-mok')
    saved = parseDraft(window.location.search)
    expect(saved.secureBoot).toBe('shim-mok')
    expect(saved.encryption).toEqual({
      mode: 'luks2',
      unlock: { method: 'tpm2', pin: true, hashPcrs: [7, 14], signedPcrs: [11] },
    })
    expect(
      wrapper.get('input[name="secureBoot"][value="shim-mok"]').attributes('disabled'),
    ).toBeUndefined()
    expect(
      wrapper.get('input[name="secureBoot"][value="none"]').attributes('disabled'),
    ).toBeDefined()
    expect(
      wrapper.get('input[name="secureBoot"][value="custom-db"]').attributes('disabled'),
    ).toBeDefined()
    expect(wrapper.get('.secure-boot-field').text()).toContain(
      '当前 TPM2 绑定策略要求shim-signed + MOK',
    )

    await selectChoice(wrapper, 'tpm2Preset', 'minimal')
    expect(
      wrapper.get('input[name="secureBoot"][value="none"]').attributes('disabled'),
    ).toBeUndefined()
    expect(
      wrapper.get('input[name="secureBoot"][value="custom-db"]').attributes('disabled'),
    ).toBeUndefined()
    expect(
      wrapper.get('input[name="secureBoot"][value="shim-mok"]').attributes('disabled'),
    ).toBeUndefined()
  })

  it('walks through configuration, review, and the generated guide', async () => {
    const wrapper = mount(App)
    await start(wrapper)

    expect(wrapper.get('.wizard h1').text()).toBe('区域与语言')
    await wrapper.get('select[name="timezone"]').setValue('Asia/Shanghai')
    await wrapper.get('select[name="systemLocale"]').setValue('zh_CN.UTF-8')
    await next(wrapper)

    expect(wrapper.get('.wizard h1').text()).toBe('键盘布局')
    await wrapper.get('select[name="keymap"]').setValue('de-latin1')
    await next(wrapper)

    expect(wrapper.get('form').text()).toContain('只创建 @，结构简单，但不能配置 Snapper')
    expect(wrapper.get('form').text()).toContain('在同一个 Btrfs 文件系统中')
    expect(wrapper.get('form').text()).toContain('当前不可用：对应安装步骤尚未提供')
    await selectChoice(wrapper, 'subvolumeLayout', 'root-only')
    expect(
      wrapper
        .get('input[name="subvolumeLayout"][value="root-only"]')
        .element.parentElement?.classList.contains('selected'),
    ).toBe(true)
    expect(wrapper.find('input[name="snapper"]').exists()).toBe(false)
    expect(wrapper.get('.constraint-message').text()).toBe('单一根子卷不推荐 Snapper')
    await selectChoice(wrapper, 'swap', 'none')
    await selectChoice(wrapper, 'encryption', 'none')
    await selectChoice(wrapper, 'secureBoot', 'none')
    await next(wrapper)

    await wrapper.get('input[name="hostname"]').setValue('workstation')
    await wrapper.get('input[name="username"]').setValue('root')
    expect((wrapper.get('input[name="username"]').element as HTMLInputElement).value).toBe('')
    await wrapper.get('input[name="username"]').setValue('alice')
    await selectChoice(wrapper, 'desktop', 'none')
    await next(wrapper)

    expect(wrapper.get('.wizard h1').text()).toBe('安装目标')
    expect(wrapper.get('.tutorial').text()).toContain('根据 SIZE 和 TYPE 找到目标整盘')
    expect(wrapper.get('.tutorial code').text()).toBe('lsblk')
    expect(wrapper.get('.tutorial').text()).toContain('执行指南中的分区命令')
    expect(wrapper.get('.device-prefix').text()).toBe('/dev/')
    await wrapper.get('input[name="disk"]').setValue('nvme0n1')
    await selectChoice(wrapper, 'cpu', 'amd')
    await next(wrapper)

    expect(wrapper.get('.wizard h1').text()).toBe('确认配置')
    expect(wrapper.get('.review').text()).toContain('CPUAMD')
    expect(wrapper.get('.review').text()).toContain('子卷布局单一根子卷')
    expect(wrapper.get('.review').text()).toContain('时区Asia/Shanghai')
    expect(wrapper.get('.review').text()).toContain('系统语言zh_CN.UTF-8')
    expect(wrapper.get('.review').text()).toContain('键盘布局de-latin1')
    expect(wrapper.get('.review').text()).toContain('用户名alice')

    const params = new URLSearchParams(window.location.search)
    const saved = parseDraft(window.location.search)
    expect(params.get('c')).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(params.has('config')).toBe(false)
    expect(params.has('cpu')).toBe(false)
    expect(saved.cpu).toBe('amd')
    expect(saved.subvolumeLayout).toBe('root-only')
    expect(saved.snapper).toBeUndefined()
    expect(saved.username).toBe('alice')
    expect(saved.timezone).toBe('Asia/Shanghai')
    expect(saved.systemLocale).toBe('zh_CN.UTF-8')
    expect(saved.keymap).toBe('de-latin1')
    expect(params.get('step')).toBe('6')

    await next(wrapper)

    expect(wrapper.find('.wizard').exists()).toBe(false)
    expect(wrapper.get('.config-summary').text()).toContain('CPU AMD')
    expect(wrapper.get('.config-summary').text()).toContain('子卷布局 单一根子卷')
    expect(wrapper.text()).toContain('amd-ucode')
    expect(wrapper.html()).not.toContain('btrfs subvolume create /mnt/@boot')
    expect(new URLSearchParams(window.location.search).get('step')).toBe('guide')

    await wrapper.get('[data-action="edit"]').trigger('click')
    expect(wrapper.get('.wizard h1').text()).toBe('确认配置')
    expect(new URLSearchParams(window.location.search).get('step')).toBe('6')
  })

  it('restores shared configuration at its saved wizard step', () => {
    window.history.replaceState(
      null,
      '',
      `/?${serializeDraft({ hostname: 'workstation', username: 'alice' })}&step=4`,
    )
    const wrapper = mount(App)

    expect(wrapper.get('.wizard h1').text()).toBe('基础系统')
    expect((wrapper.get('input[name="hostname"]').element as HTMLInputElement).value).toBe(
      'workstation',
    )
    expect((wrapper.get('input[name="username"]').element as HTMLInputElement).value).toBe('alice')
    expect(new URLSearchParams(window.location.search).get('step')).toBe('4')
  })

  it('opens a completed shared configuration directly as the guide', () => {
    const query = serializeDraft({
      ...stageOneConfig,
      disk: '/dev/sda',
      cpu: 'amd',
      hostname: 'workstation',
      username: 'alice',
    })
    window.history.replaceState(null, '', `/?${query}&step=guide`)
    const wrapper = mount(App)

    expect(wrapper.find('.welcome').exists()).toBe(false)
    expect(wrapper.find('.wizard').exists()).toBe(false)
    expect(wrapper.get('.config-summary').text()).toContain('CPU AMD')
    expect(wrapper.get('.config-summary').text()).toContain('用户名 alice')
    expect(new URLSearchParams(window.location.search).get('step')).toBe('guide')
  })

  it('does not generate a guide from an incomplete shared configuration', () => {
    window.history.replaceState(null, '', `/?${serializeDraft({ cpu: 'amd' })}&step=guide`)
    const wrapper = mount(App)

    expect(wrapper.find('.guide').exists()).toBe(false)
    expect(wrapper.get('.wizard h1').text()).toBe('区域与语言')
    expect(parseDraft(window.location.search).cpu).toBe('amd')
    expect(new URLSearchParams(window.location.search).get('step')).toBe('1')
  })
})

describe('generated guide', () => {
  beforeEach(() => window.history.replaceState(null, '', '/'))

  it('shows the configuration summary above the step count', async () => {
    const wrapper = mount(App)
    await openGuide(wrapper)
    const summary = wrapper.get('.config-summary').text()

    expect(summary).toContain('swap 无')
    expect(summary).toContain('子卷布局 标准分离子卷')
    expect(summary).toContain('磁盘加密 关闭')
    expect(summary).toContain('安全启动 关闭')
    expect(summary).toContain('snapper 不配置')
    expect(summary).toContain('桌面环境 无')
    expect(summary).not.toContain('UEFI')
    expect(summary).not.toContain('UKI')
    expect(summary).not.toContain('systemd-boot')
    expect(summary).not.toContain('ESP 大小')
    expect(summary).not.toContain('PCR')
    expect(wrapper.get('footer').text()).not.toContain('本指南配置')

    const header = wrapper.get('header').element
    expect(
      header.querySelector('.config-summary')?.nextElementSibling?.classList.contains('meta'),
    ).toBe(true)
  })
})

async function start(wrapper: VueWrapper) {
  await wrapper.get('[data-action="start"]').trigger('click')
}

async function next(wrapper: VueWrapper) {
  await wrapper.get('form').trigger('submit')
}

async function selectChoice(wrapper: VueWrapper, name: string, value: string) {
  await wrapper.get(`input[name="${name}"][value="${value}"]`).setValue(true)
}

async function openGuide(wrapper: VueWrapper) {
  await start(wrapper)
  await wrapper.get('select[name="timezone"]').setValue('America/Toronto')
  await wrapper.get('select[name="systemLocale"]').setValue('en_US.UTF-8')
  await next(wrapper)
  await wrapper.get('select[name="keymap"]').setValue('us')
  await next(wrapper)
  await selectChoice(wrapper, 'subvolumeLayout', 'separated')
  await selectChoice(wrapper, 'swap', 'none')
  await selectChoice(wrapper, 'encryption', 'none')
  await selectChoice(wrapper, 'secureBoot', 'none')
  await selectChoice(wrapper, 'snapper', 'none')
  await next(wrapper)
  await wrapper.get('input[name="hostname"]').setValue('archlinux')
  await wrapper.get('input[name="username"]').setValue('user')
  await selectChoice(wrapper, 'desktop', 'none')
  await next(wrapper)
  await wrapper.get('input[name="disk"]').setValue('nvme0n1')
  await selectChoice(wrapper, 'cpu', 'intel')
  await next(wrapper)
  await next(wrapper)
}
