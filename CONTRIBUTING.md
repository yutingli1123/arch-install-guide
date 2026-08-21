# Contributing

## Issues

For a problem in the generated guide, include the share link from the address bar (`?c=…`); it reproduces the exact configuration. For a problem in the wizard, describe the steps and the browser.

## Pull requests

- Branch from `main`; keep one topic per pull request. Pull requests are squash-merged.
- Use `type(scope): subject` commit messages, e.g. `fix(wizard): keep cursor when uppercasing country codes`.
- Before opening a pull request, run `pnpm type-check`, `pnpm test:unit -- --run` and `pnpm format`, and add or update tests for the change.

## Project-specific notes

- Guide text lives in the prose catalogs under `src/guide/i18n/locales/` (`en.ts`, `zh-cn.ts`, `zh-tw.ts`). Step files only reference keys.
- Any change to commands or package names must be verified by performing the installation from the generated guide in a UEFI virtual machine (QEMU with OVMF) before the pull request is opened. State what was verified in the pull request.

## License

By contributing, you agree that your contributions are licensed under the GNU General Public License v3.0, as described in `LICENSE`.
