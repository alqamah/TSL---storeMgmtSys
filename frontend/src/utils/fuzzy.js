const normalize = (s) => (s || '').toString().toLowerCase().trim();

const WORD_BOUNDARY = /[\s\-_/,(]/;

function subsequenceScore(token, text) {
  let ti = 0;
  let streak = 0;
  let bestStreak = 0;
  let gaps = 0;
  for (let i = 0; i < text.length && ti < token.length; i++) {
    if (text[i] === token[ti]) {
      ti++;
      streak++;
      if (streak > bestStreak) bestStreak = streak;
    } else {
      streak = 0;
      gaps++;
    }
  }
  if (ti < token.length) return 0;
  return Math.max(10, 60 - gaps * 2 + bestStreak * 5 - (text.length - token.length));
}

function scoreToken(token, text) {
  if (!token || !text) return 0;
  const idx = text.indexOf(token);
  if (idx === -1) return subsequenceScore(token, text);

  let score = 100;
  if (idx === 0 || WORD_BOUNDARY.test(text[idx - 1])) {
    score += 50;
  } else {
    score -= idx;
  }
  const after = text.slice(idx + token.length);
  if (!after.length || WORD_BOUNDARY.test(after[0])) score += 30;
  const ratio = token.length / text.length;
  score += Math.round(ratio * 20);
  return score;
}

export function fuzzySearch(items, query, fields) {
  const q = normalize(query);
  if (!q) return items.map((item) => ({ item, score: 1 }));

  const tokens = q.split(/\s+/).filter(Boolean);
  const results = [];

  for (const item of items) {
    let total = 0;
    let matchedAll = true;

    for (const token of tokens) {
      let best = 0;
      for (const field of fields) {
        const s = scoreToken(token, normalize(item[field]));
        if (s > best) best = s;
      }
      if (best === 0) {
        matchedAll = false;
        break;
      }
      total += best;
    }

    if (matchedAll) results.push({ item, score: total });
  }

  return results.sort((a, b) => b.score - a.score);
}
