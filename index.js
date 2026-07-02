#!/usr/bin/env node
import fs from "fs/promises"
import path from "path"
import readline from "readline"
import { createHash } from "crypto"

const defaultConfig = {
    ignore: ["node_modules", ".git", "Prompties", ".promptignore", ".vscode"],
    useOnly: [],
    maxFileSizeKb: 400,
    outputDir: "./Prompties",
    includeHidden: false,
    respectGitignore: true,
    compressOutput: false,
    addMetadata: true,
    includeLineNumbers: false,
    maxDepth: Infinity,
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

const askQuestion = query =>
    new Promise(resolve => {
        rl.question(query, resolve)
    })

const isMatch = (filename, pattern) => {
    if (pattern.startsWith("*.")) {
        return filename.endsWith(pattern.slice(1))
    }
    if (pattern.includes("*")) {
        const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$")
        return regex.test(filename)
    }
    return filename === pattern
}

const shouldIgnore = (filePath, config, rootDir) => {
    const relPath = path.relative(rootDir, filePath).replace(/\\/g, "/")
    const segments = relPath.split("/")
    const fileName = segments[segments.length - 1]

    // Check useOnly first (whitelist)
    if (config.useOnly.length > 0) {
        const matchesUseOnly = config.useOnly.some(pattern =>
            isMatch(fileName, pattern) || isMatch(relPath, pattern)
        )
        if (!matchesUseOnly) return true
    }

    // Check ignore patterns
    const matchesIgnore = config.ignore.some(pattern =>
        isMatch(fileName, pattern) || isMatch(relPath, pattern) ||
        segments.some(seg => isMatch(seg, pattern))
    )

    if (matchesIgnore) return true

    // Check hidden files
    if (!config.includeHidden && fileName.startsWith(".") && fileName !== "." && fileName !== "..") {
        return true
    }

    // Check depth
    if (segments.length > config.maxDepth) return true

    return false
}

const loadGitignore = async (rootDir) => {
    try {
        const content = await fs.readFile(path.join(rootDir, ".gitignore"), "utf-8")
        return content.split("\n")
            .map(line => line.trim())
            .filter(line => line && !line.startsWith("#"))
            .map(line => line.replace(/^\//, ""))
    } catch {
        return []
    }
}

const getFileStats = async (filePath) => {
    try {
        const stats = await fs.stat(filePath)
        return stats
    } catch {
        return null
    }
}

const getFileHash = async (filePath) => {
    try {
        const content = await fs.readFile(filePath)
        return createHash("md5").update(content).digest("hex").substring(0, 8)
    } catch {
        return "unknown"
    }
}

const getLanguage = (filename) => {
    const ext = path.extname(filename).toLowerCase()
    const langMap = {
        ".js": "JavaScript",
        ".ts": "TypeScript",
        ".py": "Python",
        ".java": "Java",
        ".c": "C",
        ".cpp": "C++",
        ".h": "C/C++ Header",
        ".cs": "C#",
        ".go": "Go",
        ".rs": "Rust",
        ".rb": "Ruby",
        ".php": "PHP",
        ".html": "HTML",
        ".css": "CSS",
        ".scss": "SCSS",
        ".json": "JSON",
        ".xml": "XML",
        ".yaml": "YAML",
        ".yml": "YAML",
        ".toml": "TOML",
        ".md": "Markdown",
        ".sh": "Shell",
        ".bash": "Bash",
        ".sql": "SQL",
        ".swift": "Swift",
        ".kt": "Kotlin",
        ".dart": "Dart",
        ".lua": "Lua",
        ".r": "R",
        ".m": "Objective-C",
        ".pl": "Perl",
        ".pm": "Perl",
        ".ex": "Elixir",
        ".exs": "Elixir",
        ".erl": "Erlang",
        ".hs": "Haskell",
        ".clj": "Clojure",
        ".scala": "Scala",
        ".groovy": "Groovy",
        ".vb": "Visual Basic",
        ".fs": "F#",
        ".jl": "Julia",
        ".cr": "Crystal",
        ".nim": "Nim",
        ".zig": "Zig",
        ".v": "V",
        ".vue": "Vue.js",
        ".svelte": "Svelte",
        ".astro": "Astro",
        ".jsx": "React JSX",
        ".tsx": "React TSX",
    }
    return langMap[ext] || "Unknown"
}

async function runPrompties() {
    console.log("\n╔═══════════════════════════════════════╗")
    console.log("║     ✨ Welcome to Prompties ✨       ║")
    console.log("╚═══════════════════════════════════════╝\n")

    // Get user input
    const startMessage = await askQuestion("📝 Starting message (Enter to skip):\n> ")
    const endMessage = await askQuestion("📝 Ending message (Enter to skip):\n> ")
    const customIgnore = await askQuestion("📁 Extra patterns to ignore (comma separated, Enter to skip):\n> ")
    rl.close()

    // Load config
    let config = { ...defaultConfig }
    try {
        const configFile = await fs.readFile("prompties.json", "utf-8")
        config = { ...config, ...JSON.parse(configFile) }
        console.log("✅ Loaded prompties.json")
    } catch (e) {
        console.log("ℹ️  No prompties.json found. Using default config...")
    }

    // Add custom ignore patterns
    if (customIgnore.trim()) {
        const extraIgnores = customIgnore.split(",").map(s => s.trim()).filter(Boolean)
        config.ignore = [...config.ignore, ...extraIgnores]
        console.log(`✅ Added ${extraIgnores.length} custom ignore patterns`)
    }

    // Load .gitignore if enabled
    let gitignorePatterns = []
    if (config.respectGitignore) {
        gitignorePatterns = await loadGitignore(process.cwd())
        if (gitignorePatterns.length > 0) {
            config.ignore = [...config.ignore, ...gitignorePatterns]
            console.log(`✅ Loaded ${gitignorePatterns.length} patterns from .gitignore`)
        }
    }

    // Load .promptignore if exists
    try {
        const promptIgnoreContent = await fs.readFile(".promptignore", "utf-8")
        const promptIgnorePatterns = promptIgnoreContent.split("\n")
            .map(line => line.trim())
            .filter(line => line && !line.startsWith("#"))
        if (promptIgnorePatterns.length > 0) {
            config.ignore = [...config.ignore, ...promptIgnorePatterns]
            console.log(`✅ Loaded ${promptIgnorePatterns.length} patterns from .promptignore`)
        }
    } catch (e) {
        // .promptignore doesn't exist, that's fine
    }

    // Remove duplicates from ignore
    config.ignore = [...new Set(config.ignore)]

    // Stats
    let totalFiles = 0
    let processedFiles = 0
    let skippedFiles = 0
    let totalSize = 0
    const fileTypes = new Map()

    // Crawl directory
    const rootDir = process.cwd()
    const filePaths = []
    let treeString = "📁 Project Structure:\n/\n"

    async function crawl(dir, prefix = "", depth = 0) {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true })

            // Sort: directories first, then files
            entries.sort((a, b) => {
                if (a.isDirectory() === b.isDirectory())
                    return a.name.localeCompare(b.name)
                return a.isDirectory() ? -1 : 1
            })

            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i]
                const isLast = i === entries.length - 1
                const fullPath = path.join(dir, entry.name)
                const relPath = path.relative(rootDir, fullPath)

                // Skip if should ignore
                if (shouldIgnore(fullPath, config, rootDir)) {
                    continue
                }

                totalFiles++

                const branch = isLast ? "└── " : "├── "
                const isDir = entry.isDirectory()
                const icon = isDir ? "📁" : "📄"

                // Check file size
                let sizeInfo = ""
                if (!isDir) {
                    try {
                        const stats = await fs.stat(fullPath)
                        const sizeKb = stats.size / 1024
                        sizeInfo = sizeKb > 1 ? ` (${sizeKb.toFixed(1)}KB)` : ` (${(stats.size / 1024).toFixed(0)}KB)`
                    } catch (e) {
                        sizeInfo = " (?)"
                    }
                }

                treeString += `${prefix}${branch}${icon} ${entry.name}${sizeInfo}\n`

                if (isDir) {
                    await crawl(fullPath, prefix + (isLast ? "    " : "│   "), depth + 1)
                } else {
                    try {
                        const stats = await fs.stat(fullPath)
                        const sizeKb = stats.size / 1024

                        // Update stats
                        const ext = path.extname(entry.name) || "no-extension"
                        fileTypes.set(ext, (fileTypes.get(ext) || 0) + 1)

                        if (sizeKb <= config.maxFileSizeKb) {
                            filePaths.push(fullPath)
                            processedFiles++
                            totalSize += stats.size
                        } else {
                            skippedFiles++
                            treeString += `${prefix}    ⚠️  (Skipped: ${sizeKb.toFixed(1)}KB > ${config.maxFileSizeKb}KB limit)\n`
                        }
                    } catch (e) {
                        skippedFiles++
                    }
                }
            }
        } catch (err) {
            // Silently handle permission errors
            treeString += `${prefix}    ❌ (Error accessing directory)\n`
        }
    }

    console.log("\n🔍 Scanning directory...")
    await crawl(rootDir)

    // Generate metadata
    const metadata = []
    if (config.addMetadata) {
        const now = new Date()
        metadata.push(`Generated: ${now.toLocaleString()}`)
        metadata.push(`Total files scanned: ${totalFiles}`)
        metadata.push(`Files processed: ${processedFiles}`)
        metadata.push(`Files skipped: ${skippedFiles}`)
        metadata.push(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
        metadata.push(`File types: ${Array.from(fileTypes.entries()).sort((a,b) => b[1] - a[1]).slice(0, 10).map(([ext, count]) => `${ext}: ${count}`).join(", ")}`)
        metadata.push(`Max depth: ${config.maxDepth === Infinity ? "unlimited" : config.maxDepth}`)
        metadata.push(`Max file size: ${config.maxFileSizeKb}KB`)
        metadata.push(`Use only: ${config.useOnly.length > 0 ? config.useOnly.join(", ") : "all files"}`)
        if (config.ignore.length > 0) {
            metadata.push(`Ignored patterns: ${config.ignore.slice(0, 10).join(", ")}${config.ignore.length > 10 ? ` and ${config.ignore.length - 10} more` : ""}`)
        }
    }

    // Build code payload
    let codePayload = "\n📄 File Contents\n"
    codePayload += "═══════════════════════════════════════\n\n"

    // Sort files by extension for better organization
    filePaths.sort((a, b) => {
        const extA = path.extname(a)
        const extB = path.extname(b)
        if (extA !== extB) return extA.localeCompare(extB)
        return a.localeCompare(b)
    })

    for (const filePath of filePaths) {
        try {
            const relPath = path.relative(rootDir, filePath).replace(/\\/g, "/")
            const content = await fs.readFile(filePath, "utf-8")
            const lang = getLanguage(filePath)
            const hash = await getFileHash(filePath)
            const stats = await getFileStats(filePath)
            const sizeKb = stats ? (stats.size / 1024).toFixed(1) : "?"

            // File header with metadata
            codePayload += `📁 /${relPath}\n`
            codePayload += `   Language: ${lang}`
            if (config.addMetadata) {
                codePayload += ` | Size: ${sizeKb}KB | Hash: ${hash}`
                if (config.includeLineNumbers) {
                    const lines = content.split("\n").length
                    codePayload += ` | Lines: ${lines}`
                }
            }
            codePayload += "\n"

            // Add line numbers if enabled
            if (config.includeLineNumbers) {
                const lines = content.split("\n")
                const padding = String(lines.length).length
                const numbered = lines.map((line, idx) => {
                    const num = String(idx + 1).padStart(padding, " ")
                    return `${num} │ ${line}`
                }).join("\n")
                codePayload += numbered + "\n"
            } else {
                codePayload += content + "\n"
            }

            codePayload += "───────────────────────────────────────────\n\n"
        } catch (e) {
            codePayload += `❌ Error reading /${path.relative(rootDir, filePath)}\n`
            codePayload += "───────────────────────────────────────────\n\n"
        }
    }

    // Build final prompt
    let finalPrompt = ""

    // Header
    finalPrompt += "╔═══════════════════════════════════════╗\n"
    finalPrompt += "║       PROMPTIES PROJECT DUMP        ║\n"
    finalPrompt += "╚═══════════════════════════════════════╝\n\n"

    if (startMessage.trim()) {
        finalPrompt += startMessage.trim() + "\n\n"
    }

    // Metadata
    if (config.addMetadata && metadata.length > 0) {
        finalPrompt += "📊 Metadata:\n"
        finalPrompt += metadata.map(m => `  • ${m}`).join("\n")
        finalPrompt += "\n\n"
    }

    // Tree
    finalPrompt += treeString + "\n"

    // Contents
    finalPrompt += codePayload

    if (endMessage.trim()) {
        finalPrompt += endMessage.trim() + "\n"
    }

    // Footer
    finalPrompt += "\n═══════════════════════════════════════\n"
    finalPrompt += `Generated by Prompties v1.0\n`
    finalPrompt += `📅 ${new Date().toISOString().replace(/T/, " ").slice(0, 19)}\n`

    // Save
    try {
        await fs.mkdir(config.outputDir, { recursive: true })
        const dateStr = new Date().toISOString().replace(/T/, " ").replace(/:/g, "-").split(".")[0]
        const outputPath = path.join(config.outputDir, `${dateStr}.txt`)

        // Compress output if enabled (remove extra blank lines)
        let outputContent = finalPrompt
        if (config.compressOutput) {
            outputContent = outputContent.replace(/\n{3,}/g, "\n\n")
        }

        await fs.writeFile(outputPath, outputContent, "utf-8")

        // Calculate stats
        const outputSize = (outputContent.length / 1024).toFixed(1)

        console.log("\n" + "═".repeat(50))
        console.log(`✅ SUCCESS! Your prompt is ready`)
        console.log(`📁 Location: ${outputPath}`)
        console.log(`📊 Size: ${outputSize}KB`)
        console.log(`📄 Files processed: ${processedFiles}`)
        console.log(`⏭️  Skipped: ${skippedFiles}`)
        console.log("═".repeat(50) + "\n")
    } catch (err) {
        console.error("\n❌ Error saving file:", err.message)
        process.exit(1)
    }
}

// Global error handler
process.on("uncaughtException", (err) => {
    console.error("\n❌ Unexpected error:", err.message)
    process.exit(1)
})

process.on("unhandledRejection", (err) => {
    console.error("\n❌ Unexpected error:", err.message)
    process.exit(1)
})

runPrompties()
