# Prompties

**Context packer for AI Chatbots — now smarter, faster, and more informative.**

Prompties crawls your project, respects your ignore rules, and bundles your entire codebase into an AI-optimized text prompt. Version 1.0 brings deep metadata, language detection, and powerful new configuration options — all without breaking your existing setup.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node->=14.0.0-orange.svg)

---

## 🚀 Quick Start

Run Prompties instantly in any project folder — no installation needed.

```bash
npx @devmrsad/prompties
```

That’s it. Answer the interactive prompts (or skip them) and your ready‑to‑paste prompt will appear inside a new `Prompties/` directory.

---

## 📦 Alternative: Local Link (For Developers)

If you cloned the repo and want to run or modify Prompties locally:

```bash
npm link
```

After linking, you can run the command as `prompties` anywhere. (On macOS/Linux you might need `sudo` if you hit permission errors).

---

## 🧠 Usage Tutorial

### 1. Basic Run

Open a terminal at your project root and launch Prompties. You’ll see a friendly banner and three optional questions:

```
📝 Starting message (Enter to skip):
> Review this code for bugs and suggest improvements.

📝 Ending message (Enter to skip):
> Keep the suggestions practical and focused.

📁 Extra patterns to ignore (comma separated, Enter to skip):
> *.log, temp/
```

- **Starting / Ending messages** – bookend the AI prompt with your instructions.
- **Extra ignore patterns** – on‑the‑fly additions to the ignore list. Separate multiple entries with commas.

All three prompts can be left empty.

### 2. Output

A timestamped file is saved in `./Prompties/` (configurable). Open it, copy everything, and paste directly into ChatGPT, Claude, Gemini, or any LLM.

```
📂 your-project/
└── 📂 Prompties/
    └── 📄 2026-06-29 14-05-23.txt   ← your ready-to-use prompt
```

### 3. Using `.promptignore`

For project‑specific exclusions that shouldn’t pollute your main `prompties.json`, create a `.promptignore` file at the root. It uses the same pattern syntax as `.gitignore`:

```gitignore
# .promptignore
*.test.js
fixtures/
temp-*
```

Prompties automatically picks up these patterns and merges them with the rest of the ignore list.

### 4. Leveraging `.gitignore`

By default, Prompties honours your existing `.gitignore` rules — no extra config needed. All patterns inside `.gitignore` are added to the ignore list, so things like `node_modules` are never accidentally bundled.

If you want to disable this behaviour, set `"respectGitignore": false` in your config.

### 5. Adding Metadata and Line Numbers

Two new configuration switches make the output even more useful:

- `addMetadata` — includes project stats (file count, sizes, language breakdown, MD5 hashes, etc.) at the top of the prompt.
- `includeLineNumbers` — prefixes every line of code with a line number, making it easy to reference specific lines in conversations with the AI.

Both can be toggled in `prompties.json` (see below).

---

## ⚙️ Configuration (`prompties.json`)

Place a `prompties.json` file in your project root to override defaults. All keys are optional — missing values fall back to safe defaults.

### Full Configuration Example

```json
{
  "ignore": [
    "node_modules",
    ".git",
    "Prompties",
    "*.log",
    "temp/"
  ],
  "useOnly": [],
  "maxFileSizeKb": 200,
  "outputDir": "./Prompties",
  "includeHidden": false,
  "respectGitignore": true,
  "compressOutput": false,
  "addMetadata": true,
  "includeLineNumbers": false,
  "maxDepth": 20
}
```

### Options Table

| Key | Type | Default | Description |
|:---|:---|:---|:---|
| `ignore` | `Array` | `["node_modules", ".git", "Prompties"]` | Files, folders, or wildcard patterns (`*.ext`) to skip. Also automatically includes entries from `.promptignore` and `.gitignore` (when `respectGitignore` is `true`). |
| `useOnly` | `Array` | `[]` | Whitelist mode — when populated, **only** files matching these patterns are included. Overrides `ignore`. |
| `maxFileSizeKb` | `Number` | `200` | Skip files larger than this size (in KB) to stay within AI token limits. |
| `outputDir` | `String` | `"./Prompties"` | Where to save the generated prompt files. |
| `includeHidden` | `Boolean` | `false` | Whether to include dotfiles (e.g., `.env`, `.gitignore`). |
| `respectGitignore` | `Boolean` | `true` | Load and apply patterns from the project’s `.gitignore`. |
| `compressOutput` | `Boolean` | `false` | Remove excessive blank lines from the final prompt (keeps the output compact). |
| `addMetadata` | `Boolean` | `true` | Append a metadata block with project stats, language counts, hashes, and file sizes. |
| `includeLineNumbers` | `Boolean` | `false` | Add line numbers to every file in the output. |
| `maxDepth` | `Number` | `Infinity` | Maximum folder depth for traversal. Useful for very deep directory trees. |

