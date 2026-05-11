import re
import os

TARGET_DIR = '/Users/pwrd/workspace/demo/ancient-coins/docs/target/'
OUTPUT_FILE = '/Users/pwrd/workspace/demo/ancient-coins/docs/中国历代金属钱币全集.md'

FILE_ORDER = [
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

all_data = []

for filename in FILE_ORDER:
    filepath = os.path.join(TARGET_DIR, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')

    dynasty_name = None
    table_rows = []
    detail_lines = []
    state = 'before'

    for line in lines:
        m1 = re.match(r'^# 1\.\s+(.+?)汇总表', line)
        if m1:
            dynasty_name = m1.group(1)
            state = 'table'
            continue

        m2 = re.match(r'^# 2\.\s+', line)
        if m2:
            state = 'details'
            continue

        if state == 'table':
            if line.startswith('> '):
                continue
            if line.strip() == '':
                continue
            table_rows.append(line)

        elif state == 'details':
            if re.match(r'^## \d+\.\d+\s+', line):
                continue
            detail_lines.append(line)

    while detail_lines and detail_lines[0].strip() == '':
        detail_lines.pop(0)
    while detail_lines and detail_lines[-1].strip() == '':
        detail_lines.pop()

    all_data.append((dynasty_name, table_rows, detail_lines))

output = []

# ===== Module 1: Unified summary table =====
output.append('# 1. 历代钱币汇总表')
output.append('')

header_line = None
separator_line = None
for row in all_data[0][1]:
    if re.match(r'^\|\s*\*\*货币名称', row):
        header_line = row
    elif re.match(r'^\|\s*[-:]+', row):
        separator_line = row

output.append(header_line)
output.append(separator_line)

for dynasty_name, table_rows, _ in all_data:
    output.append(f'| **{dynasty_name}** | | | | | |')
    for row in table_rows:
        if re.match(r'^\|\s*\*\*货币名称', row):
            continue
        if re.match(r'^\|\s*[-:]+', row):
            continue
        output.append(row)

output.append('')
output.append('> 以上价格仅供参考，实际价格受品相、版别、存世量因素影响。')
output.append('')

# ===== Module 2: Unified detailed introduction =====
output.append('# 2. 历代钱币详细介绍')

for i, (dynasty_name, _, detail_lines) in enumerate(all_data, 1):
    output.append('')
    output.append(f'## 2.{i} {dynasty_name}')
    output.append('')
    output.extend(detail_lines)

output.append('')

with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    f.write('\n'.join(output))

print(f'Merged {len(FILE_ORDER)} files into {OUTPUT_FILE}')
print(f'Total lines: {len(output)}')
