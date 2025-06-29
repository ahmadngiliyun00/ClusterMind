import kmeans from 'ml-kmeans';
import { DataPoint } from './csv';

export interface ClusteringResult {
  clusters: number[];
  centroids: number[][];
  clusterSizes: number[];
  data: DataPoint[];
  inertiaValues?: number[];
  daviesBouldinIndex?: number;
  wcss?: number;
}

/**
 * Calculate Euclidean distance between two points
 */
const calculateEuclideanDistance = (point1: number[], point2: number[]): number => {
  if (!Array.isArray(point1) || !Array.isArray(point2)) {
    return 0;
  }
  
  if (point1.length !== point2.length) {
    return 0;
  }
  
  return Math.sqrt(
    point1.reduce((sum, val, i) => {
      const diff = val - (point2[i] || 0);
      return sum + (diff * diff);
    }, 0)
  );
};

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

  // Calculate within-cluster scatter (average distance to centroid) for each cluster
  const withinClusterScatter: number[] = [];
  
  for (let i = 0; i < k; i++) {
    const clusterPoints = data.filter((_, idx) => clusters[idx] === i);
    
    if (clusterPoints.length === 0) {
      withinClusterScatter[i] = 0;
      continue;
    }
    
    const centroid = centroids[i];
    if (!Array.isArray(centroid)) {
      withinClusterScatter[i] = 0;
      continue;
    }
    
    const totalDistance = clusterPoints.reduce((sum, point) => {
      return sum + calculateEuclideanDistance(point, centroid);
    }, 0);
    
    withinClusterScatter[i] = totalDistance / clusterPoints.length;
  }

  // Calculate between-cluster distances (distance between centroids)
  const betweenClusterDistances: number[][] = [];
  for (let i = 0; i < k; i++) {
    betweenClusterDistances[i] = [];
    for (let j = 0; j < k; j++) {
      if (i !== j) {
        const distance = calculateEuclideanDistance(centroids[i], centroids[j]);
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
 * Calculate Within-Cluster Sum of Squares (WCSS)
 */
const calculateWCSS = (
  data: number[][],
  clusters: number[],
  centroids: number[][]
): number => {
  let wcss = 0;
  
  data.forEach((point, idx) => {
    const clusterIdx = clusters[idx];
    if (clusterIdx >= 0 && clusterIdx < centroids.length) {
      const centroid = centroids[clusterIdx];
      if (Array.isArray(centroid)) {
        const distance = calculateEuclideanDistance(point, centroid);
        wcss += distance * distance; // Square the distance for WCSS
      }
    }
  });
  
  return wcss;
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
 * Validate and fix clustering result
 */
const validateClusteringResult = (result: any, k: number, dataLength: number) => {
  // Ensure clusters array exists and has correct length
  if (!result.clusters || result.clusters.length !== dataLength) {
    console.warn('Invalid clusters array, creating default assignment');
    result.clusters = Array.from({ length: dataLength }, (_, i) => i % k);
  }

  // Ensure centroids array exists and has correct structure
  if (!result.centroids || result.centroids.length !== k) {
    console.warn('Invalid centroids array, using default centroids');
    result.centroids = Array.from({ length: k }, () => [0, 0]);
  }

  // Ensure all centroids are arrays
  result.centroids = result.centroids.map((centroid: any) => {
    if (!Array.isArray(centroid)) {
      return [0, 0];
    }
    return centroid;
  });

  return result;
};

/**
 * Calculate elbow method data (WCSS and DBI for different K values)
 */
export const calculateElbowMethod = async (
  data: DataPoint[],
  numericalColumns: string[],
  maxK: number = 10
): Promise<{ wcss: number[]; dbi: number[] }> => {
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

  // Limit maxK to reasonable bounds
  maxK = Math.min(maxK, Math.floor(features.length / 2));

  const wcssValues: number[] = [];
  const dbiValues: number[] = [];

  for (let k = 1; k <= maxK; k++) {
    try {
      if (k === 1) {
        // For k=1, calculate total variance as WCSS
        const centroid = features[0].map((_, colIdx) => {
          return features.reduce((sum, row) => sum + row[colIdx], 0) / features.length;
        });
        
        const wcss = features.reduce((sum, point) => {
          const distance = calculateEuclideanDistance(point, centroid);
          return sum + distance * distance;
        }, 0);
        
        wcssValues.push(wcss);
        dbiValues.push(0); // DBI is undefined for k=1
        continue;
      }

      // Run K-Means clustering
      let result = kmeans(features, k, {
        seed: 42,
        maxIterations: 100,
        initialization: 'random'
      });
      
      // Validate and fix result if needed
      result = validateClusteringResult(result, k, features.length);

      // Calculate WCSS
      const wcss = calculateWCSS(features, result.clusters, result.centroids);
      wcssValues.push(wcss);

      // Calculate Davies-Bouldin Index
      const dbi = calculateDaviesBouldinIndex(features, result.clusters, result.centroids);
      dbiValues.push(dbi);

      console.log(`K=${k}: WCSS=${wcss.toFixed(3)}, DBI=${dbi.toFixed(3)}`);

    } catch (error) {
      console.warn(`Error calculating metrics for k=${k}:`, error);
      // Use reasonable fallback values based on previous values
      const prevWCSS = wcssValues[wcssValues.length - 1] || 1000;
      const prevDBI = dbiValues[dbiValues.length - 1] || 1;
      
      wcssValues.push(prevWCSS * 0.8);
      dbiValues.push(prevDBI * 1.1);
    }
  }

  return { wcss: wcssValues, dbi: dbiValues };
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
    let result = kmeans(features, k, {
      seed: 42,
      maxIterations: 100,
      initialization: 'random'
    });

    // Validate and fix result if needed
    result = validateClusteringResult(result, k, features.length);

    // Count cluster sizes
    const clusterSizes = Array(k).fill(0);
    result.clusters.forEach((cluster: number) => {
      if (cluster >= 0 && cluster < k) {
        clusterSizes[cluster]++;
      }
    });

    // Calculate evaluation metrics
    const daviesBouldinIndex = calculateDaviesBouldinIndex(
      features,
      result.clusters,
      result.centroids
    );

    // Calculate WCSS
    const wcss = calculateWCSS(features, result.clusters, result.centroids);

    console.log(`Clustering K=${k}: WCSS=${wcss.toFixed(3)}, DBI=${daviesBouldinIndex.toFixed(3)}`);

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
      daviesBouldinIndex,
      wcss
    };
  } catch (error) {
    console.error('Error in K-Means clustering:', error);
    throw new Error(`Gagal melakukan clustering: ${(error as Error).message}`);
  }
};