---

## 📄 Output Template Example

Here’s what a generated prompt looks like (with `addMetadata` and tree icons enabled):

```text
╔═══════════════════════════════════════╗
║       PROMPTIES PROJECT DUMP        ║
╚═══════════════════════════════════════╝

Review this code for bugs and suggest improvements.

📊 Metadata:
  • Generated: 6/29/2026, 2:05:23 PM
  • Total files scanned: 247
  • Files processed: 189
  • Files skipped: 58
  • Total size: 12.45 MB
  • File types: .js: 78, .css: 34, .json: 23, .html: 19, .md: 12
  • Max depth: 20
  • Max file size: 200KB
  • Use only: all files
  • Ignored patterns: node_modules, .git, Prompties, .promptignore, ... and 5 more

📁 Project Structure:
/
├── 📁 src
│   ├── 📁 components
│   │   ├── 📄 Header.js (2.3KB)
│   │   └── 📄 Footer.js (1.1KB)
│   ├── 📄 index.js (4.7KB)
│   └── 📄 styles.css (3.2KB)
└── 📄 package.json (0.8KB)

📄 File Contents
═══════════════════════════════════════

📁 /src/index.js
   Language: JavaScript | Size: 4.7KB | Hash: a1b2c3d4
───────────────────────────────────────────
console.log("Hello World!");
───────────────────────────────────────────

📁 /src/styles.css
   Language: CSS | Size: 3.2KB | Hash: f0e1d2c3
───────────────────────────────────────────
body { margin: 0; }
───────────────────────────────────────────

Keep the suggestions practical and focused.

═══════════════════════════════════════
✨ Generated by Prompties v1.0.0
📅 2026-06-29 14:05:23
```

---

## 🆕 What’s New in v1.0

This release is a massive leap from the original 0.x series. Here’s everything you’re getting:

- **Smart ignore system**  
  `.promptignore` support, automatic `.gitignore` integration, and runtime extra‑pattern input. Wildcards (`*`) now work everywhere.

- **Rich metadata block**  
  Project statistics, per‑file language detection (40+ languages), file size, MD5 hashes, and line counts — all optional.

- **Line numbers**  
  Reference code by line directly in your AI conversations.

- **Better output organisation**  
  Files are sorted by extension, and tree view now includes emoji icons and file sizes.

- **New configuration options**  
  Control hidden files, output compression, maximum depth, and more.

- **Enhanced performance & error handling**  
  Faster directory crawling, memory‑efficient processing, and graceful handling of permission errors.

- **Full backward compatibility**  
  Existing `prompties.json` files work without any changes.

---

## 💡 Tips & Tricks

- **Whitelist mode**: Set `"useOnly": ["*.js", "*.ts"]` to bundle only JavaScript and TypeScript files.
- **Deep projects**: Use `"maxDepth": 5` to limit traversal and keep the prompt focused on top‑level logic.
- **Compressed output**: Enable `"compressOutput": true` if you’re hitting AI character limits and want to strip extra blank lines.
- **Hidden files**: Need to include a `.env.example`? Toggle `"includeHidden": true`.
- **Per‑run ignores**: Don’t want to edit a config file? Pass patterns interactively when Prompties starts.

---

## 🔧 Troubleshooting

- **Windows paths** – All backslashes are automatically converted to forward slashes in the output.
- **Timestamp naming** – Colons in the file name are replaced by dashes to keep Windows happy.
- **Missing config** – Running without `prompties.json` is completely safe; defaults kick in.
- **Large repos** – Files larger than `maxFileSizeKb` are skipped with a note in the tree, so prompts never balloon unexpectedly.

---

*Maintained by [Mohammadreza Sa.](https://github.com/devmrsad)*
*- PRs are welcome. Feel free to contribute*