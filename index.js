#!/usr/bin/env node
import fs from "fs/promises"
import path from "path"
import readline from "readline"

const defaultConfig = {
    ignore: ["node_modules", ".git", "Prompties"],
    useOnly: [],
    maxFileSizeKb: 100,
    outputDir: "./Prompties",
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

const askQuestion = query =>
    new Promise(resolve => 
        rl.question(query, resolve
    )
)

const isMatch = (filename, pattern) => {
    if (pattern.startsWith("*.")) {
        return filename.endsWith(pattern.slice(1))
    }
    return filename === pattern
}

async function runPrompties() {
    console.log("\n** Welcome to Prompties **\n")

    const startMessage = await askQuestion(
        "Starting message (Enter to skip):\n> ",
    )
    const endMessage = await askQuestion("Ending message (Enter to skip):\n> ")
    rl.close()


    let config = { ...defaultConfig }
    try {
        const configFile = await fs.readFile("prompties.json", "utf-8")
        config = { ...config, ...JSON.parse(configFile) }
    } catch (e) {
        console.log("* No prompties.json found. Using default config...")
    }


    const rootDir = process.cwd()
    const filePaths = []
    let treeString = "Project Structure:\n/\n"

    async function crawl(dir, prefix = "") {
        const entries = await fs.readdir(dir, { withFileTypes: true })

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

            const matchesIgnore = config.ignore.some(pattern => isMatch(entry.name, pattern) || isMatch(relPath, pattern))
            const matchesUseOnly = config.useOnly.length > 0 ? config.useOnly.some(pattern => isMatch(entry.name, pattern) || isMatch(relPath, pattern)) : true

            if (matchesIgnore && !(config.useOnly.length > 0 && matchesUseOnly)){
                continue
            }
            if (
                config.useOnly.length > 0 &&
                !matchesUseOnly &&
                !entry.isDirectory()
            ){
                continue
            }

            const branch = isLast ? "└── " : "├── "
            treeString += `${prefix}${branch}${entry.name}\n`

            if (entry.isDirectory()) {
                await crawl(fullPath, prefix + (isLast ? "    " : "│   "))
            } else {
                const stats = await fs.stat(fullPath)
                if (stats.size <= config.maxFileSizeKb * 1024) {
                    filePaths.push(fullPath)
                } else {
                    treeString += `${prefix}    (* Skipped: File exceeds max size)\n`
                }
            }
        }
    }

    await crawl(rootDir)



    let codePayload = "\n### File Contents ###\n\n"
    for (const filePath of filePaths) {
        const relPath = path.relative(rootDir, filePath).replace(/\\/g, "/")
        const content = await fs.readFile(filePath, "utf-8")
        codePayload += `/${relPath}\n`
        codePayload += `${content}\n`
        codePayload += `---------------------------------------------------------------------\n\n`
    }



    let finalPrompt = ""
    if (startMessage.trim()) finalPrompt += `${startMessage}\n\n`
    finalPrompt += `${treeString}\n`
    finalPrompt += codePayload
    if (endMessage.trim()) finalPrompt += `${endMessage}\n`




    try {
        await fs.mkdir(config.outputDir, { recursive: true })
        const dateStr = new Date().toISOString().replace(/T/, " ").replace(/:/g, "-").split(".")[0]
        const outputPath = path.join(config.outputDir, `${dateStr}.txt`)

        await fs.writeFile(outputPath, finalPrompt, "utf-8")
        console.log(`\nSuccess! Your prompt is ready at: ${outputPath}\n`)
    } catch (err) {
        console.error("XX Error saving file:", err)
    }
}

runPrompties()