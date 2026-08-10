import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import App from '../App.vue'

describe('configuration summary', () => {
  it('shows selected options and hides fixed or inapplicable details', () => {
    const wrapper = mount(App)
    const summary = wrapper.get('.config-summary').text()

    expect(summary).toContain('swap 无')
    expect(summary).toContain('子卷布局 标准分离子卷')
    expect(summary).toContain('磁盘加密 关闭')
    expect(summary).toContain('安全启动 关闭')
    expect(summary).toContain('snapper 不配置')
    expect(summary).toContain('桌面环境 无')
    expect(summary).not.toContain('sshd')

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
