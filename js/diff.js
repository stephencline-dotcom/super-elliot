// Aligns two spellings with a longest-common-subsequence so differing letters can be highlighted.
export function alignDiff(target, typed) {
  const a = [...target];
  const b = [...typed];
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const tMarks = a.map((ch) => ({ ch, match: false }));
  const yMarks = b.map((ch) => ({ ch, match: false }));
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      tMarks[i].match = true;
      yMarks[j].match = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return { target: tMarks, typed: yMarks };
}
