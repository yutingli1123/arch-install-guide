import { packagePurposeRows } from '../../packages'
import type { Context } from '../../types'
import type { ChoiceCatalog, DescriptionCatalog, ProseCatalog, UiCatalog } from '../index'

export const name = '正體中文'
/** Traditional Chinese by script or region: Taiwan, Hong Kong, Macau. */
export const browserTags = ['zh-hant', 'zh-tw', 'zh-hk', 'zh-mo']

/** Traditional Chinese guide prose. Keys left out fall back to the English entry. */
export const prose: ProseCatalog = {
  'live.boot-mode.intro': '從 Arch 安裝媒體開機後，先確認韌體模式：',
  'live.boot-mode.output': '輸出 `64` 表示 64 位元 UEFI，可以繼續。',
  'live.boot-mode.bios':
    '如果提示檔案不存在，表示安裝媒體目前以 BIOS/CSM 模式開機。本指南僅適用於 UEFI；請在韌體設定中關閉 CSM，然後重新啟動安裝媒體。',
  'live.keymap.list': '列出所有可用的配置：',
  'live.keymap.load': '載入所需的配置：',
  'live.network.wired': '有線網路通常已經自動取得位址。驗證連線：',
  'live.network.wireless':
    '無線網路使用 `iwctl` 連線。先查詢無線網路卡名稱，再建立連線；請將 `wlan0` 和 `SSID` 換成實際值：',
  'live.network.verify': '連線後再次執行 `ping` 以確認網路可用。後續步驟需要保持網路連線。',
  'live.network.ssh':
    '如果有第二台裝置，安裝媒體內建的 `sshd` 已經在執行，可以從那台裝置 SSH 進來，在支援複製貼上的終端機裡執行後續指令。使用 `passwd` 設定 root 密碼，再用 `ip a` 查看目前分配到的 IP 位址：',
  'live.network.address': '記下位址後，在第二台裝置上執行 `ssh root@<位址>`。',
  'live.clock.intro': '安裝媒體會自動同步時間。檢查同步狀態：',
  'live.clock.check':
    '`System clock synchronized` 應為 `yes`。系統時間不準確可能導致後續 pacman 簽章驗證失敗。',
  'live.mirrors.intro': ({ cfg }: Context) =>
    `使用 reflector 篩選 ${cfg.reflector.countries.join(',')} 中最近 ${cfg.reflector.ageHours} 小時內同步過的 HTTPS 鏡像站，再依下載速度排序並保留 ${cfg.reflector.number} 個：`,
  'live.mirrors.inspect': '檢查產生的清單：',
  'live.mirrors.https':
    '清單中的每個 `Server` 位址都應以 `https://` 開頭。在安裝媒體中產生的 mirrorlist 會由後續的 `pacstrap` 複製到新系統。',

  'disk.identify.intro': '列出所有區塊裝置：',
  'disk.identify.warning': ({ cfg }: Context) =>
    `本指南以 \`${cfg.disk}\` 為目標磁碟。**下一步會清除該磁碟上的全部資料**。請依容量和型號確認實際目標磁碟就是 \`${cfg.disk}\`；如果裝置名稱不同，請不要繼續執行。`,
  'disk.partition.table': ({ cfg, espDevice, rootDevice }: Context) =>
    '建立 GPT 分割表和兩個分割區：\n\n' +
    '| 分割區 | 大小 | 類型 | 用途 |\n' +
    '| --- | --- | --- | --- |\n' +
    `| \`${espDevice}\` | ${cfg.espSize} | EFI System | ESP，存放核心與開機載入程式 |\n` +
    `| \`${rootDevice}\` | 剩餘全部 | Linux filesystem | btrfs 根 |`,
  'disk.partition.flags':
    '參數由左到右執行：`-o` 清空分割表，`-n 編號:起點:終點` 建立分割區（`0` 表示採用預設值，終點為 `0` 表示使用全部剩餘空間），`-t` 設定類型；`ef00` 是 EFI System，`8300` 是 Linux filesystem。核對結果：',
  'disk.luks.intro': ({ luksName }: Context) =>
    `為根分割區設定 LUKS 密碼，並開啟為 \`/dev/mapper/${luksName}\`：`,
  'disk.luks.slot':
    '此密碼佔用一個獨立的金鑰槽。即使後續設定 TPM2，也必須保留它，在 TPM 狀態變化時作為備用解鎖方式。',
  'disk.format.intro': ({ cfg }: Context) =>
    `將 ESP 格式化為 UEFI 韌體普遍支援的 FAT32 檔案系統，並在${cfg.encryption.mode === 'luks2' ? '已開啟的 LUKS 映射' : '根分割區'}上建立 btrfs：`,
  'disk.subvolumes.create': '先掛載 btrfs 頂層，建立子卷，然後卸載：',
  'disk.subvolumes.table': ({ subvolumes }: Context) =>
    '子卷平鋪在頂層，各自的用途：\n\n' +
    '| 子卷 | 掛載點 |\n' +
    '| --- | --- |\n' +
    subvolumes.map((s) => `| \`${s.name}\` | \`${s.mountPoint}\` |`).join('\n'),
  'disk.subvolumes.snapshots': ({ cfg }: Context) =>
    cfg.subvolumeLayout === 'separated'
      ? '`@log`、`@pkg` 和 `@boot` 均不包含在 `@` 的快照中。此配置可以不設定快照，也可以設定 snapper。'
      : '',
  'disk.mount.intro': '依掛載點的層級依序掛載，最後掛載 ESP：',
  'disk.mount.options': ({ mountOptions }: Context) =>
    `這些掛載選項會由 \`genfstab\` 寫入 fstab。btrfs 子卷使用 \`${mountOptions}\`；ESP 使用 \`noatime\` 避免讀取檔案時更新存取時間，並使用 \`umask=0077\` 限制為僅 root 可存取。`,
  'disk.mount.esp': ({ cfg, espMountPoint }: Context) =>
    `ESP 掛載在 \`${espMountPoint}\`：用於開機的 UKI 最終會產生到此處，韌體和 systemd-boot 需要從 FAT 檔案系統讀取它。${cfg.subvolumeLayout === 'separated' ? '`/boot` 是根 btrfs 檔案系統上的 `@boot` 子卷，只存放 pacman 安裝的 vmlinuz 和 mkinitcpio 的中間產物。' : '`/boot` 是根子卷內的一般目錄。'}`,
  'disk.mount.check': '核對：',
  'disk.mount.count': ({ subvolumes }: Context) =>
    `應該能看到 ${subvolumes.length} 個 btrfs 子卷加一個 ESP。`,

  'live.boot-mode.title': '確認以 UEFI 模式開機',
  'live.keymap.title': '鍵盤配置',
  'live.network.title': '連線網路',
  'live.clock.title': '校時',
  'live.mirrors.title': '選擇鏡像站',
  'disk.identify-disk.title': '確認目標磁碟',
  'disk.partition.title': '分割',
  'disk.luks-format.title': '建立 LUKS2 加密容器',
  'disk.format.title': '格式化',
  'disk.subvolumes.title': '建立子卷',
  'disk.mount.title': '掛載',
  'install.pacstrap.title': '安裝基本系統',
  'install.fstab.title': '產生 fstab',
  'system.chroot.title': '進入新系統',
  'system.timezone.title': '時區',
  'system.locale.title': '本地化',
  'system.hostname.title': '主機名稱',
  'system.root-password.title': 'root 密碼',
  'system.user.title': '建立使用者',
  'system.aur-helper.title': '安裝 AUR 輔助工具',
  'system.network-service.title': '啟用網路',
  'storage.zram.title': '設定 zram',
  'storage.swapfile.title': '建立 swapfile',
  'storage.initramfs-encryption.title': '啟用 systemd initramfs 解鎖',
  'storage.snapper-config.title': '設定 Snapper',
  'storage.pcr-signing-policy.title': '建立 PCR 11 簽章原則',
  'boot.bootloader-install.title': '安裝 systemd-boot',
  'boot.kernel-cmdline.title': '核心命令列',
  'boot.uki.title': '建置 UKI',
  'boot.secure-boot-custom-db.title': '註冊自訂 Secure Boot 金鑰',
  'boot.secure-boot-shim.title': '建立 shim 與 MOK 信任鏈',
  'desktop.graphics-driver.title': '安裝顯示卡驅動程式',
  'desktop.audio.title': '安裝音訊服務',
  'desktop.desktop-common.title': '安裝藍牙、字型與輸入法',
  'desktop.cjk-font-priority.title': '設定字型優先順序',
  'desktop.gnome-kimpanel.title': '啟用 Kimpanel 擴充功能',
  'desktop.kde-fcitx.title': '啟用 KDE 輸入法',
  'desktop.desktop-environment.title': '安裝桌面環境',
  'hyprland.hyprland-extras.title': '安裝配套軟體',
  'hyprland.hyprland-elephant.title': '啟用 Elephant 服務',
  'hyprland.hyprland-programs.title': '設定預設程式',
  'hyprland.hyprland-lock.title': '設定螢幕鎖定與閒置',
  'hyprland.hyprland-wallpaper.title': '設定桌布',
  'hyprland.hyprland-screenshot.title': '設定截圖快捷鍵',
  'hyprland.hyprland-keyring.title': '設定金鑰圈自動解鎖',
  'finish.reboot.title': '重新開機',
  'finish.post-install.title': '進入系統之後',
  'finish.secure-boot-shim-verify.title': '驗證 shim 安全開機',
  'finish.tpm2-enroll.title': '註冊 TPM2 解鎖',
  'section.live': '安裝環境',
  'section.disk': '磁碟',
  'section.install': '安裝系統',
  'section.system': '系統設定',
  'section.storage': '儲存設定',
  'section.boot': '開機',
  'section.desktop': '桌面與顯示卡',
  'section.hyprland': 'Hyprland 配套',
  'section.finish': '收尾',

  'install.pacstrap.purposes': (ctx: Context, t: (key: string) => string) =>
    '`-K` 會在目標系統中建立並初始化新的 pacman 金鑰環，而不是複製安裝媒體中的金鑰環。\n\n套件的用途：\n\n| 套件 | 用途 |\n| --- | --- |\n' +
    packagePurposeRows(ctx, t) +
    '\n\n這一步會下載數百 MB，耗時取決於鏡像站速度。',
  'package.base': '基本系統',
  'package.linux': '核心與韌體',
  'package.btrfs-progs': 'btrfs 工具，根檔案系統需要',
  'package.microcode': 'CPU 微碼，開機時載入',
  'package.cryptsetup': '建立和開啟 LUKS2 加密卷',
  'package.networkmanager': '管理網路連線',
  'package.sudo': '以 root 權限執行指令',
  'package.vim': '編輯設定檔',
  'package.zram-generator': '設定 zram',
  'package.snapper': '管理 btrfs 快照',
  'package.sbctl': '管理自訂 Secure Boot 金鑰並簽署 EFI 檔案',
  'package.systemd-ukify': '產生 UKI，並依設定建立 Secure Boot 或 PCR 11 簽章',
  'package.base-devel': '編譯與打包軟體的基礎工具鏈',
  'package.git': '版本控制，複製程式碼儲存庫',
  'package.secure-boot-tools': '建立 UEFI 開機項目、匯入 MOK 並簽署 EFI 檔案',
  'install.fstab.uuid':
    '`-U` 使用 UUID 而非裝置名稱，確保更換插槽或增加磁碟後仍能掛載正確的檔案系統。\n\n檢查產生的檔案，確認每個子卷都包含正確的 `subvol=` 參數和掛載選項：',
  'install.fstab.check': 'fstab 設定錯誤可能導致系統無法開機，因此請在繼續前仔細核對。',

  'system.chroot.scope':
    '從此步驟到「離開 chroot」為止，所有指令都在新系統中執行。命令提示字元會變為 `[root@archiso /]#`。',
  'system.timezone.hwclock':
    '`hwclock --systohc` 依目前系統時間寫入硬體時鐘，並產生 `/etc/adjtime`。',
  'system.timezone.list': '可以使用 `timedatectl list-timezones` 查詢其他時區名稱。',
  'system.locale.uncomment': ({ cfg }: Context) =>
    `編輯 \`/etc/locale.gen\`，取消 \`en_US.UTF-8\`${
      cfg.systemLocale === 'en_US.UTF-8' ? '' : ` 和 \`${cfg.systemLocale}\``
    } 對應 UTF-8 locale 行的註解：`,
  'system.locale.generate': '產生 locale：',
  'system.locale.lang': '設定系統語言：',
  'system.locale.console': ({ cfg, consoleFont }: Context) =>
    cfg.keymap === 'us'
      ? '設定虛擬主控台字型：'
      : consoleFont
        ? '設定虛擬主控台的鍵盤配置和字型：'
        : '設定虛擬主控台的鍵盤配置：',
  'system.locale.vconsole': ({ consoleFont }: Context) =>
    `${
      consoleFont
        ? '核心內建的主控台字型缺少該語言的部分字母，`FONT=` 選用 kbd 內建、涵蓋拉丁、希臘與基本西里爾字母的字型。'
        : ''
    }\`/etc/vconsole.conf\` 只影響 TTY；桌面環境使用自己的鍵盤配置設定。`,
  'system.user.create': ({ cfg }: Context) =>
    `建立使用者 \`${cfg.username}\` 並將其加入 \`wheel\` 群組：`,
  'system.user.sudo':
    '授予 `wheel` 群組 sudo 權限。執行以下指令開啟編輯器，並刪除 `%wheel ALL=(ALL:ALL) ALL` 所在行開頭的 `#`：',
  'system.user.visudo':
    '必須使用 `visudo`，不要直接編輯 `/etc/sudoers`。`visudo` 會在儲存前檢查語法，避免設定錯誤導致 sudo 無法使用。',
  'system.aur-helper.why':
    '`pacman` 不管理 AUR，手動建置的套件不會隨 `pacman -Syu` 更新，交由 `paru` 管理才能收到後續更新。',
  'system.aur-helper.build': '`paru` 本身也來自 AUR，只能手動建置。AUR 建置必須使用一般使用者：',
  'system.aur-helper.update': '之後用 `paru -Syu` 同時更新官方套件庫和 AUR 套件。',
  'system.network-service.why':
    '如果不啟用該服務，重新開機後新系統將無法自動連線網路。安裝媒體中的網路設定不會保留到新系統。',

  'finish.reboot.unmount': '離開 chroot，卸載全部掛載點，重新開機：',
  'finish.reboot.recursive':
    '`umount -R` 會遞迴卸載全部掛載點，避免 btrfs 中仍有尚未寫入磁碟的資料。',
  'finish.reboot.media': ({ cfg }: Context) =>
    `重新開機前請移除安裝媒體。systemd-boot 選單預設隱藏，系統會直接啟動一般 UKI；如需選擇 fallback，請在開機時按住 Space 叫出選單。進入系統後，使用 \`${cfg.username}\` 登入。`,
  'finish.post-install.terminal': '登入後按 `SUPER + Q` 開啟終端機。',
  'finish.post-install.network': '確認網路：',
  'finish.post-install.offline': ({ cfg }: Context) =>
    `如果網路不通，請${
      cfg.desktop === 'gnome' || cfg.desktop === 'kde'
        ? '在桌面環境內建的設定應用程式中設定網路'
        : '使用 \`nmtui\` 進行設定'
    }。`,
  'finish.post-install.done': ({ cfg }: Context) =>
    `至此，最小系統應該能夠開機和連網，並可使用一般使用者登入。${cfg.snapper === 'none' ? '目前未設定快照。' : ''}`,
  'finish.secure-boot-shim-verify.expect':
    '三條指令應分別確認 Secure Boot 已啟用、MOK 已註冊，並顯示 `/EFI/systemd/grubx64.efi`。',
  'finish.tpm2-enroll.intro': ({ cfg }: Context) =>
    `在安裝後的系統中註冊 TPM2 解鎖${cfg.secureBoot === 'none' ? '。目前未啟用 Secure Boot，PCR 7 只記錄「安全開機關閉」，不能驗證開機檔案的簽章' : ''}：`,
  'finish.tpm2-enroll.slots': ({ cfg }: Context) =>
    `註冊時輸入保留的 LUKS 密碼${cfg.encryption.mode === 'luks2' && cfg.encryption.unlock.method === 'tpm2' && cfg.encryption.unlock.pin ? '，再設定 TPM PIN' : ''}。清單中必須同時保留 \`password\` 槽和新增的 \`tpm2\` token。`,
  'finish.tpm2-enroll.done': '至此，TPM2 解鎖設定完成。',

  'storage.zram.create': '新增 zram-generator 設定檔：',
  'storage.zram.write': '寫入：',
  'storage.zram.result':
    '重新開機後 systemd 會建立容量為實體記憶體一半的壓縮交換裝置 `/dev/zram0`。',
  'storage.zram.sysctl': '新增針對 zram 交換的 sysctl 設定檔：',
  'storage.zram.sysctl-notes':
    '換頁到 zram 的開銷接近記憶體存取，這組參數讓核心更積極地換頁，並關閉只對磁碟 swap 有意義的預讀。參數在下次開機時隨 zram 裝置一同生效。',
  'storage.swapfile.create': ({ cfg }: Context) =>
    `在獨立的 \`@swap\` 子卷中建立 ${cfg.diskSwapSizeGiB} GiB swapfile：`,
  'storage.swapfile.notes':
    '`@swap` 不會包含在根子卷快照中。`--uuid clear` 避免 swapfile 被誤判為可掛載的檔案系統。',
  'storage.initramfs-encryption.edit': '編輯 mkinitcpio 設定檔：',
  'storage.initramfs-encryption.hooks': '在 `HOOKS` 行的 `block` 後加入 `sd-encrypt`：',
  'storage.initramfs-encryption.warning':
    '不要更動該行的其他內容或順序。`systemd` 與 `sd-encrypt` 負責在掛載根檔案系統前開啟 LUKS2。',
  'storage.snapper-config.intro':
    '讓 Snapper 建立設定，再把它自動建立的巢狀快照子卷換成安裝時準備好的頂層子卷：',
  'storage.snapper-config.dbus':
    '安裝時的 chroot 沒有執行 system D-Bus，因此使用 `--no-dbus` 讓 Snapper 直接完成設定。',
  'storage.snapper-config.verify': '核對設定和獨立掛載點：',
  'storage.pcr-signing-policy.key': '建立由 ukify 在每次建置 UKI 時使用的 PCR 簽章金鑰：',
  'storage.pcr-signing-policy.conf': '新增 mkinitcpio 傳給 ukify 的設定檔 `/etc/kernel/uki.conf`：',
  'storage.pcr-signing-policy.write': '寫入：',
  'storage.pcr-signing-policy.phases':
    '`Phases=enter-initrd` 將這套簽章原則限制在 initrd 階段，讓根分割區的解鎖金鑰在切換到主系統後無法再由 TPM 解封。',
  'storage.pcr-signing-policy.rebuild':
    '產生 UKI 時，mkinitcpio 偵測到已安裝的 ukify 後會自動呼叫它，並讀取 `/etc/kernel/uki.conf`。ukify 會在每次核心更新重建 UKI 時重新計算 PCR 11、簽署原則，並把公鑰與簽章嵌入映像檔。',

  'hyprland.hyprland-extras.intro': '安裝所選的 Hyprland 配套軟體：',
  'hyprland.hyprland-extras.global':
    '`--global` 為所有使用者啟用這些使用者服務，它們隨 `hyprland-session.target` 啟動。',
  'hyprland.hyprland-extras.aur': '以下套件以一般使用者建置：',
  'hyprland.hyprland-elephant.why':
    'Walker 本身不檢索資料，啟動前 Elephant 必須已在使用者工作階段中執行。它需要使用者工作階段的環境變數，因此作為使用者服務啟用，而不是系統服務。',
  'hyprland.hyprland-elephant.create': '新增 `/etc/systemd/user/elephant.service`：',
  'hyprland.hyprland-elephant.write': '寫入：',
  'hyprland.hyprland-elephant.enable': '啟用：',
  'hyprland.hyprland-elephant.providers':
    'Walker 的每個資料來源都是獨立的 `elephant-*` 套件，上一步只裝了應用程式清單。計算、檔案、剪貼簿、視窗等其餘資料來源依需要另外安裝，各自的執行期相依由對應套件宣告。',
  'hyprland.hyprland-programs.edit': ({ cfg }: Context) =>
    `編輯 \`/home/${cfg.username}/.config/hypr/hyprland.lua\`：`,
  'hyprland.hyprland-programs.section': '把 `MY PROGRAMS` 區段改為：',
  'hyprland.hyprland-programs.binds': '這三行分別對應 `SUPER + Q`、`SUPER + E` 和 `SUPER + R`。',
  'hyprland.hyprland-lock.copy': '複製 Hyprlock 與 Hypridle 的範例設定檔：',
  'hyprland.hyprland-lock.bind': ({ cfg }: Context) =>
    `在 \`/home/${cfg.username}/.config/hypr/hyprland.lua\` 的 \`KEYBINDINGS\` 區段加入手動鎖定螢幕：`,
  'hyprland.hyprland-lock.brightnessctl':
    '範例 `hypridle.conf` 中調整背光的兩條 listener 依賴 `brightnessctl`，未安裝時它們不會生效，鎖定螢幕、關閉螢幕與暫停不受影響。',
  'hyprland.hyprland-wallpaper.create': ({ cfg }: Context) =>
    `Hyprpaper 沒有預設桌布，需要指定要載入的圖片。新增 \`/home/${cfg.username}/.config/hypr/hyprpaper.conf\`：`,
  'hyprland.hyprland-wallpaper.write': '寫入（`monitor` 留空表示套用到所有螢幕）：',
  'hyprland.hyprland-wallpaper.chown': '修正擁有者：',
  'hyprland.hyprland-screenshot.binds': ({ cfg }: Context) =>
    `在 \`/home/${cfg.username}/.config/hypr/hyprland.lua\` 的 \`KEYBINDINGS\` 區段加入：`,
  'hyprland.hyprland-screenshot.location':
    '截圖會儲存到 `XDG_PICTURES_DIR` 指向的目錄，未設定時儲存到 `~`，同時寫入剪貼簿。',
  'hyprland.hyprland-keyring.edit': '編輯 `/etc/pam.d/greetd`：',
  'hyprland.hyprland-keyring.append': '在檔案結尾加入：',
  'hyprland.hyprland-keyring.unlock':
    '登入密碼會同時解鎖預設金鑰圈。缺少這兩行時金鑰圈仍可使用，但每次存取都要另外輸入密碼。',
  'hyprland.hyprland-keyring.seahorse': 'Seahorse 提供檢視和管理已儲存密碼的圖形介面。',

  'boot.bootloader-install.esp': ({ cfg, espMountPoint }: Context) =>
    `\`bootctl\` 會依序檢查 \`/efi\`、\`/boot\`、\`/boot/efi\` 以定位 ESP，此處會找到 \`${espMountPoint}\`。它會將開機載入程式安裝到 ESP${cfg.secureBoot === 'shim-mok' ? '，但不建立直接指向 systemd-boot 的韌體開機項目；後面只註冊 shim 開機項目' : '、把對應項目放到韌體開機順序的首位'}，並建立 ESP 目錄結構；其中 \`EFI/Linux/\` 是後續 UKI 的輸出位置。`,
  'boot.kernel-cmdline.intro': '核心參數寫進 `/etc/kernel/cmdline`，建置 UKI 時會內嵌進映像檔：',
  'boot.kernel-cmdline.notes': ({ cfg, rootSubvolume }: Context) =>
    `- \`$(blkid ...)\` 會在執行指令時展開為${cfg.encryption.mode === 'luks2' ? ' LUKS2 容器' : ' btrfs'} UUID，不需手動輸入。\n` +
    `- \`rootflags=subvol=${rootSubvolume.name}\` 不可省略。btrfs 預設掛載頂層；缺少該參數時，核心無法定位根子卷。\n` +
    (cfg.zram
      ? '- `zswap.enabled=0` 關閉 Arch 核心預設開啟的 zswap。不關閉時，頁面在到達 zram 前會先被 zswap 快取，被壓縮兩次。\n'
      : '') +
    '- 參數內嵌在映像檔中；之後修改後必須重新執行 `mkinitcpio -P` 才會生效。',
  'boot.kernel-cmdline.verify': '核對展開結果：',
  'boot.uki.preset': '編輯核心的 mkinitcpio preset，將輸出形式從分離映像檔改為 UKI：',
  'boot.uki.edits':
    '依下列方式修改 preset：\n\n' +
    "- 註解 `PRESETS=('default')`，並取消註解 `PRESETS=('default' 'fallback')`，以同時產生一般映像檔和 fallback 映像檔。\n" +
    '- 取消註解 `default_uki` 和 `fallback_uki`。\n' +
    '- 註解 `default_image`。',
  'boot.uki.paths': ({ cfg, espMountPoint }: Context) =>
    `\`default_uki\` 和 \`fallback_uki\` 中的路徑應為 \`${espMountPoint}/EFI/Linux/\`，不需修改。${cfg.encryption.mode === 'none' ? '' : '\n\n前面設定的 systemd initramfs 會把 LUKS2 解鎖邏輯一併放入 UKI。'}`,
  'boot.uki.rebuild': '重新建置：',
  'boot.uki.menu': ({ espMountPoint }: Context) =>
    `systemd-boot 會自動列舉 \`${espMountPoint}/EFI/Linux/\` 中的映像檔並產生開機選單，一般開機項目排在 fallback 之前。fallback 映像檔不做 autodetect 精簡，可在一般映像檔因缺少驅動程式而無法開機時用來救援系統。`,
  'boot.uki.check': '核對：',
  'boot.uki.entries': '應該看到兩個 `type #2` 項目，指向 `EFI/Linux/` 下的兩個映像檔。',
  'boot.secure-boot-custom-db.setup-mode': '確認韌體已進入 Setup Mode，再建立並註冊金鑰：',
  'boot.secure-boot-custom-db.resign':
    '`sbctl status` 必須顯示 Setup Mode；否則進入韌體設定啟用 Setup Mode，具體入口和選項名稱因主機板韌體而異。sbctl 會記錄已簽署的檔案，並在後續核心更新重建 UKI 後重新簽署——但這只涵蓋 UKI，ESP 裡 `EFI/systemd/systemd-bootx64.efi` 和 `EFI/BOOT/BOOTX64.EFI` 這兩份 systemd-boot 二進位檔不會自動更新，需要另外處理。',
  'boot.secure-boot-custom-db.script': '建立 `/usr/local/sbin/update-sbctl-systemd-boot`：',
  'boot.secure-boot-custom-db.run': '執行指令碼：',
  'boot.secure-boot-custom-db.hook': '建立 `/etc/pacman.d/hooks/95-sbctl-systemd-boot.hook`：',
  'boot.secure-boot-shim.install':
    '安裝 Fedora 預先簽署的 `shim-signed`。AUR 操作必須使用一般使用者：',
  'boot.secure-boot-shim.version':
    '`shim-signed` 必須為 16.1 或更新版本，systemd-boot 才能透過 shim 的 loader protocol 載入 MOK 簽署的 UKI。',
  'boot.secure-boot-shim.mok': '建立 MOK：',
  'boot.secure-boot-shim.uki-conf': '編輯 `/etc/kernel/uki.conf`：',
  'boot.secure-boot-shim.uki-append': '加入：',
  'boot.secure-boot-shim.keep-pcr': '如果檔案中已有 PCR 簽章設定，請保留原有內容。',
  'boot.secure-boot-shim.script': '建立 `/usr/local/sbin/update-shim-systemd-boot`：',
  'boot.secure-boot-shim.run': '執行指令碼：',
  'boot.secure-boot-shim.hook': '建立 `/etc/pacman.d/hooks/95-shim-systemd-boot.hook`：',
  'boot.secure-boot-shim.verify': '重新建置 UKI，並核對 systemd-boot 與兩個 UKI 均由 MOK 簽署：',
  'boot.secure-boot-shim.enroll': '建立 shim 開機項目並送出 MOK 註冊請求：',
  'boot.secure-boot-shim.mokmanager':
    '為 `mokutil --import` 設定一次性密碼。重新開機時先進入韌體啟用 Secure Boot，再從 `Arch Linux (shim)` 開機；在 MokManager 中選擇 `Enroll MOK`，輸入一次性密碼並確認。',

  'desktop.graphics-driver.intro': ({ cfg }: Context) =>
    `安裝 ${cfg.graphics.toUpperCase()} 顯示卡所需的套件：`,
  'desktop.graphics-driver.nvidia':
    '`nvidia-open` 適用於 Turing 及更新的架構。Pascal 或更早的顯示卡不要執行此指令，應先依具體型號確認對應的舊版驅動程式。',
  'desktop.audio.intro': '安裝 PipeWire 音訊服務、WirePlumber 工作階段管理員和音量控制介面：',
  'desktop.desktop-common.intro': ({ cfg, inputMethodEngine }: Context) =>
    `安裝 Noto 字型家族（含 CJK、emoji）。${
      cfg.desktop === 'hyprland'
        ? '安裝 BlueZ 藍牙後端與工具、Blueman 管理介面、Fcitx 5、GTK/Qt 前端和設定工具'
        : '安裝 Fcitx 5、GTK/Qt 前端和設定工具'
    }${
      inputMethodEngine === 'fcitx5-chinese-addons'
        ? '；目前的中文 locale 會一併安裝拼音輸入引擎'
        : inputMethodEngine === 'fcitx5-mozc'
          ? '；目前的日文 locale 會一併安裝 Mozc 輸入引擎'
          : inputMethodEngine === 'fcitx5-hangul'
            ? '；目前的韓文 locale 會一併安裝 Hangul 輸入引擎'
            : ''
    }：`,
  'desktop.desktop-common.gnome-ibus':
    'GNOME 會把工作階段的輸入法設定為 ibus，Fcitx 5 由自動啟動項目拉起後取代 ibus，不需設定環境變數。',
  'desktop.desktop-common.kimpanel': '安裝 Kimpanel 擴充功能。AUR 操作必須使用一般使用者：',
  'desktop.desktop-common.kde-env': '為 XWayland 應用程式設定輸入法環境變數：',
  'desktop.desktop-common.write': '寫入：',
  'desktop.desktop-common.gtk':
    'GTK 應用程式改用設定檔指定輸入法模組，只作用於 X11/XWayland 下的 GTK 程式：',
  'desktop.desktop-common.gtk2': ({ cfg }: Context) =>
    `如果要執行 GTK2 程式，另外建立 \`/home/${cfg.username}/.gtkrc-2.0\`：`,
  'desktop.desktop-common.chown': '修正這兩個檔案的擁有者：',
  'desktop.desktop-common.kde-autostart': 'KDE 下 Fcitx 5 由 KWin 啟動，停用 XDG 自動啟動項目：',
  'desktop.cjk-font-priority.create': '新增 `/etc/fonts/conf.d/64-noto-cjk.conf`：',
  'desktop.cjk-font-priority.write': '寫入：',
  'desktop.gnome-kimpanel.enable':
    '首次登入 GNOME 後，在擴充功能管理中啟用 Kimpanel，輸入法候選字視窗才會顯示。',
  'desktop.kde-fcitx.enable': '首次登入 KDE Plasma 後，開啟「系統設定 → 虛擬鍵盤」，選擇 Fcitx 5。',
  'desktop.desktop-environment.intro': ({ desktopName }: Context) => `安裝 ${desktopName}：`,
  'desktop.desktop-environment.greetd':
    '設定 greetd 使用 ReGreet 圖形登入畫面。新增 `/etc/greetd/hyprland.lua`：',
  'desktop.desktop-environment.write': '寫入：',
  'desktop.desktop-environment.greetd-config': '編輯 `/etc/greetd/config.toml`：',
  'desktop.desktop-environment.greetd-command': '將 `[default_session]` 中的 `command` 改為：',
  'desktop.desktop-environment.session-target':
    '新增 `/etc/systemd/user/hyprland-session.target`：',
  'desktop.desktop-environment.session-write': '寫入：',
  'desktop.desktop-environment.copy-config': '複製預設設定檔作為該使用者的 Hyprland 設定：',
  'desktop.desktop-environment.env': '在 `ENVIRONMENT VARIABLES` 區段加入：',
  'desktop.desktop-environment.autostart': '在 `AUTOSTART` 區段加入：',
  'desktop.desktop-environment.display-manager': ({ displayManager }: Context) =>
    `重新開機後由 \`${displayManager}\` 提供圖形登入畫面。`,
}

