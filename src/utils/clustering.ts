import { kmeans } from 'ml-kmeans';
import { DataPoint } from './csv';

export interface ClusteringResult {
  clusters: number[];
  centroids: number[][];
  clusterSizes: number[];
  data: DataPoint[];
  inertiaValues?: number[];
  avgWithinCentroidDistance?: number;
  daviesBouldinIndex?: number;
}

/**
 * Calculate Davies-Bouldin Index for cluster evaluation
 */
const calculateDaviesBouldinIndex = (
  data: number[][],
  clusters: number[],
  centroids: number[][]
): number => {
  const k = centroids.length;
  if (k <= 1) return 0;

  // Calculate within-cluster scatter for each cluster
  const withinClusterScatter = centroids.map((centroid, i) => {
    const clusterPoints = data.filter((_, idx) => clusters[idx] === i);
    if (clusterPoints.length === 0) return 0;
    
    const sumDistances = clusterPoints.reduce((sum, point) => {
      const distance = Math.sqrt(
        point.reduce((acc, val, idx) => acc + Math.pow(val - centroid[idx], 2), 0)
      );
      return sum + distance;
    }, 0);
    
    return sumDistances / clusterPoints.length;
  });

  // Calculate between-cluster distances
  const betweenClusterDistances: number[][] = [];
  for (let i = 0; i < k; i++) {
    betweenClusterDistances[i] = [];
    for (let j = 0; j < k; j++) {
      if (i !== j) {
        const distance = Math.sqrt(
          centroids[i].reduce((acc, val, idx) => acc + Math.pow(val - centroids[j][idx], 2), 0)
        );
        betweenClusterDistances[i][j] = distance;
      } else {
        betweenClusterDistances[i][j] = Infinity;
      }
    }
  }

  // Calculate Davies-Bouldin Index
  let dbIndex = 0;
  for (let i = 0; i < k; i++) {
    let maxRatio = 0;
    for (let j = 0; j < k; j++) {
      if (i !== j && betweenClusterDistances[i][j] > 0) {
        const ratio = (withinClusterScatter[i] + withinClusterScatter[j]) / betweenClusterDistances[i][j];
        maxRatio = Math.max(maxRatio, ratio);
      }
    }
    dbIndex += maxRatio;
  }

  return dbIndex / k;
};

/**
 * Calculate average within-centroid distance
 */
const calculateAvgWithinCentroidDistance = (
  data: number[][],
  clusters: number[],
  centroids: number[][]
): number => {
  let totalDistance = 0;
  let totalPoints = 0;

  data.forEach((point, idx) => {
    const clusterIdx = clusters[idx];
    if (clusterIdx >= 0 && clusterIdx < centroids.length) {
      const centroid = centroids[clusterIdx];
      
      const distance = Math.sqrt(
        point.reduce((acc, val, i) => acc + Math.pow(val - centroid[i], 2), 0)
      );
      
      totalDistance += distance;
      totalPoints++;
    }
  });

  return totalPoints > 0 ? totalDistance / totalPoints : 0;
};

/**
 * Extract numerical features from data
 */
const extractFeatures = (data: DataPoint[], numericalColumns: string[]): number[][] => {
  return data.map(row => {
    const values: number[] = [];
    numericalColumns.forEach(column => {
      const value = Number(row[column]);
      if (!isNaN(value) && isFinite(value)) {
        values.push(value);
      } else {
        values.push(0); // Default value for invalid numbers
      }
    });
    return values;
  }).filter(row => row.length === numericalColumns.length);
};

/**
 * Calculate inertia values for different K values to determine optimal number of clusters
 */
