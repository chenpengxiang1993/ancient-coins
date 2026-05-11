import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const targetDir = path.join(rootDir, 'docs', 'target')
const outputFile = path.join(rootDir, 'docs', '中国历代金属钱币全集.md')

const fileOrder = [
  'a-先秦钱币.md',
  'b-秦钱币.md',
  'c-汉代钱币.md',
  'd-新莽钱币.md',
  'e-三国钱币.md',
  'f-两晋十六国钱币.md',
  'g-南朝钱币.md',
  'h-北朝钱币.md',
  'i-隋朝钱币.md',
  'j-唐朝钱币.md',
  'k-五代十国钱币.md',
  'l-北宋钱币.md',
  'm-南宋钱币.md',
  'n-辽朝钱币.md',
  'o-金朝钱币.md',
  'p-西夏钱币.md',
  'q-元朝钱币.md',
  'r-明朝钱币.md',
  's-南明钱币.md',
  't-明末农民起义钱币.md',
  'u-清朝钱币.md',
  'v-三藩钱币.md',
  'w-太平天国钱币.md',
  'x-晚清起义钱币.md',
  'y-花钱_压胜钱.md',
  'z-外国钱币.md',
]

const sectionTitles = [
  '先秦时期',
  '秦朝时期',
  '西汉时期',
  '新莽时期',
  '三国时期',
  '两晋十六国时期',
  '南朝时期',
  '北朝时期',
  '隋朝时期',
  '唐朝时期',
  '五代十国时期',
  '北宋时期',
  '南宋时期',
  '辽朝时期',
  '金朝时期',
  '西夏时期',
  '元朝时期',
  '明朝时期',
  '南明时期',
  '明末农民起义时期',
  '清朝时期',
  '三藩时期',
  '太平天国时期',
  '晚清起义时期',
  '花钱与压胜钱',
  '外国钱币',
]

const tableHeader = '| **货币名称** | **历史时期** | **帝王/铸主** | **核心特征** | **2026年小平钱预估价值** | **稀有度评级** |'
const tableDivider = '| --- | --- | --- | --- | --- | --- |'

function splitSections(content) {
  const lines = content.split('\n')
  let summaryLines = []
  let detailLines = []
  let inSummary = true
  let foundDetailStart = false

  for (const line of lines) {
    if (/^#\s+\d+\.\s+.*详细介绍/.test(line)) {
      foundDetailStart = true
      inSummary = false
      continue
    }
    if (/^#\s+\d+\.\s+.*汇总表/.test(line)) continue
    if (inSummary) {
      summaryLines.push(line)
    } else {
      detailLines.push(line)
    }
  }

  if (!foundDetailStart) {
    detailLines = lines
    summaryLines = []
  }

  return { summaryLines, detailLines }
}

function extractTableRows(lines) {
  const rows = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (/^\|\s*\*?\*?货币名称/.test(trimmed)) continue
      if (/^\|\s*[-:]/.test(trimmed)) continue
      rows.push(trimmed)
    }
  }
  return rows
}

function processDetailSection(lines, sectionTitle, sectionIndex) {
  let result = ''
  result += `## ${sectionIndex}. ${sectionTitle}\n\n`

  let content = lines.join('\n').trim()
  if (!content) return result

  content = content.replace(/^##\s+\d+\.\d+\s+.*\n?/gm, '')

  const coinBlocks = content.split(/^###\s+/m).filter(block => {
    return block.split('\n')[0].trim().length > 0
  })

  for (const block of coinBlocks) {
    const firstLine = block.split('\n')[0].trim()
    const body = block.substring(firstLine.length).trim()
    result += `**${firstLine}**\n\n`
    result += body + '\n\n'
  }

  return result
}

// ===== MAIN =====

const perSectionData = []

for (let i = 0; i < fileOrder.length; i++) {
  const filename = fileOrder[i]
  const sectionTitle = sectionTitles[i]
  const sectionIndex = i + 1
  const filePath = path.join(targetDir, filename)

  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`)
    continue
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const { summaryLines, detailLines } = splitSections(content)
  const rows = extractTableRows(summaryLines)

  const detailContent = processDetailSection(detailLines, sectionTitle, sectionIndex)

  perSectionData.push({ sectionIndex, sectionTitle, rows, detailContent })
  console.log(`${sectionTitle}: ${rows.length} rows`)
}

// Build Part 1: split summary tables per dynasty
let summaryPart = ''
for (const sec of perSectionData) {
  if (sec.rows.length === 0) continue
  summaryPart += `### ${sec.sectionIndex}. ${sec.sectionTitle}\n\n`
  summaryPart += `${tableHeader}\n${tableDivider}\n`
  summaryPart += sec.rows.join('\n')
  summaryPart += '\n\n'
}

// Build Part 2: all detail sections
let detailPart = ''
for (const sec of perSectionData) {
  detailPart += sec.detailContent
}

// Final document
let output = `# 中国历代金属钱币全集

> **资料来源说明**：本文档资料主要依据国家文物局、中国钱币博物馆、故宫博物院等官方机构发布的权威文献，结合《中国钱币大辞典》《中国古钱谱》等权威出版物整理而成。价格数据仅供参考，实际交易价格受品相、版别、存世量等因素影响。

---

# 1. 历代钱币汇总表

${summaryPart}> 以上价格仅供参考，实际价格受品相、版别、存世量因素影响。

---

# 2. 历代钱币详细介绍

${detailPart}`

fs.writeFileSync(outputFile, output, 'utf-8')
const stats = fs.statSync(outputFile)
console.log(`\nWritten: ${outputFile}`)
console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
console.log(`Lines: ${output.split('\n').length}`)
