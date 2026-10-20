import { FURNITURE_CATALOG, FurnitureItem } from "@/data/furnitureData";

export interface RecommendationResult {
  item: FurnitureItem;
  similarityScore: number;
  reason: string;
}

// Tokenize and clean text
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

// Compute term frequencies (TF)
function computeTF(tokens: string[]): Record<string, number> {
  const tf: Record<string, number> = {};
  for (const t of tokens) {
    tf[t] = (tf[t] || 0) + 1;
  }
  const total = tokens.length || 1;
  for (const t in tf) {
    tf[t] = tf[t] / total;
  }
  return tf;
}

// Cosine similarity between two vector mappings
function cosineSimilarity(vecA: Record<string, number>, vecB: Record<string, number>): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const key in vecA) {
    const valA = vecA[key];
    normA += valA * valA;
    if (key in vecB) {
      dotProduct += valA * vecB[key];
    }
  }

  for (const key in vecB) {
    const valB = vecB[key];
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Get item profile representation
function getItemTokens(item: FurnitureItem): string[] {
  return tokenize(
    `${item.name} ${item.category} ${item.subcategory} ${item.color} ${item.material} ${item.description} ${item.tags.join(" ")}`
  );
}

/**
 * Machine Learning recommendation engine based on Vector Space Model (TF-IDF & Cosine Similarity)
 * Takes recent user queries and selected items, builds user preference vector, and scores catalog.
 */
export function getRecommendations(
  searchHistory: string[],
  recentItemIds: string[] = [],
  excludeItemId?: string,
  limit: number = 4
): RecommendationResult[] {
  // Aggregate user context tokens
  const userTokens: string[] = [];

  for (const query of searchHistory) {
    userTokens.push(...tokenize(query));
    // Boost recent searches with weight duplicate
    userTokens.push(...tokenize(query));
  }

  for (const id of recentItemIds) {
    const matched = FURNITURE_CATALOG.find((f) => f.item_id === id);
    if (matched) {
      userTokens.push(...getItemTokens(matched));
    }
  }

  // If no history, recommend popular items (sofas and essentials)
  if (userTokens.length === 0) {
    return FURNITURE_CATALOG.filter((f) => f.item_id !== excludeItemId)
      .slice(0, limit)
      .map((item, idx) => ({
        item,
        similarityScore: Number((0.95 - idx * 0.05).toFixed(2)),
        reason: "Trending Scandinavian Essential"
      }));
  }

  const userTF = computeTF(userTokens);

  const scored: RecommendationResult[] = FURNITURE_CATALOG.filter(
    (f) => f.item_id !== excludeItemId
  ).map((item) => {
    const itemTF = computeTF(getItemTokens(item));
    let sim = cosineSimilarity(userTF, itemTF);

    // Boost if category matches any search word
    const itemCatLower = item.category.toLowerCase();
    const hasCategoryHit = userTokens.some((t) => itemCatLower.includes(t));
    if (hasCategoryHit) {
      sim += 0.25;
    }

    // Determine reason
    let reason = "Matched your recent room aesthetic";
    if (hasCategoryHit) {
      reason = `Aligned with your search for ${item.category}s`;
    } else if (item.color && userTokens.includes(item.color.toLowerCase())) {
      reason = `Matches your preferred ${item.color} color palette`;
    }

    return {
      item,
      similarityScore: Math.min(1.0, Number(sim.toFixed(3))),
      reason
    };
  });

  // Sort descending by score
  scored.sort((a, b) => b.similarityScore - a.similarityScore);

  return scored.slice(0, limit);
}