/** Traditional Chinese interface labels; wording that never changes lives in `neutral.ts`. */
export const ui: UiCatalog = {
  title: 'Arch Linux 安裝指南',
  welcomeTitle: '產生適合你的 Arch Linux 安裝指南',
  welcomeBody: '透過逐步精靈完成系統設定，最後產生一份可以逐項執行和列印的安裝指南。',
  start: '開始設定',
  copy: '複製',
  copied: '已複製',
  print: '儲存為 PDF',
  editConfig: '修改設定',
  installationTarget: '安裝目標',
  diskTutorial: '確認目標磁碟',
  diskTutorialBeforeCommand: '在準備安裝 Arch Linux 的電腦上啟動安裝媒體，然後執行',
  diskTutorialAfterCommand:
    '。依 SIZE 和 TYPE 找到目標整顆磁碟。在固定的 /dev/ 前綴後填寫裝置名稱，例如 nvme0n1 或 sda，不要填寫 nvme0n1p1、sda1 這類分割區名稱。',
  diskEraseWarning: '執行指南中的分割指令將清除目標磁碟上的所有資料，請確認裝置名稱無誤。',
  storage: '儲存',
  regionLanguage: '地區與語言',
  baseSystem: '基礎系統',
  review: '確認設定',
  backToWelcome: '返回首頁',
  previous: '上一步',
  next: '下一步',
  selectPlaceholder: '請選擇',
  unavailable: (reason: string) => `目前無法使用：${reason}`,
  generateGuide: '產生安裝指南',
  wizardProgress: (current: number, total: number) => `第 ${current} 步，共 ${total} 步`,
  verifiedAgainst: '對照 Arch 狀態驗證於',
  configSummary: '本指南設定',
  enabled: '開啟',
  disabled: '關閉',
  none: '無',
  /** Joins the selected add-ons of one group in the configuration summary. */
  listSeparator: '、',
  targetDisk: '目標磁碟',
  diskSwap: '磁碟 swap',
  diskSwapSize: '容量（GiB）',
  subvolumes: '子卷配置',
  encryption: '磁碟加密',
  unlock: '解鎖方式',
  password: '密碼',
  tpmPolicy: 'TPM2 綁定原則',
  requireTpmPin: '開機時要求輸入 TPM PIN',
  pcr7Warning: '僅綁定 PCR 7 不區分具體 UKI；關閉安全開機時只記錄「安全開機關閉」。',
  tpmPolicyRequiresSecureBoot: (mode: string) => `目前的 TPM2 綁定原則要求${mode}`,
  snapperRequiresSeparated: '需要標準分離子卷配置',
  hashPcrs: 'PCR 雜湊綁定',
  signedPcrs: 'PCR 簽章原則',
  secureBoot: '安全開機',
  snapperUnsupportedRootOnly: '單一根子卷不建議使用 Snapper',
  desktop: '桌面環境',
  hyprlandExtras: 'Hyprland 配套',
  hyprlandExtrasHint: 'Hyprland 只提供合成器和工作階段，以下各類均可個別選擇。',
  hyprlandNotifications: '通知中心',
  hyprlandLauncher: '應用程式啟動器',
  hyprlandFileManager: '檔案管理員',
  hyprlandTerminal: '終端機',
  hyprlandBar: '狀態列',
  hyprlandLock: '螢幕鎖定與閒置管理',
  hyprlandWallpaper: '桌布與色溫',
  hyprlandScreenshot: '截圖工具',
  hyprlandKeyring: '金鑰圈',
  graphics: '顯示卡',
  reflector: '鏡像站',
  mirrorCountry: '國家代碼',
  mirrorCountryHint: '可填寫多個 ISO 國家代碼，以半形逗號分隔。',
  mirrorCountryInvalid: '請輸入有效的 ISO 國家代碼，並以半形逗號分隔',
  mirrorAge: '最近同步（小時）',
  mirrorNumber: '保留數量',
  timezone: '時區',
  timezoneHint: '選擇安裝後系統使用的時區。',
  detectedTimezone: (timezone: string) => `偵測到目前時區：${timezone}`,
  useDetectedTimezone: '使用此時區',
  systemLocale: '系統語言',
  systemLocaleHint: '選擇系統服務、終端機和登入畫面預設使用的語言環境。',
  ttyFontWarning:
    'TTY 字型無法顯示該語言的部分或全部字元，會顯示為方框。只有在你明確計畫安裝並使用圖形介面時，才建議選擇它；純命令列系統請選擇主控台能顯示的語言。',
  keymap: '鍵盤配置',
  keymapHint: '選擇安裝環境和虛擬主控台使用的鍵盤配置。',
  hostname: '主機名稱',
  hostnameHint: '這台電腦在本機和網路中使用的名稱，例如 archlinux 或 workstation。',
  username: '使用者名稱',
  usernameHint: '日常登入使用的一般使用者帳號；不能使用 root。',
  language: '介面語言',
  theme: '主題',
  themeAuto: '跟隨系統',
  themeLight: '淺色',
  themeDark: '深色',
  wizardSteps: '設定進度',
  disclaimer: '本站與 Arch Linux 官方無關。',
  stepCount: (total: number) => `共 ${total} 步`,
}

