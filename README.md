# Superior Highlighter

Highlight exactly what you select in Obsidian Reading View, using surrounding text to find the right place. Saves native highlights such as `==🔴text==`.

[GitHub repository](https://github.com/owjxyz/Obsidian-Superior-Highlighter) · [Obsidian community listing](https://community.obsidian.md/plugins/superior-highlighter) · By [WooJIN OH (owjxyz)](https://github.com/owjxyz)

[KOREAN](README.ko.md) · [ENGLISH](README.md)

## Features

- **Precise selections.** Highlight part of a sentence, list item, or table cell while preserving surrounding text and colours.
- **Native colours.** Use the floating toolbar or assign shortcuts for six colours, including inside footnote previews.
- **Highlight management.** Search, recolour, remove, merge, convert older HTML highlights, and undo from the current-note navigator.

## Install and use

1. Open **Settings → Community plugins → Browse**, search for **Superior Highlighter**, and install and enable it.
2. Select text in **Reading View** and choose a toolbar action.
3. To use shortcuts, assign keys under **Settings → Hotkeys → Superior Highlighter**.

Manual installation: copy `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/owjxyz/Obsidian-Superior-Highlighter/releases/latest) into `<vault>/.obsidian/plugins/superior-highlighter/`, then enable the plugin.

<details>
<summary>Terminal installation and updates</summary>

Requires Python 3.9+. Close Obsidian and run from your vault folder:

**macOS**

```sh
curl -fsSL https://raw.githubusercontent.com/owjxyz/Obsidian-Superior-Highlighter/main/install.py | python3 -
```

**Windows PowerShell**

```powershell
curl.exe -fsSL https://raw.githubusercontent.com/owjxyz/Obsidian-Superior-Highlighter/main/install.py | py -3 -
```

Use `curl.exe`: PowerShell 5.1 aliases `curl` to a different command. If `py` is unavailable, use `python -` with Python 3.9+. To target another vault, append its quoted path after `python3 -` or `py -3 -`, for example `python3 - "/Users/you/Obsidian Vault"` or `py -3 - "C:\Users\you\Obsidian Vault"`.

The installer downloads the latest stable release, verifies checksums, and backs up changed files. Existing settings are preserved; Reader Highlighter Tags settings are migrated and that plugin is disabled, with its files retained. Shortcuts stay unchanged; personal presets are available through [Obsidian Vault Init](https://github.com/owjxyz/Obsidian-Vault-Init). Run the installer again to update. It excludes preview releases and leaves the vault unchanged if lookup or verification fails.

</details>

## Good to know

- **Shortcut toggles:** the same colour removes the entire containing highlight; a different colour recolours only the selection. The generic highlight toggle removes a containing highlight of any colour. Toolbar colour and removal buttons affect only the selection. These rules apply separately to each selected line or cell.
- **Selection limits:** select the complete visible text of a link or inline-code span, and stay within one note when selecting across embeds. Ambiguous, stale, or unrecognized selections are left unchanged.
- **Smart paragraph selection** selects a full block when enabled; it is off by default.
- **Older notes:** stored tags, footnotes, and quotes remain intact. Tag management, footnote annotation creation, quote copying, global research, exports, PDF support, and reading progress are no longer included. Only supported highlight settings are loaded.

## Data access

The plugin reads and edits the selected note, including an embed's source. It does not scan the vault or process PDFs. Navigator **Copy** writes only the chosen item's text to the clipboard and never reads existing clipboard contents. No note contents, file paths, or clipboard data are sent to a server.

<details>
<summary>Development and release verification</summary>

Requires Node.js and Python:

```sh
npm ci
npm test
npm run typecheck
npm run build
python3 test_metadata.py
python3 test_install.py
```

On Windows, use `py -3` or `python` instead of `python3`.

GitHub Actions builds and tests main-branch updates and version tags, verifies committed checksums, and attests `main.js`, `manifest.json`, and `styles.css`. Tags prepare a release draft; publication is separate. A manual branch run only builds and attests files.

Verify a downloaded asset with `gh attestation verify main.js --repo owjxyz/Obsidian-Superior-Highlighter` (repeat for `manifest.json` and `styles.css`). Only these three files are attached to releases. The terminal installer verifies downloads against the SHA-256 digests provided by the GitHub Releases API; `SHA256SUMS` remains in the repository for CI verification. Existing releases are not changed by this workflow.

</details>

## License

[MIT](LICENSE). An independent fork of [Reader Highlighter Tags](https://github.com/DuckTapeKiller/obsidian-reader-highlighter-tags) by DuckTapeKiller, maintained by WooJIN OH (owjxyz).
