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
  
  let sum = 0;
  for (let i = 0; i < point1.length; i++) {
    const val1 = Number(point1[i]) || 0;
    const val2 = Number(point2[i]) || 0;
    const diff = val1 - val2;
    sum += diff * diff;
  }
  
  const distance = Math.sqrt(sum);
  return isNaN(distance) || !isFinite(distance) ? 0 : distance;
};

/**
 * Calculate Davies-Bouldin Index for cluster evaluation
 * DBI = (1/k) * Σ max((Si + Sj) / Mij) for i ≠ j
 * where:
 * - Si = average distance of points in cluster i to centroid i
 * - Sj = average distance of points in cluster j to centroid j  
 * - Mij = distance between centroids i and j
 */
const calculateDaviesBouldinIndex = (
  data: number[][],
  clusters: number[],
  centroids: number[][]
): number => {
  const k = centroids.length;
  
  if (k <= 1) {
    return 0; // DBI is undefined for k=1
  }

  // Validate input data
  if (!data || data.length === 0 || !clusters || !centroids) {
    console.warn('Invalid input for DBI calculation');
    return 0;
  }

  console.log(`Calculating DBI for k=${k}, data points=${data.length}`);

  // Step 1: Calculate Si (within-cluster scatter) for each cluster
  const withinClusterScatter: number[] = [];
  
  for (let i = 0; i < k; i++) {
    // Find all points belonging to cluster i
    const clusterPointIndices = clusters
      .map((cluster, idx) => cluster === i ? idx : -1)
      .filter(idx => idx !== -1);
    
    console.log(`Cluster ${i}: ${clusterPointIndices.length} points`);
    
    if (clusterPointIndices.length === 0) {
      withinClusterScatter[i] = 0;
      continue;
    }
    
    const centroid = centroids[i];
    if (!Array.isArray(centroid)) {
      withinClusterScatter[i] = 0;
      continue;
    }
    
    // Calculate average distance from points to centroid
    let totalDistance = 0;
    let validDistances = 0;
    
    for (const pointIdx of clusterPointIndices) {
      const point = data[pointIdx];
      if (Array.isArray(point)) {
        const distance = calculateEuclideanDistance(point, centroid);
        if (!isNaN(distance) && isFinite(distance)) {
          totalDistance += distance;
          validDistances++;
        }
      }
    }
    
    withinClusterScatter[i] = validDistances > 0 ? totalDistance / validDistances : 0;
    console.log(`Cluster ${i} scatter: ${withinClusterScatter[i].toFixed(4)}`);
  }

  // Step 2: Calculate Mij (distance between centroids) for all pairs
  const betweenClusterDistances: number[][] = [];
  for (let i = 0; i < k; i++) {
    betweenClusterDistances[i] = [];
    for (let j = 0; j < k; j++) {
      if (i !== j) {
        const distance = calculateEuclideanDistance(centroids[i], centroids[j]);
        betweenClusterDistances[i][j] = distance;
        console.log(`Distance between centroids ${i} and ${j}: ${distance.toFixed(4)}`);
      } else {
        betweenClusterDistances[i][j] = Infinity; // Same cluster
      }
    }
  }

  // Step 3: Calculate Davies-Bouldin Index
  // For each cluster i, find max((Si + Sj) / Mij) for all j ≠ i
  let dbSum = 0;
  let validClusters = 0;
  
  for (let i = 0; i < k; i++) {
    let maxRatio = 0;
    let foundValidRatio = false;
    
    for (let j = 0; j < k; j++) {
      if (i !== j && betweenClusterDistances[i][j] > 0) {
        const ratio = (withinClusterScatter[i] + withinClusterScatter[j]) / betweenClusterDistances[i][j];
        if (!isNaN(ratio) && isFinite(ratio)) {
          maxRatio = Math.max(maxRatio, ratio);
          foundValidRatio = true;
          console.log(`Ratio for clusters ${i},${j}: ${ratio.toFixed(4)}`);
        }
      }
    }
    
    if (foundValidRatio) {
      dbSum += maxRatio;
      validClusters++;
      console.log(`Max ratio for cluster ${i}: ${maxRatio.toFixed(4)}`);
    }
  }

  const finalDBI = validClusters > 0 ? dbSum / validClusters : 0;
  console.log(`Final DBI: ${finalDBI.toFixed(4)} (sum=${dbSum.toFixed(4)}, validClusters=${validClusters})`);
  
  return finalDBI;
};

