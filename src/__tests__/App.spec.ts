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
    expect(window.location.search).toBe('')

    await wrapper.get('[data-action="start"]').trigger('click')

    expect(wrapper.get('.wizard h1').text()).toBe('安装目标')
    expect(wrapper.get('.progress').text()).toBe('第 1 步，共 7 步')
    expect(wrapper.get('.tutorial').text()).toContain('TYPE 应为 disk')
    expect(wrapper.get('.tutorial code').text()).toBe('lsblk')
    expect(wrapper.get('.tutorial').text()).toContain('清除所选磁盘上的全部数据')
    expect(wrapper.get('input[name="disk"]').element).toBeInstanceOf(HTMLInputElement)

    const params = new URLSearchParams(window.location.search)
    expect([...params.entries()]).toEqual([['step', '1']])
    expect((wrapper.get('input[name="disk"]').element as HTMLInputElement).value).toBe('')
    expect((wrapper.get('select[name="cpu"]').element as HTMLSelectElement).value).toBe('')
    expect(params.get('step')).toBe('1')
  })

  it('does not advance until the choices on the current page are explicit', async () => {
    const wrapper = mount(App)
    await start(wrapper)
    await next(wrapper)

    expect(wrapper.get('.wizard h1').text()).toBe('安装目标')
    expect([...new URLSearchParams(window.location.search).entries()]).toEqual([['step', '1']])
  })

  it('walks through configuration, review, and the generated guide', async () => {
    const wrapper = mount(App)
    await start(wrapper)

    await wrapper.get('input[name="disk"]').setValue('/dev/nvme0n1')
    await wrapper.get('select[name="cpu"]').setValue('amd')
    await next(wrapper)

    expect(wrapper.get('form').text()).toContain('单一根子卷只创建 @')
    expect(wrapper.get('form').text()).toContain('两者都位于同一个 Btrfs 文件系统')
    expect(wrapper.get('form').text()).toContain('当前不可用：对应安装步骤尚未提供')
    await wrapper.get('select[name="subvolumeLayout"]').setValue('root-only')
    const snapper = wrapper.get('select[name="snapper"]')
    expect(snapper.find('option[value="root"]').attributes('disabled')).toBeDefined()
    expect(snapper.element.parentElement?.textContent).toContain('需要标准分离子卷布局')
    await wrapper.get('select[name="swap"]').setValue('none')
    await wrapper.get('select[name="encryption"]').setValue('none')
    await wrapper.get('select[name="secureBoot"]').setValue('none')
    await wrapper.get('select[name="snapper"]').setValue('none')
    await next(wrapper)

    expect(wrapper.get('.wizard h1').text()).toBe('时区')
    expect(wrapper.find('select[name="timezone"]').exists()).toBe(true)
    await wrapper.get('select[name="timezone"]').setValue('Asia/Shanghai')
    await next(wrapper)

    expect(wrapper.get('.wizard h1').text()).toBe('系统语言')
    expect(wrapper.find('select[name="systemLocale"]').exists()).toBe(true)
    await wrapper.get('select[name="systemLocale"]').setValue('zh_CN.UTF-8')
    await next(wrapper)

    expect(wrapper.get('.wizard h1').text()).toBe('键盘布局')
    expect(wrapper.find('select[name="keymap"]').exists()).toBe(true)
    await wrapper.get('select[name="keymap"]').setValue('de-latin1')
    await next(wrapper)

    await wrapper.get('input[name="hostname"]').setValue('workstation')
    await wrapper.get('input[name="username"]').setValue('root')
    expect((wrapper.get('input[name="username"]').element as HTMLInputElement).value).toBe('')
    await wrapper.get('input[name="username"]').setValue('alice')
    await wrapper.get('select[name="desktop"]').setValue('none')
    await next(wrapper)

    expect(wrapper.get('.wizard h1').text()).toBe('确认配置')
    expect(wrapper.get('.review').text()).toContain('CPUAMD')
    expect(wrapper.get('.review').text()).toContain('子卷布局单一根子卷')
    expect(wrapper.get('.review').text()).toContain('时区Asia/Shanghai')
    expect(wrapper.get('.review').text()).toContain('系统语言zh_CN.UTF-8')
    expect(wrapper.get('.review').text()).toContain('键盘布局de-latin1')
    expect(wrapper.get('.review').text()).toContain('用户名alice')

    const params = new URLSearchParams(window.location.search)
    expect(params.get('cpu')).toBe('amd')
    expect(params.get('layout')).toBe('root-only')
    expect(params.get('user')).toBe('alice')
    expect(params.get('timezone')).toBe('Asia/Shanghai')
    expect(params.get('locale')).toBe('zh_CN.UTF-8')
    expect(params.get('keymap')).toBe('de-latin1')
    expect(params.get('step')).toBe('7')

    await next(wrapper)

    expect(wrapper.find('.wizard').exists()).toBe(false)
    expect(wrapper.get('.config-summary').text()).toContain('CPU AMD')
    expect(wrapper.get('.config-summary').text()).toContain('子卷布局 单一根子卷')
    expect(wrapper.text()).toContain('amd-ucode')
    expect(wrapper.html()).not.toContain('btrfs subvolume create /mnt/@boot')
    expect(new URLSearchParams(window.location.search).get('step')).toBe('guide')

    await wrapper.get('[data-action="edit"]').trigger('click')
    expect(wrapper.get('.wizard h1').text()).toBe('确认配置')
    expect(new URLSearchParams(window.location.search).get('step')).toBe('7')
  })

  it('restores shared configuration at its saved wizard step', () => {
    window.history.replaceState(
      null,
      '',
      '/?disk=%2Fdev%2Fsda&cpu=amd&hostname=workstation&user=alice&step=6',
    )
    const wrapper = mount(App)

    expect(wrapper.get('.wizard h1').text()).toBe('基础系统')
    expect((wrapper.get('input[name="hostname"]').element as HTMLInputElement).value).toBe(
      'workstation',
    )
    expect((wrapper.get('input[name="username"]').element as HTMLInputElement).value).toBe('alice')
    expect(new URLSearchParams(window.location.search).get('step')).toBe('6')
  })

  it('opens a completed shared configuration directly as the guide', () => {
    window.history.replaceState(
      null,
      '',
      '/?disk=%2Fdev%2Fsda&cpu=amd&swap=none&layout=separated&encryption=none&secureBoot=none&snapper=none&desktop=none&timezone=America%2FToronto&locale=en_US.UTF-8&keymap=us&hostname=workstation&user=alice&step=guide',
    )
    const wrapper = mount(App)

    expect(wrapper.find('.welcome').exists()).toBe(false)
    expect(wrapper.find('.wizard').exists()).toBe(false)
    expect(wrapper.get('.config-summary').text()).toContain('CPU AMD')
    expect(wrapper.get('.config-summary').text()).toContain('用户名 alice')
    expect(new URLSearchParams(window.location.search).get('step')).toBe('guide')
  })

  it('does not generate a guide from an incomplete shared configuration', () => {
    window.history.replaceState(null, '', '/?cpu=amd&step=guide')
    const wrapper = mount(App)

    expect(wrapper.find('.guide').exists()).toBe(false)
    expect(wrapper.get('.wizard h1').text()).toBe('安装目标')
    expect(new URLSearchParams(window.location.search).get('cpu')).toBe('amd')
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

async function openGuide(wrapper: VueWrapper) {
  await start(wrapper)
  await wrapper.get('input[name="disk"]').setValue('/dev/nvme0n1')
  await wrapper.get('select[name="cpu"]').setValue('intel')
  await next(wrapper)
  await wrapper.get('select[name="subvolumeLayout"]').setValue('separated')
  await wrapper.get('select[name="swap"]').setValue('none')
  await wrapper.get('select[name="encryption"]').setValue('none')
  await wrapper.get('select[name="secureBoot"]').setValue('none')
  await wrapper.get('select[name="snapper"]').setValue('none')
  await next(wrapper)
  await wrapper.get('select[name="timezone"]').setValue('America/Toronto')
  await next(wrapper)
  await wrapper.get('select[name="systemLocale"]').setValue('en_US.UTF-8')
  await next(wrapper)
  await wrapper.get('select[name="keymap"]').setValue('us')
  await next(wrapper)
  await wrapper.get('input[name="hostname"]').setValue('archlinux')
  await wrapper.get('input[name="username"]').setValue('user')
  await wrapper.get('select[name="desktop"]').setValue('none')
  await next(wrapper)
  await next(wrapper)
}
