import { readFileSync, writeFileSync } from 'fs';

function extractCells(rowHtml, tag) {
  const cells = [];
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'g');
  let match;
  while ((match = regex.exec(rowHtml)) !== null) {
    let content = match[1]
      .replace(/<h4>([\s\S]*?)<\/h4>/g, '**$1**')
      .replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**')
      .replace(/<[^>]+>/g, '')
      .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .trim();
    cells.push(content);
  }
  return cells;
}

function convertHtmlTableToMarkdown(htmlTable) {
  const headerMatch = htmlTable.match(/<thead>([\s\S]*?)<\/thead>/);
  const bodyMatch = htmlTable.match(/<tbody>([\s\S]*?)<\/tbody>/);

  if (!headerMatch) return htmlTable;

  const headerCells = extractCells(headerMatch[1], 'th');

  const bodyRows = [];
  if (bodyMatch) {
    const rows = bodyMatch[1].match(/<tr>([\s\S]*?)<\/tr>/g);
    if (rows) {
      for (const row of rows) {
        const cells = extractCells(row, 'td');
        bodyRows.push(cells);
      }
    }
  }

  const colCount = headerCells.length;
  let md = '';
  md += '| ' + headerCells.join(' | ') + ' |\n';
  md += '| ' + Array(colCount).fill('---').join(' | ') + ' |';

  for (const row of bodyRows) {
    while (row.length < colCount) row.push('');
    md += '\n| ' + row.join(' | ') + ' |';
  }

  return md;
}

function processFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');

  content = content.replace(/<table[^>]*>[\s\S]*?<\/table>/g, (match) => {
    return convertHtmlTableToMarkdown(match);
  });

  writeFileSync(filePath, content, 'utf-8');
  console.log(`Done: ${filePath}`);
}

const files = process.argv.slice(2);
for (const f of files) processFile(f);
