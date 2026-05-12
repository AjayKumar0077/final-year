export type AssistanceCategory = 'food' | 'medical' | 'shelter';

export interface ClassificationResult {
  category: AssistanceCategory;
  confidence: number;
  probabilities: Record<AssistanceCategory, number>;
  tokens: string[];
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from', 'has', 'have',
  'in', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'to', 'we', 'with', 'will', 'need',
]);

const CATEGORY_DOCS: Record<AssistanceCategory, string[]> = {
  food: ['hungry', 'meal', 'food', 'ration', 'kitchen', 'groceries', 'bread', 'rice'],
  medical: ['injured', 'bleeding', 'medicine', 'hospital', 'doctor', 'ambulance', 'fever'],
  shelter: ['homeless', 'shelter', 'roof', 'tent', 'rain', 'night', 'sleep', 'street'],
};

const CLASS_WEIGHTS: Record<AssistanceCategory, Record<string, number>> = {
  food: {
    hungry: 1.2,
    meal: 1.4,
    food: 1.6,
    ration: 1.1,
    groceries: 1.0,
    bread: 1.0,
    rice: 1.1,
  },
  medical: {
    injured: 1.6,
    bleeding: 1.8,
    medicine: 1.2,
    hospital: 1.2,
    doctor: 1.1,
    ambulance: 1.6,
    fever: 1.0,
  },
  shelter: {
    homeless: 1.5,
    shelter: 1.7,
    roof: 1.1,
    tent: 1.0,
    rain: 1.0,
    night: 0.8,
    street: 1.1,
  },
};

const CLASS_BIAS: Record<AssistanceCategory, number> = {
  food: 0.15,
  medical: 0.0,
  shelter: -0.05,
};

function preprocessText(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function computeTf(tokens: string[]): Record<string, number> {
  const freq: Record<string, number> = {};
  if (tokens.length === 0) return freq;

  for (const token of tokens) {
    freq[token] = (freq[token] || 0) + 1;
  }

  for (const term of Object.keys(freq)) {
    freq[term] = freq[term] / tokens.length;
  }

  return freq;
}

function computeIdf(tokens: string[]): Record<string, number> {
  const docs = Object.values(CATEGORY_DOCS);
  const corpusSize = docs.length;
  const idf: Record<string, number> = {};

  for (const token of new Set(tokens)) {
    const docsWithToken = docs.reduce((count, docTokens) => {
      return count + (docTokens.includes(token) ? 1 : 0);
    }, 0);

    idf[token] = Math.log((1 + corpusSize) / (1 + docsWithToken)) + 1;
  }

  return idf;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function softmax(scores: Record<AssistanceCategory, number>): Record<AssistanceCategory, number> {
  const entries = Object.entries(scores) as Array<[AssistanceCategory, number]>;
  const maxScore = Math.max(...entries.map(([, v]) => v));
  const expValues = entries.map(([category, value]) => [category, Math.exp(value - maxScore)] as const);
  const sum = expValues.reduce((total, [, value]) => total + value, 0);

  return expValues.reduce((acc, [category, value]) => {
    acc[category] = value / sum;
    return acc;
  }, { food: 0, medical: 0, shelter: 0 } as Record<AssistanceCategory, number>);
}

/**
 * Lightweight text classifier using TF-IDF features and fixed logistic-style weights.
 * This keeps inference deterministic and client-safe without model hosting.
 */
export function classifyAssistanceText(input: string): ClassificationResult {
  const tokens = preprocessText(input);
  if (tokens.length === 0) {
    return {
      category: 'food',
      confidence: 0.34,
      probabilities: { food: 0.34, medical: 0.33, shelter: 0.33 },
      tokens: [],
    };
  }

  const tf = computeTf(tokens);
  const idf = computeIdf(tokens);
  const tfidf: Record<string, number> = {};

  for (const term of Object.keys(tf)) {
    tfidf[term] = tf[term] * (idf[term] || 1);
  }

  const logits: Record<AssistanceCategory, number> = {
    food: CLASS_BIAS.food,
    medical: CLASS_BIAS.medical,
    shelter: CLASS_BIAS.shelter,
  };

  (Object.keys(logits) as AssistanceCategory[]).forEach((category) => {
    for (const [term, value] of Object.entries(tfidf)) {
      const weight = CLASS_WEIGHTS[category][term] || 0;
      logits[category] += weight * value;
    }

    // Keep output interpretable as probability-like before class normalization.
    logits[category] = sigmoid(logits[category]);
  });

  const probabilities = softmax(logits);
  const sorted = (Object.entries(probabilities) as Array<[AssistanceCategory, number]>).sort(
    (a, b) => b[1] - a[1]
  );

  return {
    category: sorted[0][0],
    confidence: Number(sorted[0][1].toFixed(4)),
    probabilities,
    tokens,
  };
}