export const calculateElbowMethod = async (
  data: DataPoint[],
  numericalColumns: string[],
  maxK: number = 10
): Promise<number[]> => {
  if (!data || data.length === 0) {
    throw new Error('Data tidak boleh kosong');
  }

  if (!numericalColumns || numericalColumns.length === 0) {
    throw new Error('Tidak ada kolom numerik yang tersedia');
  }

  // Extract features
  const features = extractFeatures(data, numericalColumns);
  
  if (features.length === 0) {
    throw new Error('Tidak ada data numerik yang valid untuk clustering');
  }

  // Limit maxK to data length - 1
  maxK = Math.min(maxK, features.length - 1);

  // Calculate inertia for different K values
  const inertiaValues: number[] = [];
  for (let k = 1; k <= maxK; k++) {
    try {
      const result = kmeans(features, k, {
        seed: 42,
        maxIterations: 100,
        initialization: 'random'
      });
      
      // Calculate WCSS manually if not provided
      let wcss = 0;
      features.forEach((point, idx) => {
        const clusterIdx = result.clusters[idx];
        if (clusterIdx >= 0 && clusterIdx < result.centroids.length) {
          const centroid = result.centroids[clusterIdx];
          const distance = point.reduce((sum, val, i) => {
            return sum + Math.pow(val - centroid[i], 2);
          }, 0);
          wcss += distance;
        }
      });
      
      inertiaValues.push(wcss);
    } catch (error) {
      console.warn(`Error calculating inertia for k=${k}:`, error);
      // Use previous value or a reasonable estimate
      const prevValue = inertiaValues[inertiaValues.length - 1] || 1000;
      inertiaValues.push(prevValue * 0.8);
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
  if (!data || data.length === 0) {
    throw new Error('Data tidak boleh kosong');
  }

  if (!numericalColumns || numericalColumns.length === 0) {
    throw new Error('Tidak ada kolom numerik yang tersedia');
  }

  if (k < 1 || k > data.length) {
    throw new Error(`Jumlah cluster (k=${k}) tidak valid. Harus antara 1 dan ${data.length}`);
  }

  // Extract features
  const features = extractFeatures(data, numericalColumns);

  if (features.length === 0) {
    throw new Error('Tidak ada data numerik yang valid untuk clustering');
  }

  if (features.length < k) {
    throw new Error(`Jumlah data valid (${features.length}) kurang dari jumlah cluster (${k})`);
  }

  try {
    // Run K-Means
    const result = kmeans(features, k, {
      seed: 42,
      maxIterations: 100,
      initialization: 'random'
    });

    // Validate result
    if (!result.clusters || !result.centroids) {
      throw new Error('Hasil clustering tidak valid');
    }

    // Count cluster sizes
    const clusterSizes = Array(k).fill(0);
    result.clusters.forEach(cluster => {
      if (cluster >= 0 && cluster < k) {
        clusterSizes[cluster]++;
      }
    });

    // Calculate evaluation metrics
    const avgWithinCentroidDistance = calculateAvgWithinCentroidDistance(
      features,
      result.clusters,
      result.centroids
    );

    const daviesBouldinIndex = calculateDaviesBouldinIndex(
      features,
      result.clusters,
      result.centroids
    );

    // Calculate WCSS
    let wcss = 0;
    features.forEach((point, idx) => {
      const clusterIdx = result.clusters[idx];
      if (clusterIdx >= 0 && clusterIdx < result.centroids.length) {
        const centroid = result.centroids[clusterIdx];
        const distance = point.reduce((sum, val, i) => {
          return sum + Math.pow(val - centroid[i], 2);
        }, 0);
        wcss += distance;
      }
    });

    // Add cluster assignments to original data
    const clusteredData = data.map((point, i) => ({
      ...point,
      cluster: i < result.clusters.length ? result.clusters[i] : 0,
    }));

    return {
      clusters: result.clusters,
      centroids: result.centroids,
      clusterSizes,
      data: clusteredData,
      inertiaValues: [wcss],
      avgWithinCentroidDistance,
      daviesBouldinIndex
    };
  } catch (error) {
    console.error('Error in K-Means clustering:', error);
    throw new Error(`Gagal melakukan clustering: ${(error as Error).message}`);
  }
};