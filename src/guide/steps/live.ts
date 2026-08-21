import { cmd, text } from '../blocks'
import type { Step } from '../types'

export const liveSteps: Step[] = [
  {
    id: 'boot-mode',
    section: 'live',
    title: 'live.boot-mode.title',
    body: () => [
      text('live.boot-mode.intro'),
      cmd('cat /sys/firmware/efi/fw_platform_size'),
      text('live.boot-mode.output'),
      text('live.boot-mode.bios'),
    ],
  },
  {
    id: 'keymap',
    section: 'live',
    title: 'live.keymap.title',
    when: (cfg) => cfg.keymap !== 'us',
    body: ({ cfg }) => [
      text('live.keymap.list'),
      cmd('localectl list-keymaps'),
      text('live.keymap.load'),
      cmd(`loadkeys ${cfg.keymap}`),
    ],
  },
  {
    id: 'network',
    section: 'live',
    title: 'live.network.title',
    body: () => [
      text('live.network.wired'),
      cmd('ping -c 3 archlinux.org'),
      text('live.network.wireless'),
      cmd('iwctl station list\niwctl station wlan0 connect SSID'),
      text('live.network.verify'),
      text('live.network.ssh'),
      cmd('passwd\nip a'),
      text('live.network.address'),
    ],
  },
  {
    id: 'clock',
    section: 'live',
    title: 'live.clock.title',
    body: () => [text('live.clock.intro'), cmd('timedatectl'), text('live.clock.check')],
  },
  {
    id: 'mirrors',
    section: 'live',
    title: 'live.mirrors.title',
    body: ({ cfg }) => [
      text('live.mirrors.intro'),
      cmd(
        `reflector --country ${cfg.reflector.countries.join(',')} --age ${cfg.reflector.ageHours} --protocol https --sort rate --number ${cfg.reflector.number} --save /etc/pacman.d/mirrorlist`,
      ),
      text('live.mirrors.inspect'),
      cmd('cat /etc/pacman.d/mirrorlist'),
      text('live.mirrors.https'),
    ],
  },
]
