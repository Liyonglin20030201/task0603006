export function useDiff() {
  function computeLineDiff(textA, textB) {
    const linesA = (textA || '').split('\n')
    const linesB = (textB || '').split('\n')
    const result = []

    // Simple LCS-based diff
    const m = linesA.length
    const n = linesB.length
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

    // Backtrack to find diff
    const diff = []
    let i = m, j = n
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
        diff.unshift({ type: 'equal', value: linesA[i - 1], lineA: i, lineB: j })
        i--; j--
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        diff.unshift({ type: 'added', value: linesB[j - 1], lineB: j })
        j--
      } else {
        diff.unshift({ type: 'removed', value: linesA[i - 1], lineA: i })
        i--
      }
    }

    return diff
  }

  function computeWordDiff(textA, textB) {
    const wordsA = (textA || '').split(/(\s+)/)
    const wordsB = (textB || '').split(/(\s+)/)
    const result = []

    const m = wordsA.length
    const n = wordsB.length
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
