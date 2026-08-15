import { describe, expect, it } from 'vitest'
import {
  completeConfig,
  makeTpm2Encryption,
  parseDraft,
  serializeDraft,
  stageOneConfig,
  validate,
} from '../config'
import { derive, partition } from '../derive'
import { createMarkdown } from '../markdown'
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

describe('command blocks', () => {
  it('marks authored lines while preserving the original copied command', () => {
    const rendered = createMarkdown('复制').render('```\nfirst command\nsecond command\n```')

    expect(rendered).toContain('<span class="cmd-line-number" aria-hidden="true">1</span>')
    expect(rendered).toContain('<span class="cmd-line-number" aria-hidden="true">2</span>')
    expect(rendered).toContain('data-copy="first command\nsecond command"')
  })
})

describe('derive', () => {
  it('provides the two supported subvolume layouts', () => {
    expect(derive({ ...stageOneConfig, subvolumeLayout: 'root-only' }).subvolumes).toEqual([
      { name: '@', mountPoint: '/' },
    ])
    expect(derive(stageOneConfig).subvolumes.map((subvolume) => subvolume.name)).toEqual([
      '@',
      '@boot',
      '@home',
      '@log',
      '@pkg',
    ])
  })

  it('rejects snapshots with the root-only layout', () => {
    expect(() =>
      derive({ ...stageOneConfig, subvolumeLayout: 'root-only', snapper: 'root' }),
    ).toThrow('snapper requires the separated subvolume layout')
  })

  it('picks microcode matching the cpu vendor', () => {
    expect(derive({ ...stageOneConfig, cpu: 'amd' }).packages).toContain('amd-ucode')
    expect(derive({ ...stageOneConfig, cpu: 'intel' }).packages).not.toContain('amd-ucode')
  })

  it('derives graphics and desktop packages independently from storage', () => {
    const kdeOnAmd = derive({ ...stageOneConfig, graphics: 'amd', desktop: 'kde' })
    expect(kdeOnAmd.graphicsPackages).toEqual(['mesa', 'vulkan-radeon', 'libva-mesa-driver'])
    expect(kdeOnAmd.desktopPackages).toEqual(['plasma-meta', 'sddm', 'konsole', 'dolphin'])
    expect(kdeOnAmd.audioPackages).not.toContain('pavucontrol')
    expect(kdeOnAmd.displayManager).toBe('sddm')

    const headless = derive({ ...stageOneConfig, desktop: 'none' })
    expect(headless.desktopPackages).toEqual([])
    expect(headless.audioPackages).toEqual([])
    expect(headless.desktopCommonPackages).toEqual([])
    expect(headless.displayManager).toBeUndefined()

    const hyprland = derive({ ...stageOneConfig, desktop: 'hyprland' })
    expect(hyprland.displayManager).toBe('greetd')
    expect(hyprland.desktopPackages).toEqual(
      expect.arrayContaining(['ghostty', 'hyprpolkitagent', 'greetd', 'greetd-regreet']),
    )
    expect(hyprland.audioPackages).toEqual([
      'pipewire',
      'pipewire-audio',
      'pipewire-alsa',
      'pipewire-pulse',
      'wireplumber',
      'pavucontrol',
    ])
    expect(hyprland.desktopCommonPackages).toEqual([
      'bluez',
      'bluez-utils',
      'blueman',
      'fcitx5-im',
    ])

    const gnomeChinese = derive({
      ...stageOneConfig,
      desktop: 'gnome',
      systemLocale: 'zh_CN.UTF-8',
    })
    expect(gnomeChinese.audioPackages).not.toContain('pavucontrol')
    expect(gnomeChinese.desktopCommonPackages).toContain('fcitx5-rime')
    expect(gnomeChinese.desktopCommonPackages).not.toContain('bluez')
    expect(gnomeChinese.desktopCommonPackages).not.toContain('bluez-utils')
    expect(gnomeChinese.desktopCommonPackages).not.toContain('blueman')

    const kdeJapanese = derive({
      ...stageOneConfig,
      desktop: 'kde',
      systemLocale: 'ja_JP.UTF-8',
    })
    expect(kdeJapanese.desktopCommonPackages).toContain('fcitx5-mozc')
    expect(kdeJapanese.desktopCommonPackages).not.toContain('bluez')
    expect(kdeJapanese.desktopCommonPackages).not.toContain('bluez-utils')
    expect(kdeJapanese.desktopCommonPackages).not.toContain('blueman')
  })

  it('adds zram-generator and renders its configuration only for zram', () => {
    const zram = { ...stageOneConfig, zram: true }
    expect(derive(zram).packages).toContain('zram-generator')
    expect(renderHtml(zram)).toContain('zram-size = ram / 2')
    expect(renderHtml(stageOneConfig)).not.toContain('/etc/systemd/zram-generator.conf')
  })

  it('creates a dedicated uncompressed subvolume for a btrfs swapfile', () => {
    const swapfile = { ...stageOneConfig, diskSwap: 'swapfile' as const, diskSwapSizeGiB: 8 }
    const context = derive(swapfile)
    expect(context.subvolumes[context.subvolumes.length - 1]).toEqual({
      name: '@swap',
      mountPoint: '/swap',
      mountOptions: ['noatime'],
    })
    const rendered = renderHtml(swapfile)
    expect(rendered).toContain('mount --mkdir -o subvol=@swap,noatime')
    expect(rendered).toContain('btrfs filesystem mkswapfile --size 8g --uuid clear')
    expect(rendered).toContain('/swap/swapfile none swap defaults 0 0')
    expect(completeConfig(parseDraft(serializeDraft(swapfile)))).toEqual(swapfile)
  })

  it('configures zram and a disk swapfile together', () => {
    const combined = {
      ...stageOneConfig,
      zram: true,
      diskSwap: 'swapfile' as const,
      diskSwapSizeGiB: 8,
    }
    const rendered = renderHtml(combined)

    expect(derive(combined).packages).toContain('zram-generator')
    expect(rendered).toContain('swap-priority = 100')
    expect(rendered).toContain('/swap/swapfile none swap defaults 0 0')
    expect(completeConfig(parseDraft(serializeDraft(combined)))).toEqual(combined)
  })

  it('creates a sized swap partition and encrypts it when the root is encrypted', () => {
    const plain = { ...stageOneConfig, diskSwap: 'partition' as const, diskSwapSizeGiB: 16 }
    const plainHtml = renderHtml(plain)
    expect(derive(plain).swapDevice).toBe('/dev/nvme0n1p3')
    expect(plainHtml).toContain('-n 2:0:-16G -t 2:8300 -n 3:0:0 -t 3:8200')
    expect(plainHtml).toContain('mkswap /dev/nvme0n1p3')
    expect(plainHtml).toContain('swapon /dev/nvme0n1p3')
    expect(plainHtml).not.toContain('/etc/crypttab')

    const encrypted = {
      ...plain,
      encryption: { mode: 'luks2' as const, unlock: { method: 'password' as const } },
    }
    const encryptedHtml = renderHtml(encrypted)
    expect(encryptedHtml).not.toContain('mkswap /dev/nvme0n1p3')
    expect(encryptedHtml).toContain('PARTUUID=$(blkid -s PARTUUID -o value /dev/nvme0n1p3)')
    expect(encryptedHtml).toContain('/dev/urandom swap,cipher=aes-xts-plain64,size=256')
    expect(encryptedHtml).toContain('/dev/mapper/cryptswap none swap defaults 0 0')
    expect(completeConfig(parseDraft(serializeDraft(encrypted)))).toEqual(encrypted)
  })

  it('derives encrypted storage and snapshot mount points from the final configuration', () => {
    const context = derive({
      ...stageOneConfig,
      encryption: { mode: 'luks2', unlock: { method: 'password' } },
      snapper: 'root-home',
    })

    expect(context.rootDevice).toBe('/dev/nvme0n1p2')
    expect(context.rootFsDevice).toBe('/dev/mapper/cryptroot')
    expect(context.packages).toEqual(expect.arrayContaining(['cryptsetup', 'snapper']))
    expect(context.subvolumes.slice(-2)).toEqual([
      { name: '@snapshots', mountPoint: '/.snapshots' },
      { name: '@home_snapshots', mountPoint: '/home/.snapshots' },
    ])
  })

  it('rejects PCR policies paired with the wrong secure boot path', () => {
    expect(() =>
      derive({
        ...stageOneConfig,
        encryption: makeTpm2Encryption('shim-mok'),
        secureBoot: 'custom-db',
      }),
    ).toThrow('PCR 14 requires shim/MOK secure boot')
  })
})

