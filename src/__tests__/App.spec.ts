import { mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App.vue'

describe('setup wizard', () => {
  beforeEach(() => window.history.replaceState(null, '', '/'))

  it('opens on a welcome page and reveals configuration only after starting', async () => {
    const wrapper = mount(App)

    expect(wrapper.get('.welcome').text()).toContain('生成适合你的 Arch Linux 安装指南')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.find('.guide').exists()).toBe(false)

    await wrapper.get('[data-action="start"]').trigger('click')

    expect(wrapper.get('.wizard h1').text()).toBe('安装目标')
    expect(wrapper.get('.progress').text()).toBe('第 1 步，共 4 步')
    expect(wrapper.get('input[name="disk"]').element).toBeInstanceOf(HTMLInputElement)
  })

  it('walks through configuration, review, and the generated guide', async () => {
    const wrapper = mount(App)
    await start(wrapper)

    await wrapper.get('select[name="cpu"]').setValue('amd')
    await next(wrapper)

    await wrapper.get('select[name="subvolumeLayout"]').setValue('root-only')
    const snapper = wrapper.get('select[name="snapper"]')
    expect(snapper.find('option[value="root"]').attributes('disabled')).toBeDefined()
    expect(snapper.element.parentElement?.textContent).toContain('需要标准分离子卷布局')
    await next(wrapper)

    await wrapper.get('input[name="username"]').setValue('root')
    expect((wrapper.get('input[name="username"]').element as HTMLInputElement).value).toBe('user')
    await wrapper.get('input[name="username"]').setValue('alice')
    await next(wrapper)

    expect(wrapper.get('.wizard h1').text()).toBe('确认配置')
    expect(wrapper.get('.review').text()).toContain('CPUAMD')
    expect(wrapper.get('.review').text()).toContain('子卷布局单一根子卷')
    expect(wrapper.get('.review').text()).toContain('用户名alice')

    const params = new URLSearchParams(window.location.search)
    expect(params.get('cpu')).toBe('amd')
    expect(params.get('layout')).toBe('root-only')
    expect(params.get('user')).toBe('alice')

    await next(wrapper)

    expect(wrapper.find('.wizard').exists()).toBe(false)
    expect(wrapper.get('.config-summary').text()).toContain('CPU AMD')
    expect(wrapper.get('.config-summary').text()).toContain('子卷布局 单一根子卷')
    expect(wrapper.text()).toContain('amd-ucode')
    expect(wrapper.html()).not.toContain('btrfs subvolume create /mnt/@boot')

    await wrapper.get('[data-action="edit"]').trigger('click')
    expect(wrapper.get('.wizard h1').text()).toBe('确认配置')
  })

  it('restores shared configuration but still starts on the welcome page', async () => {
    window.history.replaceState(
      null,
      '',
      '/?disk=%2Fdev%2Fsda&cpu=amd&hostname=workstation&user=alice',
    )
    const wrapper = mount(App)

    expect(wrapper.find('.welcome').exists()).toBe(true)
    await start(wrapper)

    expect((wrapper.get('input[name="disk"]').element as HTMLInputElement).value).toBe('/dev/sda')
    expect((wrapper.get('select[name="cpu"]').element as HTMLSelectElement).value).toBe('amd')

    await next(wrapper)
    await next(wrapper)
    expect((wrapper.get('input[name="hostname"]').element as HTMLInputElement).value).toBe(
      'workstation',
    )
    expect((wrapper.get('input[name="username"]').element as HTMLInputElement).value).toBe('alice')
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

async function openGuide(wrapper: VueWrapper) {
  await start(wrapper)
  await next(wrapper)
  await next(wrapper)
  await next(wrapper)
  await next(wrapper)
}
