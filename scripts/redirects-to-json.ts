#!/usr/bin/env node
import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, "..")
const CSV_PATH = path.join(ROOT, "redirects.csv")
const JSON_PATH = path.join(ROOT, "redirects.json")

type RedirectRow = {
  old_url: string
  new_url: string
  status_code: number
}

function parseCsv(content: string): string[][] {
  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => line.split(",").map(c => c.trim().replace(/^"|"$/g, "")))
}

function main() {
  console.log("Converting redirects.csv -> redirects.json")

  let raw: string
  try {
    raw = fs.readFileSync(CSV_PATH, "utf-8")
    console.log(`✓ Read ${CSV_PATH}`)
  } catch (error) {
    console.error(`✗ Failed to read ${CSV_PATH}:`, error)
    process.exit(1)
  }

  const rows = parseCsv(raw)
  if (!rows.length) {
    console.error("✗ redirects.csv appears to be empty")
    process.exit(1)
  }

  const header = rows[0]
  const oldIdx = header.findIndex(h => h.toLowerCase() === "old_url")
  const newIdx = header.findIndex(h => h.toLowerCase() === "new_url")
  const codeIdx = header.findIndex(h => h.toLowerCase() === "status_code")

  if (oldIdx < 0 || newIdx < 0 || codeIdx < 0) {
    console.error("✗ redirects.csv must have columns old_url,new_url,status_code")
    process.exit(1)
  }

  const redirects: RedirectRow[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const old_url = row[oldIdx]?.trim()
    const new_url = row[newIdx]?.trim()
    const statusRaw = row[codeIdx]?.trim()

    if (!old_url || !new_url || !statusRaw) continue

    const status_code = Number(statusRaw) || 301
    redirects.push({ old_url, new_url, status_code })
  }

  try {
    fs.writeFileSync(JSON_PATH, JSON.stringify(redirects, null, 2) + "\n", "utf-8")
    console.log(`✓ Wrote ${redirects.length} redirects to ${JSON_PATH}`)
  } catch (error) {
    console.error(`✗ Failed to write ${JSON_PATH}:`, error)
    process.exit(1)
  }

  console.log("Done.")
}

main()

