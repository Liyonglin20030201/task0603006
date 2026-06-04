export function useDiff() {
  function computeLineDiff(textA, textB) {
    const linesA = (textA || '').split('\n')
    const linesB = (textB || '').split('\n')

    if (linesA.length === 1 && linesA[0] === '' && linesB.length === 1 && linesB[0] === '') {
      return []
    }

    const m = linesA.length
    const n = linesB.length

    // For very large diffs, fall back to simple sequential comparison
    if (m * n > 1000000) {
      return simpleDiff(linesA, linesB)
    }

    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (linesA[i - 1] === linesB[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
        }
      }
    }

    const diff = []
    let i = m, j = n
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
        diff.unshift({ type: 'equal', value: linesA[i - 1] })
        i--; j--
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        diff.unshift({ type: 'added', value: linesB[j - 1] })
        j--
      } else {
        diff.unshift({ type: 'removed', value: linesA[i - 1] })
        i--
      }
    }

    return diff
  }

  function simpleDiff(linesA, linesB) {
    const result = []
    const maxLen = Math.max(linesA.length, linesB.length)
    for (let i = 0; i < maxLen; i++) {
      const a = i < linesA.length ? linesA[i] : undefined
      const b = i < linesB.length ? linesB[i] : undefined
      if (a === b) {
        result.push({ type: 'equal', value: a })
      } else {
        if (a !== undefined) result.push({ type: 'removed', value: a })
        if (b !== undefined) result.push({ type: 'added', value: b })
      }
    }
    return result
  }

  function computeWordDiff(textA, textB) {
    const wordsA = (textA || '').split(/(\s+)/)
    const wordsB = (textB || '').split(/(\s+)/)

    const m = wordsA.length
    const n = wordsB.length

    if (m * n > 500000) {
      return simpleDiff(wordsA, wordsB)
    }

    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (wordsA[i - 1] === wordsB[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
        }
      }
    }

    const result = []
    let i = m, j = n
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && wordsA[i - 1] === wordsB[j - 1]) {
        result.unshift({ type: 'equal', value: wordsA[i - 1] })
        i--; j--
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        result.unshift({ type: 'added', value: wordsB[j - 1] })
        j--
      } else {
        result.unshift({ type: 'removed', value: wordsA[i - 1] })
        i--
      }
    }

    return result
  }

  return { computeLineDiff, computeWordDiff }
}
