# Arch Linux Installation Guide

Generates a step-by-step, printable Arch Linux installation guide from the choices made in a setup wizard. A static front-end with no backend; the configuration lives only in the link.

The interface and the generated guide are available in English, Simplified Chinese and Traditional Chinese.

## Features

Decisions the wizard covers:

- Region: timezone, system locale (glibc list), keyboard layout (30 layouts)
- Storage: btrfs subvolume layout, zram, swapfile, snapper snapshots, LUKS2 encryption (passphrase or TPM2 unlock with PCR policy presets), Secure Boot (custom key database or shim + MOK), UKI
- Base system: hostname, username, desktop (GNOME / KDE / Hyprland with its components), reflector mirror filters
- Installation target: disk, CPU vendor, graphics driver

The generated guide derives `/etc/locale.conf`, `/etc/vconsole.conf` (keyboard layout and, where needed, a console font), the input method engine and OCR language data from the chosen locale; the wizard warns about languages the TTY cannot display.

## Links

The configuration, the current step and the interface language are all encoded in the URL, so copying the address bar shares or resumes a session:

| Parameter | Meaning                                                                 |
| --------- | ----------------------------------------------------------------------- |
| `c`       | Compactly encoded configuration, containing only the choices made       |
| `step`    | Wizard step `1`–`6`, or `guide` to open the generated guide directly    |
| `lang`    | `en` / `zh-cn` / `zh-tw`; defaults to the browser language when absent  |

`c` encodes each choice as its index in the corresponding list. Reordering an option list in `config.ts` makes already shared links resolve to different choices.

## Development

Requires Node.js `^22.18.0 || >=24.12.0` and pnpm.

```sh
pnpm install
pnpm dev          # development server
pnpm test:unit    # Vitest; CI runs pnpm test:unit -- --run
pnpm type-check   # vue-tsc
pnpm format       # oxfmt src/
pnpm build        # type check + build into dist/
```

## Layout

| Path                        | Contents                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| `src/guide/steps/`          | Step definitions per phase: conditions, command blocks, prose keys                          |
| `src/guide/i18n/locales/`   | UI strings and prose catalogs; `en.ts` defines the key set, Chinese files hold translations |
| `src/guide/i18n/neutral.ts` | Names that do not change with the interface language: locale and keymap self-names         |
| `src/guide/config.ts`       | Option lists, draft validation, `Config` assembly, link encoding                            |
| `src/guide/derive.ts`       | Packages, subvolumes, desktop components and other render context derived from `Config`    |
| `src/guide/console.ts`      | Per-locale console font coverage table, deciding whether `FONT=` is written                |
| `src/components/`           | Wizard, guide page, language and theme pickers                                             |

Step text does not live in the step files: steps reference prose keys, and the keys with their English text are defined in `en.ts`. Chinese catalogs may be partial; missing entries fall back to English, while a key absent from `en.ts` is a type error.

`VERIFIED_AGAINST` in `config.ts` is the year and month the guide was last checked against the current state of Arch; it is shown in the guide footer. Update it after re-verifying commands and package names.

## License

This project is licensed under the GNU General Public License v3.0. See [LICENSE](LICENSE).
