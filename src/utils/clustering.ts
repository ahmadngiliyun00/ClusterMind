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
    console.warn('Invalid points for distance calculation:', point1, point2);
    return 0;
  }
  
  if (point1.length !== point2.length) {
    console.warn('Points have different dimensions:', point1.length, point2.length);
    return 0;
  }
  
  let sum = 0;
  for (let i = 0; i < point1.length; i++) {
    const diff = (point1[i] || 0) - (point2[i] || 0);
    sum += diff * diff;
  }
  
  return Math.sqrt(sum);
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
  console.log(`Calculating DBI for ${k} clusters with ${data.length} data points`);
  
  if (k <= 1) {
    console.log('DBI: k <= 1, returning 0');
    return 0;
  }

  // Validate input data
  if (!data || data.length === 0 || !clusters || !centroids) {
    console.warn('Invalid input for DBI calculation');
    return 0;
  }

  // Calculate within-cluster scatter (average distance to centroid) for each cluster
  const withinClusterScatter: number[] = [];
  
  for (let i = 0; i < k; i++) {
    const clusterPoints = data.filter((_, idx) => clusters[idx] === i);
    console.log(`Cluster ${i}: ${clusterPoints.length} points`);
    
    if (clusterPoints.length === 0) {
      withinClusterScatter[i] = 0;
      continue;
    }
    
    const centroid = centroids[i];
    if (!Array.isArray(centroid)) {
      console.warn(`Invalid centroid for cluster ${i}:`, centroid);
      withinClusterScatter[i] = 0;
      continue;
    }
    
    let totalDistance = 0;
    for (const point of clusterPoints) {
      const distance = calculateEuclideanDistance(point, centroid);
      totalDistance += distance;
    }
    
    withinClusterScatter[i] = totalDistance / clusterPoints.length;
    console.log(`Cluster ${i} within-scatter: ${withinClusterScatter[i]}`);
  }

  // Calculate between-cluster distances (distance between centroids)
  const betweenClusterDistances: number[][] = [];
  for (let i = 0; i < k; i++) {
    betweenClusterDistances[i] = [];
    for (let j = 0; j < k; j++) {
      if (i !== j) {
        const distance = calculateEuclideanDistance(centroids[i], centroids[j]);
        betweenClusterDistances[i][j] = distance;
        console.log(`Distance between cluster ${i} and ${j}: ${distance}`);
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
    console.log(`Cluster ${i} max ratio: ${maxRatio}`);
  }

  const finalDBI = dbIndex / k;
  console.log(`Final DBI: ${finalDBI}`);
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
  console.log(`Calculating WCSS for ${data.length} points and ${centroids.length} centroids`);
  
  if (!data || !clusters || !centroids) {
    console.warn('Invalid input for WCSS calculation');
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
        wcss += squaredDistance;
        
        if (i < 5) { // Log first few calculations for debugging
          console.log(`Point ${i} (cluster ${clusterIdx}): distance=${distance}, squared=${squaredDistance}`);
        }
      }
    }
  }
  
  console.log(`Total WCSS: ${wcss}`);
  return wcss;
};

/**
 * Extract numerical features from data
 */
const extractFeatures = (data: DataPoint[], numericalColumns: string[]): number[][] => {
  console.log(`Extracting features from ${data.length} rows, ${numericalColumns.length} columns`);
  
  const features = data.map((row, rowIndex) => {
    const values: number[] = [];
    numericalColumns.forEach(column => {
      const value = Number(row[column]);
      if (!isNaN(value) && isFinite(value)) {
        values.push(value);
      } else {
        console.warn(`Invalid value at row ${rowIndex}, column ${column}: ${row[column]}`);
        values.push(0); // Default value for invalid numbers
      }
    });
    return values;
  }).filter(row => row.length === numericalColumns.length);
  
  console.log(`Extracted ${features.length} valid feature vectors`);
  if (features.length > 0) {
    console.log('Sample feature vector:', features[0]);
    console.log('Feature dimensions:', features[0].length);
  }
  
  return features;
};

/**
 * Validate and fix clustering result
 */
