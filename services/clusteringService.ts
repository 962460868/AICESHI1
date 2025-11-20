
import { Asset } from "../types";

/**
 * Calculates the Cosine Similarity between two vectors.
 * @param vecA First vector
 * @param vecB Second vector
 * @returns Similarity score (-1 to 1)
 */
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Finds the top N similar assets to the target asset based on embedding similarity.
 */
export const findSimilarAssets = (target: Asset, allAssets: Asset[], topK: number = 4): { asset: Asset; score: number }[] => {
  if (!target.embedding) return [];
  
  return allAssets
    .filter(a => a.id !== target.id && a.embedding && a.status === 'completed')
    .map(asset => ({
      asset,
      score: cosineSimilarity(target.embedding!, asset.embedding!)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
};

/**
 * Simple K-Means Clustering Implementation
 */
export interface Cluster {
  centroid: number[];
  assets: Asset[];
  label?: string; // To be generated later
}

export const performClustering = (assets: Asset[], k: number = 3): Cluster[] => {
  const validAssets = assets.filter(a => a.embedding);
  if (validAssets.length < k) return [];

  // 1. Initialize centroids randomly
  let centroids = validAssets
    .sort(() => 0.5 - Math.random())
    .slice(0, k)
    .map(a => a.embedding!);

  let assignments: number[] = new Array(validAssets.length).fill(0);
  let iterations = 0;
  const maxIterations = 20;

  while (iterations < maxIterations) {
    // 2. Assign assets to nearest centroid
    let changed = false;
    assignments = validAssets.map((asset, idx) => {
      let maxSim = -1;
      let bestCluster = 0;
      centroids.forEach((c, cIdx) => {
        const sim = cosineSimilarity(asset.embedding!, c);
        if (sim > maxSim) {
          maxSim = sim;
          bestCluster = cIdx;
        }
      });
      if (bestCluster !== assignments[idx]) changed = true;
      return bestCluster;
    });

    if (!changed) break;

    // 3. Update centroids
    centroids = centroids.map((_, cIdx) => {
      const clusterAssets = validAssets.filter((_, i) => assignments[i] === cIdx);
      if (clusterAssets.length === 0) return centroids[cIdx];
      
      // Average vector
      const dim = clusterAssets[0].embedding!.length;
      const newCentroid = new Array(dim).fill(0);
      clusterAssets.forEach(a => {
        for(let i=0; i<dim; i++) newCentroid[i] += a.embedding![i];
      });
      return newCentroid.map(val => val / clusterAssets.length);
    });

    iterations++;
  }

  // 4. Build Result
  return centroids.map((c, i) => ({
    centroid: c,
    assets: validAssets.filter((_, idx) => assignments[idx] === i)
  })).filter(c => c.assets.length > 0);
};