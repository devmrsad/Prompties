# Prompties

**Context packer for AI Chatbots**

Prompties crawls your local workspace, filters out the noise, and bundles your entire codebase into a perfectly structured, AI-readable plaintext file.

Say goodbye to copying and pasting dozens of files manually.

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node->=14.0.0-orange.svg)

---

## Features

- **💬 Interactive Prompts:** Inject custom instructions at the top and bottom of the context payload dynamically during execution.
- **🌳 Auto-Generated File Tree:** Generates an ASCII folder structure so the LLM understands your project architecture *before* reading the code.
- **🔍 Smart Filtering:** Heavily customizable via `prompties.json`. Supports global `ignore` rules and strict `useOnly` whitelists.
- **🛡️ Size Guardrail:** Automatically skips massive binary or text files (like minified bundles or assets) to preserve your AI context window.
- **📦 Clean Separation:** Wraps every file clearly with Unix-style relative paths and standard visual delimiters for maximum LLM comprehension.

---

## Installation & Setup

You can use Prompties either by installing it directly from npm or by loading your own local copy.

### Option A: Global Installation (From npm)
Install the package globally on your system:
```bash
npm install -g @devmrsad/prompties
```

### Option B: Local Link (For Developers)
If you downloaded the source code and want to run or modify it locally without publishing:
1. Navigate into the folder containing `package.json` and `index.js`.
2. Run the linking command:
```bash
   npm link
   ```
   *(Note: On macOS/Linux, you may need to use `sudo npm link` if you encounter permission errors).*

---

## How to Use

Once installed or linked, the `prompties` command becomes available globally across your **entire** system.

### 1. Run the Command
Open your terminal inside the root directory of the codebase you want to bundle, and run:
```bash
prompties
```

### 2. Provide Interactive Flags (Terminal Prompts)
Prompties will run interactively and ask you two questions:
* **Starting message:** Type what you want the AI to do with your code (e.g., `Review this code for memory leaks and security vulnerabilities.`).
    * * You can press **Enter** for empty.*
* **Ending message:** Type any closing instructions or constraints (e.g., `Fix the bugs methodically, keeping performance in mind.`).
    * * Again, press **Enter** for empty.*

### 3. Collect the Output
If the execution completes with no errors, a brand new directory named `/Prompties` will be generated in your project root. Inside, you will find a cleanly timestamped text file:

```text
📂 Your-Project/
└── 📂 Prompties/
    └── 📄 2026-06-13 15-30-00.txt  <-- Your complete AI prompt is here
```

Open this file, copy its contents, and drop it straight into ChatGPT, Claude, Gemini, or any other LLM.

---

## Configuration (`prompties.json`)

To customize how Prompties parses your codebase, create a `prompties.json` file in the root directory of your target project.

### Example Configuration File
```json
{
  "ignore": [
    "node_modules",
    ".git",
    "Prompties",
    "package-lock.json",
    "*.png",
    "*.jpg",
    "*.ico"
  ],
  "useOnly": [],
  "maxFileSizeKb": 100,
  "outputDir": "./Prompties"
}
```

### Configuration Options Breakdown

| Key | Type | Description | Default Fallback |
| :--- | :--- | :--- | :--- |
| `ignore` | `Array` | Folder names, file names, or wildcard patterns (`*.ext`) to completely skip during compilation. | `["node_modules", ".git", "Prompties"]` |
| `useOnly` | `Array` | **Strict Whitelist.** If populated, it overrides the `ignore` list. *Only* files matching these patterns will be collected. | `[]` |
| `maxFileSizeKb` | `Number` | Skips any individual file larger than this limit to prevent blowing past AI token limits. | `100` |
| `outputDir` | `String` | The target path where your compiled text files will save. | `"./Prompties"` |

---

## 📄 Output Template Example

The generated text file formats your codebase into an optimized layout that modern LLMs are highly trained to parse:

```text
[Your Interactive Starting Message Here]

Project Structure:
/
├── src
│   ├── index.js
│   └── styles.css
└── package.json

### File Contents ###

/src/index.js
console.log("Hello AI!");
---------------------------------------------------------------------

/src/styles.css
body { margin: 0; }
---------------------------------------------------------------------

[Your Interactive Ending Message Here]
```

---

## Troubleshooting & Notes

- **Windows Path Compatibility:** Prompties automatically forces backward slashes (`\`) into clean Unix-style forward slashes (`/`) in the output file tree and headers so LLMs don't get confused by mixed environment layouts.
- **File Name Restrictions:** Output text files swap out standard date colons (`:`) for dashes (`-`) to ensure perfect compatibility with Windows file-naming systems.
- **Missing Config:** If no `prompties.json` is found in the directory you run it in, Prompties safely resorts to its default fallback settings without crashing.

---
*Built by [Mohammadreza Sa.](https://github.com/devmrsad)*