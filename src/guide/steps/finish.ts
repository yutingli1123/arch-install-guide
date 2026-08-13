import type { Step } from '../types'

export const finishSteps: Step[] = [
  {
    id: 'reboot',
    section: 'finish',
    title: { zh: '重启' },
    body: {
      zh: ({ cfg }) => `离开 chroot，卸载全部挂载点，重启：

\`\`\`
exit
umount -R /mnt
reboot
\`\`\`

\`umount -R\` 会递归卸载全部挂载点，避免 btrfs 中仍有尚未写入磁盘的数据。

重启前请移除安装介质。systemd-boot 菜单默认隐藏，系统会直接启动常规 UKI；如需选择 fallback，请在开机时按住 Space 调出菜单。进入系统后，使用 \`${cfg.username}\` 登录。`,
    },
  },
  {
    id: 'post-install',
    section: 'finish',
    title: { zh: '进系统之后' },
    body: {
      zh: ({ cfg }) => `确认网络：

\`\`\`
ping -c 3 archlinux.org
\`\`\`

如果网络不通，请使用 \`nmtui\` 进行配置。

至此，最小系统应当能够启动和联网，并可使用普通用户登录。${cfg.snapper === 'none' ? '当前未配置快照。' : ''}`,
    },
  },
  {
    id: 'tpm2-enroll',
    section: 'finish',
    title: { zh: '注册 TPM2 解锁' },
    when: (cfg) => cfg.encryption.mode === 'luks2' && cfg.encryption.unlock.method === 'tpm2',
    body: {
      zh: ({ cfg, rootDevice }) => {
        if (cfg.encryption.mode !== 'luks2' || cfg.encryption.unlock.method !== 'tpm2') return ''
        const unlock = cfg.encryption.unlock
        const hash = unlock.hashPcrs.join('+')
        const signed = unlock.signedPcrs.join('+')
        return `确认已经从安装后的 UKI 启动${cfg.secureBoot === 'none' ? '。当前未启用 Secure Boot，PCR 7 只记录“安全启动关闭”，不能验证启动文件签名' : '，并确认 Secure Boot 已启用'}：

\`\`\`
sudo bootctl status
sudo systemd-cryptenroll --tpm2-device=auto --tpm2-with-pin=${unlock.pin ? 'yes' : 'no'} --tpm2-pcrs=${hash}${
          signed
            ? ` --tpm2-public-key=/etc/kernel/pcr-initrd.pub.pem --tpm2-public-key-pcrs=${signed}`
            : ''
        } ${rootDevice}
sudo systemd-cryptenroll ${rootDevice}
\`\`\`

注册时输入保留的 LUKS 密码${unlock.pin ? '，再设置 TPM PIN' : ''}。列表中必须同时保留 \`password\` 槽和新增的 \`tpm2\` token。

至此，TPM2 解锁配置完成。`
      },
    },
  },
]