/** Traditional Chinese labels of the wizard options; product names live in `neutral.ts`. */
export const choices: ChoiceCatalog = {
  zram: {
    false: '關閉',
    true: '開啟',
  },
  diskSwap: {
    none: '無',
  },
  subvolumeLayout: {
    'root-only': '單一根子卷（結構簡單）',
    separated: '標準分離子卷（支援快照）',
  },
  encryption: {
    none: '關閉',
    password: 'LUKS2（密碼）',
    tpm2: 'LUKS2（TPM2）',
  },
  tpm2Preset: {
    minimal: '最小（PCR 7）',
    'custom-db': '建議（自訂 db）',
    'shim-mok': '無法自訂 db 時（shim/MOK）',
  },
  secureBoot: {
    none: '關閉',
    'custom-db': '自訂 UEFI db',
  },
  snapper: {
    none: '不設定',
  },
  desktop: {
    none: '無',
  },
  hyprlandNotifications: {
    none: '不安裝',
  },
  hyprlandBar: {
    none: '不安裝',
  },
  hyprlandLock: {
    none: '不安裝',
  },
}

/** Traditional Chinese one-line explanations shown under each wizard option. */
export const choiceDescriptions: DescriptionCatalog = {
  cpu: {
    intel: '安裝 Intel 處理器所需的 intel-ucode 微碼套件。',
    amd: '安裝 AMD 處理器所需的 amd-ucode 微碼套件。',
  },
  zram: {
    false: '不使用 zram。',
    true: '使用 zram，在記憶體中建立壓縮 swap。',
  },
  diskSwap: {
    none: '不設定磁碟 swap。',
    swapfile: '在 Btrfs 檔案系統中設定 swapfile。',
  },
  subvolumeLayout: {
    'root-only': '只建立 @，結構簡單，但不能設定 Snapper。',
    separated:
      '在同一個 Btrfs 檔案系統中，將 /boot、/home、日誌和套件快取放在獨立子卷，控制根快照包含的內容，並允許設定 Snapper。',
  },
  encryption: {
    none: '不加密根檔案系統；ESP 無論選擇哪種模式都不會加密。',
    password: '使用 LUKS2 保護系統資料，每次開機時手動輸入密碼解鎖。',
    tpm2: '使用 LUKS2，由 TPM2 驗證開機狀態；可另外要求輸入 PIN。',
  },
  tpm2Preset: {
    minimal: '雜湊綁定 PCR 7；核心更新不需重新註冊，但不能區分由同一金鑰簽署的映像檔。',
    'custom-db': '綁定 PCR 7，並用簽章原則綁定 PCR 11；同時選擇自訂 UEFI db。',
    'shim-mok':
      '綁定 PCR 7+14，並用簽章原則綁定 PCR 11；同時選擇 shim-signed + MOK，適用於無法註冊自訂憑證的韌體。',
  },
  secureBoot: {
    none: '不驗證開機檔案的簽章。',
    'custom-db': '將自訂憑證註冊到韌體 UEFI db；要求韌體支援 Setup Mode。',
    'shim-mok':
      '適用於無法向 UEFI db 註冊自訂憑證的韌體：透過微軟簽署的 shim 和自行註冊的 MOK 建立信任鏈。',
  },
  snapper: {
    none: '不建立 Snapper 設定。',
    root: '只為根系統建立和管理快照。',
    'root-home': '分別為根系統和 home 建立獨立的快照設定。',
  },
  desktop: {
    none: '只安裝命令列基礎系統；之後仍可自行安裝桌面。',
    gnome: '安裝 GNOME 桌面環境。',
    kde: '安裝 KDE Plasma 桌面環境。',
    hyprland: '安裝 Hyprland Wayland 合成器。',
  },
  graphics: {
    intel: '安裝 Mesa、Intel Vulkan 驅動程式和現代 Intel 內顯的影片加速驅動程式。',
    amd: '安裝 Mesa、AMD Vulkan 驅動程式和 Mesa 影片加速驅動程式。',
    nvidia: '安裝 NVIDIA 開放核心模組和使用者空間驅動程式，適用於 Turing 及更新的架構。',
  },
  hyprlandNotifications: {
    none: '不安裝通知守護程式，應用程式發出的通知不會顯示。',
    swaync: '附通知中心面板，可回顧歷史通知。',
    mako: '僅顯示通知，沒有面板。',
  },
  hyprlandLauncher: {
    hyprlauncher: 'Hyprland 生態系內建的啟動器，也是預設設定裡 SUPER + R 指向的程式。',
    rofi: '同時支援視窗切換、dmenu 輸入等模式。',
    wofi: '只做應用程式啟動，設定項目少。',
    walker: 'GTK4 啟動器，檢索資料由 Elephant 服務提供。',
  },
  hyprlandFileManager: {
    nautilus: 'GNOME 的檔案管理員，隨選安裝 SMB 支援與空白鍵預覽。',
    dolphin: 'KDE 的檔案管理員，隨選安裝縮圖外掛；SMB 支援來自其相依套件 kio-extras。',
    thunar: 'Xfce 的檔案管理員，隨選安裝 GVfs、SMB 支援、縮圖、可卸除式媒體和壓縮檔外掛。',
  },
  hyprlandTerminal: {
    ghostty: 'GPU 繪製的現代終端機。',
    kitty: 'GPU 繪製的現代終端機。',
  },
  hyprlandBar: {
    none: '不安裝狀態列。',
    waybar: '顯示工作區、系統匣和系統狀態，使用發行版內建的預設設定。',
  },
  hyprlandLock: {
    none: '不安裝螢幕鎖定，閒置時不會自動關閉螢幕或暫停。',
    hyprlock: 'Hyprlock 負責鎖定畫面，Hypridle 依閒置時間觸發鎖定螢幕、關閉螢幕和暫停。',
  },
  hyprlandAddons: {
    hyprpaper: '設定桌布，需要指定圖片。',
    hyprsunset: '色溫濾鏡，用 hyprsunset -t 4000 調整。',
    hyprshot: '依區域、視窗或螢幕截圖，同時寫入剪貼簿。',
    'gnome-keyring': '儲存應用程式密碼，可由登入密碼自動解鎖。',
    seahorse: '金鑰圈的圖形管理介面。',
  },
}
