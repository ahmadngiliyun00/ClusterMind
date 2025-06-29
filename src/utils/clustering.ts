import KMeans from 'ml-kmeans';
import { DataPoint } from './csv';
import { preprocessData } from './preprocessing';

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

  // Pra-pemrosesan data
  const { processedData } = preprocessData(data);

  // Ekstrak fitur untuk clustering
  const features = processedData.map(row => {
    const values: number[] = [];
    Object.keys(row).forEach(key => {
      if (key !== 'id' && key !== 'cluster') {
        values.push(row[key]);
      }
    });
    return values;
  });

  // Calculate inertia for different K values
  const inertiaValues: number[] = [];
  for (let k = 1; k <= maxK; k++) {
    const result = await KMeans.kmeans(features, k, {
      seed: 42,
      maxIterations: 100,
    });
    inertiaValues.push(result.inertia);
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

  // Pra-pemrosesan data
  const { processedData, encodingMaps, columnStats } = preprocessData(data);

  // Ekstrak fitur untuk clustering
  const features = processedData.map(row => {
    const values: number[] = [];
    Object.keys(row).forEach(key => {
      if (key !== 'id' && key !== 'cluster') {
        values.push(row[key]);
      }
    });
    return values;
  });

  // Run K-Means
  const result = await KMeans.kmeans(features, k, {
    seed: 42,
    maxIterations: 100,
  });

  // Count cluster sizes
  const clusterSizes = Array(k).fill(0);
  result.clusters.forEach(cluster => clusterSizes[cluster]++);

  // Add cluster assignments to original data
  const clusteredData = data.map((point, i) => ({
    ...point,
    cluster: result.clusters[i],
  }));

  return {
    clusters: result.clusters,
    centroids: result.centroids,
    clusterSizes,
    data: clusteredData,
    inertiaValues: [result.inertia],
  };
};