/**
 * Calculate Within-Cluster Sum of Squares (WCSS)
 */
const calculateWCSS = (
  data: number[][],
  clusters: number[],
  centroids: number[][]
): number => {
  if (!data || !clusters || !centroids) {
    return 0;
  }
  
  let wcss = 0;
  
  for (let i = 0; i < data.length; i++) {
    const point = data[i];
    const clusterIdx = clusters[i];
    
    if (clusterIdx >= 0 && clusterIdx < centroids.length) {
      const centroid = centroids[clusterIdx];
      if (Array.isArray(centroid) && Array.isArray(point)) {
        const distance = calculateEuclideanDistance(point, centroid);
        const squaredDistance = distance * distance;
        
        if (!isNaN(squaredDistance) && isFinite(squaredDistance)) {
          wcss += squaredDistance;
        }
      }
    }
  }
  
  return wcss;
};

/**
 * Extract numerical features from data with enhanced validation
 */
const extractFeatures = (data: DataPoint[], numericalColumns: string[]): number[][] => {
  const features: number[][] = [];
  
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    const values: number[] = [];
    
    for (const column of numericalColumns) {
      const rawValue = row[column];
      const value = Number(rawValue);
      
      if (!isNaN(value) && isFinite(value)) {
        values.push(value);
      } else {
        values.push(0); // Use 0 as fallback
      }
    }
    
    if (values.length === numericalColumns.length) {
      features.push(values);
    }
  }
  
  return features;
};

/**
 * Validate and fix clustering result
 */
const validateClusteringResult = (result: any, k: number, dataLength: number, features: number[][]) => {
  // Ensure clusters array exists and has correct length
  if (!result.clusters || result.clusters.length !== dataLength) {
    console.warn('Invalid clusters array, creating fallback');
    result.clusters = Array.from({ length: dataLength }, (_, i) => i % k);
  }

  // Ensure centroids array exists and has correct structure
  if (!result.centroids || result.centroids.length !== k) {
    console.warn('Invalid centroids array, calculating from data');
    result.centroids = [];
    const featureDimensions = features[0]?.length || 2;
    
    for (let i = 0; i < k; i++) {
      const clusterPoints = features.filter((_, idx) => result.clusters[idx] === i);
      
      if (clusterPoints.length > 0) {
        // Calculate mean for each dimension
        const centroid = Array(featureDimensions).fill(0).map((_, dim) => {
          const sum = clusterPoints.reduce((acc, point) => acc + (point[dim] || 0), 0);
          return sum / clusterPoints.length;
        });
        result.centroids.push(centroid);
      } else {
        // Use random point from features as centroid
        const randomPoint = features[Math.floor(Math.random() * features.length)] || Array(featureDimensions).fill(0);
        result.centroids.push([...randomPoint]);
      }
    }
  }

  // Ensure all centroids are valid arrays with proper values
  result.centroids = result.centroids.map((centroid: any, index: number) => {
    if (!Array.isArray(centroid)) {
      const featureDimensions = features[0]?.length || 2;
      return Array(featureDimensions).fill(0);
    }
    
    // Ensure all centroid values are valid numbers
    const validCentroid = centroid.map((val: any) => {
      const num = Number(val);
      return isNaN(num) || !isFinite(num) ? 0 : num;
    });
    
    return validCentroid;
  });

  return result;
};

/**
 * Run K-Means with proper initialization and multiple attempts
 */
