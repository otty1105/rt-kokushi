'use client'

import { useEffect, useRef, memo } from 'react'

declare global {
  interface Window {
    MathJax?: {
      typesetPromise: (elements?: HTMLElement[]) => Promise<void>
      typesetClear: (elements?: HTMLElement[]) => void
      startup?: { promise: Promise<void> }
    }
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const MATH_TOKEN = /\$[^$]+\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]/g

// 核種表記: $^{99m}\mathrm{Tc}$
const NUCLIDE_RE = /^\$\^\{([^}]+)\}\\mathrm\{([A-Za-z]+)\}\$$/

// シンプルな演算子を Unicode に変換（MathJax 不要 → inline-block 問題を回避）
const SIMPLE_OPS: Record<string, string> = {
  '\\cdot':   '·',
  '\\times':  '×',
  '\\div':    '÷',
  '\\pm':     '±',
  '\\mp':     '∓',
  '\\leq':    '≤',
  '\\geq':    '≥',
  '\\neq':    '≠',
  '\\approx': '≈',
  '\\infty':  '∞',
  '\\alpha':  'α',
  '\\beta':   'β',
  '\\gamma':  'γ',
  '\\mu':     'μ',
  '\\Omega':  'Ω',
  '\\rightarrow': '→',
  '\\leftarrow':  '←',
}

// $\cmd$ → Unicode
function trySimpleOp(src: string): string | null {
  if (!src.startsWith('$') || !src.endsWith('$')) return null
  const inner = src.slice(1, -1).trim()
  return SIMPLE_OPS[inner] ?? null
}

// $^{expr}$（バックスラッシュなし）→ <sup>
function trySimpleSup(src: string): string | null {
  const m = /^\$\^\{([^}\\]*)\}\$$/.exec(src)
  return m ? `<sup class="math-sup">${escapeHtml(m[1])}</sup>` : null
}

// $_{expr}$ （バックスラッシュなし）→ <sub>
function trySimpleSub(src: string): string | null {
  const m = /^\$_\{([^}\\]*)\}\$$/.exec(src)
  return m ? `<sub class="math-sub">${escapeHtml(m[1])}</sub>` : null
}

function wrapBareLetters(mathSource: string): string {
  return mathSource.replace(/\\[a-zA-Z]+|[a-zA-Z]+/g, (token) =>
    token.startsWith('\\') ? token : `\\mathrm{${token}}`
  )
}

function toDisplayStyle(mathSource: string): string {
  if (mathSource.startsWith('$') && !mathSource.startsWith('$$')) {
    const inner = mathSource.slice(1, -1)
    // displaystyle が必要な複雑な式のみに適用（分数・ルート・総和・積分など）
    if (/\\frac|\\sqrt|\\sum|\\int|\\prod|\\lim|\\binom/.test(inner)) {
      return mathSource.replace(/^\$/, '$\\displaystyle ')
    }
  }
  return mathSource
}

function appendTextSuffix(mathSource: string, suffix: string): string {
  const escaped = suffix.replace(/[\\{}$%&#^_~]/g, '\\$&')
  if (mathSource.startsWith('$') && !mathSource.startsWith('$$') && mathSource.endsWith('$')) {
    return mathSource.slice(0, -1) + `\\text{${escaped}}$`
  }
  if (mathSource.startsWith('\\(') && mathSource.endsWith('\\)')) {
    return mathSource.slice(0, -2) + `\\text{${escaped}}\\)`
  }
  return mathSource
}

function buildHtml(text: string): string {
  const tokens: { math: boolean; value: string }[] = []
  let lastIndex = 0
  let m: RegExpExecArray | null
  MATH_TOKEN.lastIndex = 0
  while ((m = MATH_TOKEN.exec(text))) {
    if (m.index > lastIndex) {
      tokens.push({ math: false, value: text.slice(lastIndex, m.index) })
    }
    tokens.push({ math: true, value: m[0] })
    lastIndex = m.index + m[0].length
  }
  if (lastIndex < text.length) {
    tokens.push({ math: false, value: text.slice(lastIndex) })
  }

  let html = ''
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    if (!token.math) {
      html += escapeHtml(token.value)
      continue
    }

    // 1. シンプル演算子 → Unicode（inline, 改行問題なし）
    const simpleOp = trySimpleOp(token.value)
    if (simpleOp !== null) {
      html += simpleOp
      continue
    }

    // 2. シンプル上付き → <sup>（inline, 改行問題なし）
    const simpleSup = trySimpleSup(token.value)
    if (simpleSup !== null) {
      html += simpleSup
      continue
    }

    // 3. シンプル下付き → <sub>（inline, 改行問題なし）
    const simpleSub = trySimpleSub(token.value)
    if (simpleSub !== null) {
      html += simpleSub
      continue
    }

    // 4. 核種表記 → HTML <sup>
    const nuclideMatch = NUCLIDE_RE.exec(token.value)
    if (nuclideMatch) {
      const [, sup, sym] = nuclideMatch
      const next = tokens[i + 1]
      let glued = ''
      if (next && !next.math && next.value.length > 0 && !/^\s/.test(next.value)) {
        const run = /^\S+/.exec(next.value)
        if (run) {
          glued = run[0]
          next.value = next.value.slice(glued.length)
        }
      }
      html += `<span class="math-nowrap"><sup class="nuclide-sup">${escapeHtml(sup)}</sup>${escapeHtml(sym)}${escapeHtml(glued)}</span>`
      continue
    }

    // 5. 複雑な数式 → MathJax（分数・ルートなど）
    const next = tokens[i + 1]
    let glued = ''
    let isCombinationChoice = false
    if (next && !next.math && next.value.length > 0 && !/^\s/.test(next.value)) {
      isCombinationChoice = next.value.includes('　')
      const run = /^\S+/.exec(next.value)
      if (run) {
        glued = run[0]
        next.value = next.value.slice(glued.length)
      }
    }
    if (isCombinationChoice && /^[-－]/.test(glued)) {
      glued = '—' + glued.slice(1)
    }

    const mathValue = wrapBareLetters(toDisplayStyle(token.value))
    const finalMath = glued ? appendTextSuffix(mathValue, glued) : mathValue
    html += `<span class="math-nowrap">${escapeHtml(finalMath)}</span>`
  }
  return html
}

const MathText = memo(function MathText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current

    const typeset = () => {
      if (!window.MathJax?.typesetPromise) return
      window.MathJax.typesetClear([el])
      window.MathJax.typesetPromise([el]).catch(() => {})
    }

    if (window.MathJax?.startup?.promise) {
      window.MathJax.startup.promise.then(typeset)
    } else if (window.MathJax) {
      typeset()
    }
  }, [text])

  return (
    <span
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: buildHtml(text) }}
      suppressHydrationWarning
    />
  )
})

export default MathText
