import { cmd, text } from '../blocks'
import type { Step } from '../types'

export const systemSteps: Step[] = [
  {
    id: 'chroot',
    section: 'system',
    title: 'system.chroot.title',
    body: () => [cmd('arch-chroot /mnt'), text('system.chroot.scope')],
  },
  {
    id: 'timezone',
    section: 'system',
    title: 'system.timezone.title',
    body: ({ cfg }) => [
      cmd(`ln -sf /usr/share/zoneinfo/${cfg.timezone} /etc/localtime\nhwclock --systohc`),
      text('system.timezone.hwclock'),
      text('system.timezone.list'),
    ],
  },
  {
    id: 'locale',
    section: 'system',
    title: 'system.locale.title',
    body: ({ cfg, consoleFont }) => {
      const vconsole = [
        ...(cfg.keymap === 'us' ? [] : [`KEYMAP=${cfg.keymap}`]),
        ...(consoleFont ? [`FONT=${consoleFont}`] : []),
      ]
      return [
        text('system.locale.uncomment'),
        cmd('vim /etc/locale.gen'),
        text('system.locale.generate'),
        cmd('locale-gen'),
        text('system.locale.lang'),
        cmd(`echo 'LANG=${cfg.systemLocale}' > /etc/locale.conf`),
        ...(vconsole.length === 0
          ? []
          : [
              text('system.locale.console'),
              cmd(`printf '${vconsole.join('\\n')}\\n' > /etc/vconsole.conf`),
              text('system.locale.vconsole'),
            ]),
      ]
    },
  },
  {
    id: 'hostname',
    section: 'system',
    title: 'system.hostname.title',
    body: ({ cfg }) => [cmd(`echo '${cfg.hostname}' > /etc/hostname`)],
  },
  {
    id: 'root-password',
    section: 'system',
    title: 'system.root-password.title',
    body: () => [cmd('passwd')],
  },
  {
    id: 'user',
    section: 'system',
    title: 'system.user.title',
    body: ({ cfg }) => [
      text('system.user.create'),
      cmd(`useradd -m -G wheel ${cfg.username}\npasswd ${cfg.username}`),
      text('system.user.sudo'),
      cmd('EDITOR=vim visudo'),
      text('system.user.visudo'),
    ],
  },
  {
    id: 'aur-helper',
    section: 'system',
    title: 'system.aur-helper.title',
    body: ({ cfg }) => [
      text('system.aur-helper.why'),
      text('system.aur-helper.build'),
      cmd(
        `install -d -o ${cfg.username} -g ${cfg.username} /tmp/paru-build\n` +
          `sudo -u ${cfg.username} git clone https://aur.archlinux.org/paru.git /tmp/paru-build/paru\n` +
          'cd /tmp/paru-build/paru\n' +
          `sudo -u ${cfg.username} makepkg -si\n` +
          'cd /',
      ),
      text('system.aur-helper.update'),
    ],
  },
  {
    id: 'network-service',
    section: 'system',
    title: 'system.network-service.title',
    body: () => [cmd('systemctl enable NetworkManager'), text('system.network-service.why')],
  },
]
