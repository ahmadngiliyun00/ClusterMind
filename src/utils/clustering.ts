import kmeans from 'ml-kmeans';
import { DataPoint } from './csv';

export interface ClusteringResult {
  clusters: number[];
  centroids: number[][];
  clusterSizes: number[];
  data: DataPoint[];
  inertiaValues?: number[];
}

/**
 * Calculate inertia values for different K values to determine optimal number of clusters
 */
export const calculateElbowMethod = async (
  data: DataPoint[],
  numericalColumns: string[],
  maxK: number = 10
): Promise<number[]> => {
  if (data.length === 0) {
    throw new Error('Data tidak boleh kosong');
  }

  // Limit maxK to data length - 1
  maxK = Math.min(maxK, data.length - 1);

  // Ekstrak fitur untuk clustering
  const features = data.map(row => {
    const values: number[] = [];
    numericalColumns.forEach(column => {
      const value = Number(row[column]);
      if (!isNaN(value)) {
        values.push(value);
      }
    });
    return values;
  }).filter(row => row.length > 0);

  if (features.length === 0) {
    throw new Error('Tidak ada data numerik yang valid untuk clustering');
  }

  // Calculate inertia for different K values
  const inertiaValues: number[] = [];
  for (let k = 1; k <= maxK; k++) {
    try {
      const result = kmeans(features, k, {
        seed: 42,
        maxIterations: 100,
      });
      inertiaValues.push(result.withinClusterMSE || 0);
    } catch (error) {
      console.warn(`Error calculating inertia for k=${k}:`, error);
      inertiaValues.push(0);
    }
  }

  return inertiaValues;
};

/**
 * Perform K-Means clustering on data
 */
export const performKMeansClustering = async (
  data: DataPoint[],
  numericalColumns: string[],
  k: number
): Promise<ClusteringResult> => {
  if (data.length === 0) {
    throw new Error('Data tidak boleh kosong');
  }

  if (k < 1 || k > data.length) {
    throw new Error(`Jumlah cluster (k=${k}) tidak valid. Harus antara 1 dan ${data.length}`);
  }

  // Ekstrak fitur untuk clustering
  const features = data.map(row => {
    const values: number[] = [];
    numericalColumns.forEach(column => {
      const value = Number(row[column]);
      if (!isNaN(value)) {
        values.push(value);
      }
    });
    return values;
  }).filter(row => row.length > 0);

  if (features.length === 0) {
    throw new Error('Tidak ada data numerik yang valid untuk clustering');
  }

  if (features.length < k) {
    throw new Error(`Jumlah data (${features.length}) kurang dari jumlah cluster (${k})`);
  }

  // Run K-Means
  const result = kmeans(features, k, {
    seed: 42,
    maxIterations: 100,
  });

  // Count cluster sizes
  const clusterSizes = Array(k).fill(0);
  result.clusters.forEach(cluster => {
    if (cluster >= 0 && cluster < k) {
      clusterSizes[cluster]++;
    }
  });

  // Add cluster assignments to original data
  const clusteredData = data.map((point, i) => ({
    ...point,
    cluster: result.clusters[i] || 0,
  }));

  return {
    clusters: result.clusters,
    centroids: result.centroids,
    clusterSizes,
    data: clusteredData,
    inertiaValues: [result.withinClusterMSE || 0],
  };
};