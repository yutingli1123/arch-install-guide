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
  it('rejects a subvolume layout without a root', () => {
    const cfg: Config = { ...defaultConfig, subvolumes: [{ name: '@home', mountPoint: '/home' }] }
    expect(() => derive(cfg)).toThrow()
  })

  it('orders nested subvolumes so parents mount first', () => {
    const points = derive(defaultConfig).nestedSubvolumes.map((s) => s.mountPoint)
    expect(points).toEqual([...points].sort((a, b) => segments(a) - segments(b)))
  })

  it('puts the ESP where the bootloader can read the kernel', () => {
    expect(derive({ ...defaultConfig, kernelImage: 'split' }).espMountPoint).toBe('/boot')
    expect(derive({ ...defaultConfig, kernelImage: 'uki' }).espMountPoint).toBe('/efi')
  })

  it('picks microcode matching the cpu vendor', () => {
    expect(derive({ ...defaultConfig, cpu: 'amd' }).packages).toContain('amd-ucode')
    expect(derive({ ...defaultConfig, cpu: 'intel' }).packages).not.toContain('amd-ucode')
  })

  it('mounts an independent boot subvolume for the UKI layout', () => {
    expect(defaultConfig.subvolumes).toContainEqual({ name: '@boot', mountPoint: '/boot' })
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

  it('keeps every step for the default config', () => {
    expect(selectSteps(defaultConfig)).toHaveLength(steps.length)
  })
})

describe('renderGuide', () => {
  const sections = renderGuide(defaultConfig, 'zh')
  const html = sections.flatMap((s) => s.steps).map((s) => s.html)

  it('renders every step to non-empty html', () => {
    expect(html).toHaveLength(steps.length)
    for (const body of html) expect(body.trim().length).toBeGreaterThan(0)
  })

  it('resolves every interpolated field', () => {
    // A typo in a template literal yields the literal string instead of throwing.
    for (const body of html) expect(body).not.toContain('undefined')
  })

  it('numbers steps continuously across sections', () => {
    const numbers = sections.flatMap((s) => s.steps).map((s) => s.number)
    expect(numbers).toEqual(numbers.map((_, i) => i + 1))
  })

  it('carries the configured disk into the commands', () => {
    const cfg: Config = { ...defaultConfig, disk: '/dev/sda' }
    const rendered = renderGuide(cfg, 'zh')
      .flatMap((s) => s.steps)
      .map((s) => s.html)
      .join('')
    expect(rendered).toContain('/dev/sda1')
    expect(rendered).not.toContain('nvme0n1')
  })

  it('makes command blocks copyable', () => {
    expect(html.join('')).toContain('class="cmd-copy"')
  })

  it('uses concise disk discovery and mounts the ESP with noatime', () => {
    const rendered = html.join('')
    expect(rendered).toContain('<pre><code>lsblk</code></pre>')
    expect(rendered).not.toContain('lsblk -o NAME,SIZE,TYPE,MOUNTPOINTS')
    expect(rendered).toContain('mount --mkdir -o noatime /dev/nvme0n1p1 /mnt/efi')
  })

  it('creates and mounts the boot subvolume', () => {
    const rendered = html.join('')
    expect(rendered).toContain('btrfs subvolume create /mnt/@boot')
    expect(rendered).toContain(
      'mount --mkdir -o subvol=@boot,compress=zstd,noatime /dev/nvme0n1p2 /mnt/boot',
    )
  })

  it('does not write the default us keymap to vconsole.conf', () => {
    expect(html.join('')).not.toContain("echo 'KEYMAP=us'")
  })

  it('writes a non-default keymap to vconsole.conf', () => {
    const rendered = renderGuide({ ...defaultConfig, keymap: 'de-latin1' }, 'zh')
      .flatMap((s) => s.steps)
      .map((s) => s.html)
      .join('')
    expect(rendered).toContain('KEYMAP=de-latin1')
    expect(rendered).toContain('/etc/vconsole.conf')
  })

  it('documents both UKI presets without mentioning fallback_image', () => {
    const rendered = html.join('')
    expect(rendered).toContain("PRESETS=('default' 'fallback')")
    expect(rendered).not.toContain('fallback_image')
  })
})

function segments(path: string): number {
  return path.split('/').filter(Boolean).length
}