describe('configuration', () => {
  it('round-trips supported choices through URL search parameters', () => {
    const config: Config = {
      ...stageOneConfig,
      disk: '/dev/sda',
      cpu: 'amd',
      subvolumeLayout: 'root-only',
      timezone: 'Asia/Shanghai',
      systemLocale: 'pt_BR.UTF-8',
      keymap: 'de-latin1',
      hostname: 'workstation',
      username: 'alice',
      graphics: 'nvidia',
      desktop: 'hyprland',
      reflector: { countries: ['GB', 'FR'], ageHours: 6, number: 7 },
    }

    expect(completeConfig(parseDraft(serializeDraft(config)))).toEqual(config)
  })

  it('keeps reflector freshness filtering independent from rate sorting', () => {
    const config = {
      ...stageOneConfig,
      reflector: { countries: ['CA', 'US'], ageHours: 6, number: 12 },
    }
    const rendered = renderHtml(config)
    expect(rendered).toContain(
      'reflector --country CA,US --age 6 --protocol https --sort rate --number 12',
    )
    expect(rendered).not.toContain('--sort age')
    expect(completeConfig(parseDraft(serializeDraft(config)))).toEqual(config)
    expect(
      completeConfig({
        ...config,
        reflector: { ...config.reflector, countries: ['CA', 'CA'] },
      }),
    ).toBeNull()
  })

  it('keeps an untouched draft empty and serializes only explicit choices', () => {
    expect(parseDraft('')).toEqual({})
    expect(serializeDraft({})).toBe('')
    expect(serializeDraft({ cpu: 'amd' })).toMatch(/^c=[A-Za-z0-9_-]+$/)
    expect(serializeDraft({ cpu: 'amd' })).not.toContain('cpu')
    expect(parseDraft(serializeDraft({ cpu: 'amd' }))).toEqual({ cpu: 'amd' })
    expect(parseDraft('?config=v1.Y3B1PWFtZA')).toEqual({})
    expect(completeConfig({})).toBeNull()
  })

  it('keeps a partially completed configuration token compact', () => {
    const query = serializeDraft({
      disk: '/dev/nvme0n1',
      cpu: 'amd',
      zram: false,
      diskSwap: 'none',
      subvolumeLayout: 'root-only',
      encryption: { mode: 'none' },
      secureBoot: 'none',
    })

    expect(query.length).toBeLessThan(30)
    expect(query).not.toContain('nvme')
  })

  it('derives snapper as disabled for the root-only layout', () => {
    const { snapper: _snapper, ...draft } = stageOneConfig
    const config = completeConfig({ ...draft, subvolumeLayout: 'root-only' })

    expect(config?.snapper).toBe('none')
    expect(serializeDraft({ subvolumeLayout: 'root-only' })).not.toContain('layout')
    expect(parseDraft(serializeDraft({ subvolumeLayout: 'root-only', snapper: 'none' }))).toEqual({
      subvolumeLayout: 'root-only',
    })
  })

  it('ignores unsafe URL values and explains unavailable choices', () => {
    const draft = parseDraft(
      serializeDraft({
        disk: '/dev/disk/by-id/../sda',
        timezone: '../etc',
        username: 'root',
        subvolumeLayout: 'root-only',
      }),
    )

    expect(draft.disk).toBeUndefined()
    expect(draft.timezone).toBeUndefined()
    expect(draft.username).toBeUndefined()
    expect(validate(draft)['snapper.root']).toBe('需要标准分离子卷布局')
    expect(parseDraft('?c=invalid!')).toEqual({})
    expect(parseDraft('?cpu=amd&layout=root-only')).toEqual({})
  })

  it('round-trips the complete flagship storage path without flattening its TPM policy', () => {
    const flagship: Config = {
      ...stageOneConfig,
      encryption: makeTpm2Encryption('shim-mok', true),
      secureBoot: 'shim-mok',
      snapper: 'root-home',
    }

    expect(completeConfig(parseDraft(serializeDraft(flagship)))).toEqual(flagship)
    expect(serializeDraft(flagship)).toMatch(/^c=[A-Za-z0-9_-]+$/)
  })

  it('does not complete a recommended TPM policy with a mismatched secure boot mode', () => {
    expect(
      completeConfig({
        ...stageOneConfig,
        encryption: makeTpm2Encryption('custom-db'),
        secureBoot: 'shim-mok',
      }),
    ).toBeNull()
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
  const sections = renderGuide(stageOneConfig, 'zh')
  const bodies = sections.flatMap((section) => section.steps).map((step) => step.html)
  const html = bodies.join('')

  it('renders every step to non-empty html', () => {
    expect(bodies).toHaveLength(selectSteps(stageOneConfig).length)
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
    const rendered = renderHtml({ ...stageOneConfig, disk: '/dev/sda' })
    expect(rendered).toContain('/dev/sda1')
    expect(rendered).not.toContain('nvme0n1')
  })

  it('makes command blocks copyable', () => {
    expect(html).toContain('class="cmd-copy"')
  })

  it('uses concise disk discovery and mounts the ESP for root-only access', () => {
    expect(html).toContain('<span class="cmd-line-text">lsblk</span>')
    expect(html).not.toContain('lsblk -o NAME,SIZE,TYPE,MOUNTPOINTS')
    expect(html).toContain('mount --mkdir -o noatime,umask=0077 /dev/nvme0n1p1 /mnt/efi')
  })

  it('creates and mounts boot before home', () => {
    const bootMount = 'mount --mkdir -o subvol=@boot,compress=zstd,noatime /dev/nvme0n1p2 /mnt/boot'
    const homeMount = 'mount --mkdir -o subvol=@home,compress=zstd,noatime /dev/nvme0n1p2 /mnt/home'

    expect(html).toContain('btrfs subvolume create /mnt/@boot')
    expect(html).toContain(bootMount)
    expect(html.indexOf(bootMount)).toBeLessThan(html.indexOf(homeMount))
  })

  it('keeps boot inside the root subvolume in the root-only layout', () => {
    const rootOnly = renderHtml({ ...stageOneConfig, subvolumeLayout: 'root-only' })

    expect(rootOnly).toContain('btrfs subvolume create /mnt/@')
    expect(rootOnly).not.toContain('btrfs subvolume create /mnt/@boot')
    expect(rootOnly).not.toContain('subvol=@boot')
    expect(rootOnly).toContain('<code>/boot</code> 是根子卷内的普通目录')
  })

  it('only writes vconsole.conf for a non-default keymap', () => {
    const nonDefault = renderHtml({ ...stageOneConfig, keymap: 'de-latin1' })
    expect(html).not.toContain("echo 'KEYMAP=us'")
    expect(html).not.toContain('localectl list-keymaps')
    expect(html).not.toContain('loadkeys us')
    expect(nonDefault).toContain('localectl list-keymaps')
    expect(nonDefault).toContain('loadkeys de-latin1')
    expect(nonDefault).toContain('KEYMAP=de-latin1')
    expect(nonDefault).toContain('/etc/vconsole.conf')
  })

  it('always enables the en_US fallback locale without duplicating the codeset label', () => {
    const chinese = renderHtml({ ...stageOneConfig, systemLocale: 'zh_CN.UTF-8' })

    expect(chinese).toContain('<code>en_US.UTF-8</code> 和 <code>zh_CN.UTF-8</code>')
    expect(chinese).not.toContain('zh_CN.UTF-8 UTF-8')
    expect(html).toContain('取消 <code>en_US.UTF-8</code> 对应 UTF-8 locale 行的注释')
    expect(html).not.toContain('en_US.UTF-8 UTF-8')
  })

  it('documents both UKI presets without mentioning fallback_image', () => {
    expect(html).toContain("PRESETS=('default' 'fallback')")
    expect(html).not.toContain('fallback_image')
    expect(html).toContain('mkdir -p /efi/EFI/Linux')
    expect(html).toContain('data-copy="mkdir -p /efi/EFI/Linux\nmkinitcpio -P"')
  })

  it('renders the password-encrypted path against the opened LUKS mapping', () => {
    const encrypted = renderHtml({
      ...stageOneConfig,
      encryption: { mode: 'luks2', unlock: { method: 'password' } },
    })

    expect(encrypted.indexOf('sgdisk')).toBeLessThan(encrypted.indexOf('cryptsetup luksFormat'))
    expect(encrypted).toContain('mkfs.btrfs -f /dev/mapper/cryptroot')
    expect(encrypted).toContain('rd.luks.name=$(blkid -s UUID -o value /dev/nvme0n1p2)=cryptroot')
    expect(encrypted).toContain(
      '在 <code>HOOKS</code> 行的 <code>block</code> 后添加 <code>sd-encrypt</code>',
    )
    expect(encrypted).toContain('block sd-encrypt filesystems')
    expect(encrypted).not.toContain('HOOKS=(base systemd autodetect')
    expect(encrypted).not.toContain('systemd-cryptenroll --tpm2-device=auto')
  })

  it('renders the flagship TPM, shim, PCR policy, Snapper, and update verification chain', () => {
    const flagship = renderHtml({
      ...stageOneConfig,
      encryption: makeTpm2Encryption('shim-mok'),
      secureBoot: 'shim-mok',
      snapper: 'root-home',
    })

    expect(flagship).toContain('btrfs subvolume create /mnt/@home_snapshots')
    expect(flagship).toContain('snapper --no-dbus -c root create-config /')
    expect(flagship).toContain('snapper --no-dbus -c home create-config /home')
    expect(flagship).toContain('snapper --no-dbus list-configs')
    expect(flagship).toContain('findmnt --mountpoint /.snapshots')
    expect(flagship).toContain('findmnt --mountpoint /home/.snapshots')
    expect(flagship).not.toContain('findmnt /.snapshots /home/.snapshots')
    expect(flagship).not.toContain('install -d -m 700 /etc/kernel')
    expect(flagship).toContain('[PCRSignature:initrd]')
    expect(flagship).toContain('Phases=enter-initrd')
    expect(flagship).toContain('/etc/kernel/uki.conf')
    expect(flagship).not.toContain('/etc/systemd/ukify.conf')
    expect(flagship).not.toContain('加入 <code>--ukify</code>')
    expect(flagship).toContain('shim-signed.git')
    expect(flagship).toContain('--tpm2-pcrs=7+14')
    expect(flagship).toContain('--tpm2-public-key-pcrs=11')
    expect(flagship).toContain('sudo systemd-cryptenroll --tpm2-device=auto')
    expect(flagship).toContain('sudo systemd-cryptenroll /dev/nvme0n1p2')
    expect(flagship).toContain('sudo bootctl status')
    expect(flagship).toContain('至此，TPM2 解锁配置完成')
    expect(flagship).not.toContain('sudo pacman -Syu')
  })

  it('signs installed systemd-boot files without relying on a same-version bootctl update', () => {
    const customDb = renderHtml({
      ...stageOneConfig,
      secureBoot: 'custom-db',
    })

    expect(customDb).toContain('sbctl sign -s /efi/EFI/systemd/systemd-bootx64.efi')
    expect(customDb).toContain('sbctl sign -s /efi/EFI/BOOT/BOOTX64.EFI')
    expect(customDb).not.toContain('\nbootctl update\n')
  })

  it('renders sbctl only for the custom-db secure boot path', () => {
    const custom = renderHtml({ ...stageOneConfig, secureBoot: 'custom-db' })
    expect(custom).toContain('sbctl enroll-keys -m')
    expect(custom).not.toContain('shim-signed.git')
    expect(html).not.toContain('sbctl create-keys')
  })

  it('renders reflector, graphics, and each desktop path without changing storage', () => {
    const gnome = renderHtml({ ...stageOneConfig, desktop: 'gnome', graphics: 'intel' })
    expect(gnome).toContain(
      'reflector --country CA --age 12 --protocol https --sort rate --number 10',
    )
    expect(gnome).toContain('pacman -S mesa vulkan-intel intel-media-driver')
    expect(gnome).toContain('pacman -S gnome')
    expect(gnome).not.toContain('pavucontrol')
    expect(gnome).toContain('systemctl enable gdm')
    expect(gnome).toContain('/etc/environment.d/90-fcitx.conf')
    expect(gnome).toContain('QT_IM_MODULE=fcitx')

    const kde = renderHtml({ ...stageOneConfig, desktop: 'kde', graphics: 'amd' })
    expect(kde).toContain('pacman -S plasma-meta sddm konsole dolphin')
    expect(kde).toContain('systemctl enable sddm')
    expect(kde).toContain(
      'pacman -S pipewire pipewire-audio pipewire-alsa pipewire-pulse wireplumber',
    )
    expect(kde).not.toContain('pavucontrol')
    expect(kde).toContain('/etc/environment.d/90-fcitx.conf')
    expect(kde).toContain('XMODIFIERS=@im=fcitx')
    expect(kde).not.toContain('QT_IM_MODULE=fcitx')
    expect(kde).toContain('系统设置 → 虚拟键盘')

    const hyprland = renderHtml({ ...stageOneConfig, desktop: 'hyprland', graphics: 'nvidia' })
    expect(hyprland).toContain('pacman -S nvidia-open nvidia-utils')
    expect(hyprland).toContain('pacman -S hyprland uwsm ghostty')
    expect(hyprland).toContain('xdg-desktop-portal-hyprland hyprpolkitagent')
    expect(hyprland).toContain('greetd greetd-regreet')
    expect(hyprland).toContain('systemctl enable greetd')
    expect(hyprland).toContain(
      'command = &quot;dbus-run-session start-hyprland -- -c /etc/greetd/hyprland.lua&quot;',
    )
    expect(hyprland).toContain('hl.on(&quot;hyprland.start&quot;, function()')
    expect(hyprland).toContain(
      "hl.exec_cmd(&quot;regreet; hyprctl dispatch 'hl.dsp.exit()'&quot;)",
    )
    expect(hyprland).not.toContain('/etc/greetd/hyprland.conf')
    expect(hyprland).toContain(
      'pacman -S pipewire pipewire-audio pipewire-alsa pipewire-pulse wireplumber pavucontrol',
    )
    expect(hyprland).toContain(
      'pacman -S bluez bluez-utils blueman fcitx5-im',
    )
    expect(hyprland).toContain('systemctl enable bluetooth')
    expect(hyprland).toContain('/home/user/.config/uwsm/env')
    expect(hyprland).toContain('XMODIFIERS=@im=fcitx')
    expect(hyprland).toContain('QT_IM_MODULES=&quot;wayland;fcitx&quot;')
    expect(hyprland).toContain('SDL_IM_MODULE=fcitx')
    expect(hyprland).not.toContain('/etc/environment.d/90-fcitx.conf')
    expect(hyprland).not.toContain('QT_IM_MODULE=fcitx')
    expect(hyprland).not.toContain('GTK_IM_MODULE=fcitx')
    expect(hyprland).not.toContain('系统设置 → 虚拟键盘')
    expect(hyprland).not.toContain('不要全局设置')
    expect(hyprland).not.toContain('polkit-kde-agent')
    expect(hyprland).not.toContain('qt5-wayland')
    expect(hyprland).not.toContain('qt6-wayland')
    expect(hyprland).toContain('systemctl --user enable --now hyprpolkitagent.service')
    expect(hyprland).toContain('start-hyprland')
    expect(hyprland).not.toContain('systemctl enable gdm')
    expect(hyprland).not.toContain('systemctl enable sddm')
  })
})

function renderHtml(cfg: Config): string {
  return renderGuide(cfg, 'zh')
    .flatMap((section) => section.steps)
    .map((step) => step.html)
    .join('')
}
