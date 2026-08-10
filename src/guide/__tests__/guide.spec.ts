import { describe, expect, it } from 'vitest'
import { defaultConfig } from '../config'
import { derive, partition } from '../derive'
import { renderGuide, selectSteps } from '../render'
import { sectionTitles, steps } from '../steps'
import type { Config } from '../types'

describe('partition', () => {
  it('inserts p before the number only for devices that need it', () => {
    expect(partition('/dev/nvme0n1', 1)).toBe('/dev/nvme0n1p1')
    expect(partition('/dev/mmcblk0', 2)).toBe('/dev/mmcblk0p2')
    expect(partition('/dev/sda', 1)).toBe('/dev/sda1')
    expect(partition('/dev/vda', 2)).toBe('/dev/vda2')
  })
})

describe('derive', () => {
  it('provides the two supported subvolume layouts', () => {
    expect(derive({ ...defaultConfig, subvolumeLayout: 'root-only' }).subvolumes).toEqual([
      { name: '@', mountPoint: '/' },
    ])
    expect(derive(defaultConfig).subvolumes.map((subvolume) => subvolume.name)).toEqual([
      '@',
      '@boot',
      '@home',
      '@log',
      '@pkg',
    ])
  })

  it('rejects snapshots with the root-only layout', () => {
    expect(() =>
      derive({ ...defaultConfig, subvolumeLayout: 'root-only', snapper: 'root' }),
    ).toThrow('snapper requires the separated subvolume layout')
  })

  it('orders nested subvolumes so parents mount first', () => {
    const points = derive(defaultConfig).nestedSubvolumes.map((s) => s.mountPoint)
    expect(points).toEqual([...points].sort((a, b) => segments(a) - segments(b)))
  })

  it('picks microcode matching the cpu vendor', () => {
    expect(derive({ ...defaultConfig, cpu: 'amd' }).packages).toContain('amd-ucode')
    expect(derive({ ...defaultConfig, cpu: 'intel' }).packages).not.toContain('amd-ucode')
  })
})

describe('steps', () => {
  it('has unique ids', () => {
    const ids = steps.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only uses sections that have a title', () => {
    for (const step of steps) expect(sectionTitles[step.section]).toBeDefined()
  })
})

describe('renderGuide', () => {
  const sections = renderGuide(defaultConfig, 'zh')
  const bodies = sections.flatMap((section) => section.steps).map((step) => step.html)
  const html = bodies.join('')

  it('renders every step to non-empty html', () => {
    expect(bodies).toHaveLength(selectSteps(defaultConfig).length)
    for (const body of bodies) expect(body.trim().length).toBeGreaterThan(0)
  })

  it('resolves every interpolated field', () => {
    // A typo in a template literal yields the literal string instead of throwing.
    for (const body of bodies) expect(body).not.toContain('undefined')
  })

  it('numbers steps continuously across sections', () => {
    const numbers = sections.flatMap((s) => s.steps).map((s) => s.number)
    expect(numbers).toEqual(numbers.map((_, i) => i + 1))
  })

  it('carries the configured disk into the commands', () => {
    const rendered = renderHtml({ ...defaultConfig, disk: '/dev/sda' })
    expect(rendered).toContain('/dev/sda1')
    expect(rendered).not.toContain('nvme0n1')
  })

  it('makes command blocks copyable', () => {
    expect(html).toContain('class="cmd-copy"')
  })

  it('uses concise disk discovery and mounts the ESP with noatime', () => {
    expect(html).toContain('<pre><code>lsblk</code></pre>')
    expect(html).not.toContain('lsblk -o NAME,SIZE,TYPE,MOUNTPOINTS')
    expect(html).toContain('mount --mkdir -o noatime /dev/nvme0n1p1 /mnt/efi')
  })

  it('creates and mounts boot before home', () => {
    const bootMount = 'mount --mkdir -o subvol=@boot,compress=zstd,noatime /dev/nvme0n1p2 /mnt/boot'
    const homeMount = 'mount --mkdir -o subvol=@home,compress=zstd,noatime /dev/nvme0n1p2 /mnt/home'

    expect(html).toContain('btrfs subvolume create /mnt/@boot')
    expect(html).toContain(bootMount)
    expect(html.indexOf(bootMount)).toBeLessThan(html.indexOf(homeMount))
  })

  it('keeps boot inside the root subvolume in the root-only layout', () => {
    const rootOnly = renderHtml({ ...defaultConfig, subvolumeLayout: 'root-only' })

    expect(rootOnly).toContain('btrfs subvolume create /mnt/@')
    expect(rootOnly).not.toContain('btrfs subvolume create /mnt/@boot')
    expect(rootOnly).not.toContain('subvol=@boot')
    expect(rootOnly).toContain('<code>/boot</code> 是根子卷内的普通目录')
  })

  it('only writes vconsole.conf for a non-default keymap', () => {
    const nonDefault = renderHtml({ ...defaultConfig, keymap: 'de-latin1' })
    expect(html).not.toContain("echo 'KEYMAP=us'")
    expect(html).not.toContain('localectl list-keymaps')
    expect(html).not.toContain('loadkeys us')
    expect(nonDefault).toContain('localectl list-keymaps')
    expect(nonDefault).toContain('loadkeys de-latin1')
    expect(nonDefault).toContain('KEYMAP=de-latin1')
    expect(nonDefault).toContain('/etc/vconsole.conf')
  })

  it('documents both UKI presets without mentioning fallback_image', () => {
    expect(html).toContain("PRESETS=('default' 'fallback')")
    expect(html).not.toContain('fallback_image')
  })
})

function renderHtml(cfg: Config): string {
  return renderGuide(cfg, 'zh')
    .flatMap((section) => section.steps)
    .map((step) => step.html)
    .join('')
}

function segments(path: string): number {
  return path.split('/').filter(Boolean).length
}
