import { cmd, text } from '../blocks'
import type { Step } from '../types'

export const finishSteps: Step[] = [
  {
    id: 'reboot',
    section: 'finish',
    title: 'finish.reboot.title',
    body: () => [
      text('finish.reboot.unmount'),
      cmd('exit\numount -R /mnt\nreboot'),
      text('finish.reboot.recursive'),
      text('finish.reboot.media'),
    ],
  },
  {
    id: 'post-install',
    section: 'finish',
    title: 'finish.post-install.title',
    body: ({ cfg }) => [
      ...(cfg.desktop === 'hyprland' ? [text('finish.post-install.terminal')] : []),
      text('finish.post-install.network'),
      cmd('ping -c 3 archlinux.org'),
      text('finish.post-install.offline'),
      text('finish.post-install.done'),
    ],
  },
  {
    id: 'secure-boot-shim-verify',
    section: 'finish',
    title: 'finish.secure-boot-shim-verify.title',
    when: (cfg) => cfg.secureBoot === 'shim-mok',
    body: () => [
      cmd(
        'sudo mokutil --sb-state\n' +
          'sudo mokutil --test-key /etc/secureboot/MOK.cer\n' +
          'sudo bootctl --print-loader-path',
      ),
      text('finish.secure-boot-shim-verify.expect'),
    ],
  },
  {
    id: 'tpm2-enroll',
    section: 'finish',
    title: 'finish.tpm2-enroll.title',
    when: (cfg) => cfg.encryption.mode === 'luks2' && cfg.encryption.unlock.method === 'tpm2',
    body: ({ cfg, rootDevice }) => {
      if (cfg.encryption.mode !== 'luks2' || cfg.encryption.unlock.method !== 'tpm2') return []
      const unlock = cfg.encryption.unlock
      const hash = unlock.hashPcrs.join('+')
      const signed = unlock.signedPcrs.join('+')

      return [
        text('finish.tpm2-enroll.intro'),
        cmd(
          `${cfg.secureBoot === 'shim-mok' ? '' : 'sudo bootctl status\n'}sudo systemd-cryptenroll --tpm2-device=auto --tpm2-with-pin=${unlock.pin ? 'yes' : 'no'} --tpm2-pcrs=${hash}${
            signed
              ? ` --tpm2-public-key=/etc/kernel/pcr-initrd.pub.pem --tpm2-public-key-pcrs=${signed}`
              : ''
          } ${rootDevice}\nsudo systemd-cryptenroll ${rootDevice}`,
        ),
        text('finish.tpm2-enroll.slots'),
        text('finish.tpm2-enroll.done'),
      ]
    },
  },
]