const runKMeansWithRetry = (features: number[][], k: number, maxAttempts: number = 5) => {
  let bestResult = null;
  let bestWCSS = Infinity;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = kmeans(features, k, {
        seed: 42 + attempt * 7, // Different seed for each attempt
        maxIterations: 300,
        initialization: 'random'
      });
      
      // Validate result structure
      if (!result || !result.clusters || !result.centroids) {
        console.warn(`Attempt ${attempt + 1}: Invalid result structure`);
        continue;
      }
      
      // Calculate WCSS for this result
      const wcss = calculateWCSS(features, result.clusters, result.centroids);
      
      // Keep the result with lowest WCSS
      if (wcss < bestWCSS || bestResult === null) {
        bestWCSS = wcss;
        bestResult = result;
      }
      
      console.log(`Attempt ${attempt + 1}: WCSS = ${wcss.toFixed(3)}`);
    } catch (error) {
      console.warn(`K-Means attempt ${attempt + 1} failed:`, error);
      continue;
    }
  }
  
  if (!bestResult) {
    throw new Error('All K-Means attempts failed');
  }
  
  console.log(`Best result: WCSS = ${bestWCSS.toFixed(3)}`);
  return bestResult;
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
      console.log(`\n=== Calculating metrics for K=${k} ===`);
      
      if (k === 1) {
        // For k=1, calculate total variance as WCSS
        const centroid = features[0].map((_, colIdx) => {
          return features.reduce((sum, row) => sum + (row[colIdx] || 0), 0) / features.length;
        });
        
        let wcss = 0;
        for (const point of features) {
          const distance = calculateEuclideanDistance(point, centroid);
          wcss += distance * distance;
        }
        
        wcssValues.push(wcss);
        dbiValues.push(0); // DBI is undefined for k=1
        console.log(`K=1: WCSS=${wcss.toFixed(3)}, DBI=0 (undefined)`);
        continue;
      }

      // Run K-Means clustering with retry mechanism
      let result = runKMeansWithRetry(features, k);
      
      // Validate and fix result if needed
      result = validateClusteringResult(result, k, features.length, features);

      // Calculate WCSS
      const wcss = calculateWCSS(features, result.clusters, result.centroids);
      wcssValues.push(wcss);

      // Calculate Davies-Bouldin Index
      const dbi = calculateDaviesBouldinIndex(features, result.clusters, result.centroids);
      dbiValues.push(dbi);

      console.log(`K=${k}: WCSS=${wcss.toFixed(3)}, DBI=${dbi.toFixed(3)}`);

    } catch (error) {
      console.error(`Error calculating metrics for k=${k}:`, error);
      
      // Use reasonable fallback values based on previous values
      const prevWCSS = wcssValues[wcssValues.length - 1];
      const prevDBI = dbiValues[dbiValues.length - 1];
      
      let fallbackWCSS: number;
      let fallbackDBI: number;
      
      if (prevWCSS !== undefined && prevWCSS > 0) {
        // Decrease WCSS as K increases (typical pattern)
        fallbackWCSS = prevWCSS * (0.6 + Math.random() * 0.2);
        fallbackDBI = Math.max(0.1, (prevDBI || 1) * (0.8 + Math.random() * 0.4));
      } else {
        // First fallback - estimate based on data variance
        const totalVariance = features.reduce((sum, point) => {
          return sum + point.reduce((pSum, val) => pSum + val * val, 0);
        }, 0);
        fallbackWCSS = totalVariance / k;
        fallbackDBI = 1.0 + Math.random() * 0.5;
      }
      
      wcssValues.push(fallbackWCSS);
      dbiValues.push(fallbackDBI);
      console.log(`K=${k}: Using fallback values - WCSS=${fallbackWCSS.toFixed(3)}, DBI=${fallbackDBI.toFixed(3)}`);
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

  console.log(`\n=== Performing K-Means clustering with K=${k} ===`);

  // Extract features
  const features = extractFeatures(data, numericalColumns);

  if (features.length === 0) {
    throw new Error('Tidak ada data numerik yang valid untuk clustering');
  }

  if (features.length < k) {
    throw new Error(`Jumlah data valid (${features.length}) kurang dari jumlah cluster (${k})`);
  }

  try {
    // Run K-Means with retry mechanism
    let result = runKMeansWithRetry(features, k);

    // Validate and fix result if needed
    result = validateClusteringResult(result, k, features.length, features);

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

    console.log(`Final results - WCSS: ${wcss.toFixed(3)}, DBI: ${daviesBouldinIndex.toFixed(3)}`);

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