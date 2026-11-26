// One-off codemod (this run only, deleted after): adds `alternativeTags: [],`
// to every top-level CATALOGUE entry in src/data/sessions.ts that lacks it.
// A top-level entry's `alternatives: [` always follows a 4-space `],` line
// that closes its formTips; nested alternative entries already carry
// alternativeTags before their own `alternatives: []`, so the 6-line lookback
// guard skips them.
import { readFileSync, writeFileSync } from 'node:fs'

const path = 'src/data/sessions.ts'
const lines = readFileSync(path, 'utf8').split('\n')
const out = []
let inserted = 0
for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  if (/^    alternatives: \[$/.test(line) && /^    \],$/.test(lines[i - 1] ?? '')) {
    const prev = out.slice(-6).join('\n')
    if (!prev.includes('alternativeTags')) {
      out.push('    alternativeTags: [],')
      inserted++
    }
  }
  out.push(line)
}
writeFileSync(path, out.join('\n'))
console.log('inserted ' + inserted + ' alternativeTags lines')