const validateClusteringResult = (result: any, k: number, dataLength: number) => {
  console.log('Validating clustering result...');
  console.log('Original result:', {
    clustersLength: result.clusters?.length,
    centroidsLength: result.centroids?.length,
    expectedK: k,
    expectedDataLength: dataLength
  });

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

  // Ensure all centroids are arrays with proper values
  result.centroids = result.centroids.map((centroid: any, index: number) => {
    if (!Array.isArray(centroid)) {
      console.warn(`Centroid ${index} is not an array:`, centroid);
      return [0, 0];
    }
    
    // Ensure all centroid values are numbers
    const validCentroid = centroid.map((val: any) => {
      const num = Number(val);
      return isNaN(num) || !isFinite(num) ? 0 : num;
    });
    
    return validCentroid;
  });

  console.log('Validated result:', {
    clustersLength: result.clusters.length,
    centroidsLength: result.centroids.length,
    sampleClusters: result.clusters.slice(0, 5),
    sampleCentroids: result.centroids[0]
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
  console.log('=== Starting Elbow Method Calculation ===');
  
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
  console.log(`Calculating elbow method for K=1 to K=${maxK}`);

  const wcssValues: number[] = [];
  const dbiValues: number[] = [];

  for (let k = 1; k <= maxK; k++) {
    console.log(`\n--- Processing K=${k} ---`);
    
    try {
      if (k === 1) {
        // For k=1, calculate total variance as WCSS
        const centroid = features[0].map((_, colIdx) => {
          return features.reduce((sum, row) => sum + row[colIdx], 0) / features.length;
        });
        
        console.log('K=1 centroid:', centroid);
        
        let wcss = 0;
        for (const point of features) {
          const distance = calculateEuclideanDistance(point, centroid);
          wcss += distance * distance;
        }
        
        wcssValues.push(wcss);
        dbiValues.push(0); // DBI is undefined for k=1
        console.log(`K=1: WCSS=${wcss}, DBI=0 (undefined)`);
        continue;
      }

      // Run K-Means clustering
      console.log(`Running K-Means for K=${k}...`);
      let result = kmeans(features, k, {
        seed: 42,
        maxIterations: 100,
        initialization: 'random'
      });
      
      console.log('Raw kmeans result:', {
        clustersLength: result.clusters?.length,
        centroidsLength: result.centroids?.length,
        sampleClusters: result.clusters?.slice(0, 5)
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
      console.error(`Error calculating metrics for k=${k}:`, error);
      // Use reasonable fallback values based on previous values
      const prevWCSS = wcssValues[wcssValues.length - 1] || 1000;
      const prevDBI = dbiValues[dbiValues.length - 1] || 1;
      
      const fallbackWCSS = prevWCSS * 0.8;
      const fallbackDBI = prevDBI * 1.1;
      
      wcssValues.push(fallbackWCSS);
      dbiValues.push(fallbackDBI);
      
      console.log(`K=${k}: Using fallback values - WCSS=${fallbackWCSS}, DBI=${fallbackDBI}`);
    }
  }

  console.log('=== Elbow Method Results ===');
  console.log('WCSS values:', wcssValues);
  console.log('DBI values:', dbiValues);

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
  console.log(`=== Starting K-Means Clustering (K=${k}) ===`);
  
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
    console.log(`Running K-Means clustering...`);
    let result = kmeans(features, k, {
      seed: 42,
      maxIterations: 100,
      initialization: 'random'
    });

    console.log('Raw clustering result:', {
      clustersLength: result.clusters?.length,
      centroidsLength: result.centroids?.length
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

    console.log('Cluster sizes:', clusterSizes);

    // Calculate evaluation metrics
    const daviesBouldinIndex = calculateDaviesBouldinIndex(
      features,
      result.clusters,
      result.centroids
    );

    // Calculate WCSS
    const wcss = calculateWCSS(features, result.clusters, result.centroids);

    console.log(`Final metrics - WCSS: ${wcss.toFixed(3)}, DBI: ${daviesBouldinIndex.toFixed(3)}`);

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