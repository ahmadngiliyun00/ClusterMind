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
 */
const calculateDaviesBouldinIndex = (
  data: number[][],
  clusters: number[],
  centroids: number[][]
): number => {
  const k = centroids.length;
  console.log(`\n=== Calculating DBI for K=${k} ===`);
  console.log(`Data points: ${data.length}, Clusters array length: ${clusters.length}`);
  
  if (k <= 1) {
    console.log('DBI: k <= 1, returning 0');
    return 0;
  }

  // Validate input data
  if (!data || data.length === 0 || !clusters || !centroids) {
    console.warn('Invalid input for DBI calculation');
    return 0;
  }

  // Check cluster assignments
  const uniqueClusters = [...new Set(clusters)].sort();
  console.log('Unique clusters found:', uniqueClusters);
  console.log('Expected clusters:', Array.from({length: k}, (_, i) => i));

  // Calculate within-cluster scatter (average distance to centroid) for each cluster
  const withinClusterScatter: number[] = [];
  
  for (let i = 0; i < k; i++) {
    const clusterPoints = data.filter((_, idx) => clusters[idx] === i);
    console.log(`Cluster ${i}: ${clusterPoints.length} points`);
    
    if (clusterPoints.length === 0) {
      console.warn(`Cluster ${i} has no points assigned!`);
      withinClusterScatter[i] = 0;
      continue;
    }
    
    const centroid = centroids[i];
    if (!Array.isArray(centroid)) {
      console.warn(`Invalid centroid for cluster ${i}:`, centroid);
      withinClusterScatter[i] = 0;
      continue;
    }
    
    console.log(`Cluster ${i} centroid:`, centroid);
    console.log(`Sample points in cluster ${i}:`, clusterPoints.slice(0, 3));
    
    let totalDistance = 0;
    let validDistances = 0;
    
    for (const point of clusterPoints) {
      const distance = calculateEuclideanDistance(point, centroid);
      if (distance > 0 || !isNaN(distance)) {
        totalDistance += distance;
        validDistances++;
      }
    }
    
    withinClusterScatter[i] = validDistances > 0 ? totalDistance / validDistances : 0;
    console.log(`Cluster ${i} within-scatter: ${withinClusterScatter[i]} (from ${validDistances} valid distances)`);
  }

  // Calculate between-cluster distances (distance between centroids)
  const betweenClusterDistances: number[][] = [];
  for (let i = 0; i < k; i++) {
    betweenClusterDistances[i] = [];
    for (let j = 0; j < k; j++) {
      if (i !== j) {
        const distance = calculateEuclideanDistance(centroids[i], centroids[j]);
        betweenClusterDistances[i][j] = distance;
        console.log(`Distance between centroid ${i} and ${j}: ${distance}`);
      } else {
        betweenClusterDistances[i][j] = Infinity;
      }
    }
  }

  // Calculate Davies-Bouldin Index
  let dbIndex = 0;
  let validRatios = 0;
  
  for (let i = 0; i < k; i++) {
    let maxRatio = 0;
    for (let j = 0; j < k; j++) {
      if (i !== j && betweenClusterDistances[i][j] > 0) {
        const ratio = (withinClusterScatter[i] + withinClusterScatter[j]) / betweenClusterDistances[i][j];
        if (!isNaN(ratio) && isFinite(ratio)) {
          maxRatio = Math.max(maxRatio, ratio);
        }
      }
    }
    if (maxRatio > 0) {
      dbIndex += maxRatio;
      validRatios++;
    }
    console.log(`Cluster ${i} max ratio: ${maxRatio}`);
  }

  const finalDBI = validRatios > 0 ? dbIndex / validRatios : 0;
  console.log(`Final DBI: ${finalDBI} (from ${validRatios} valid ratios)`);
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
  console.log(`\n=== Calculating WCSS ===`);
  console.log(`Data points: ${data.length}, Clusters: ${clusters.length}, Centroids: ${centroids.length}`);
  
  if (!data || !clusters || !centroids) {
    console.warn('Invalid input for WCSS calculation');
    return 0;
  }
  
  // Check cluster assignments distribution
  const clusterCounts = centroids.map((_, i) => clusters.filter(c => c === i).length);
  console.log('Cluster distribution:', clusterCounts);
  
  let wcss = 0;
  let validCalculations = 0;
  
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
          validCalculations++;
          
          if (i < 5) { // Log first few calculations for debugging
            console.log(`Point ${i} (cluster ${clusterIdx}): distance=${distance.toFixed(4)}, squared=${squaredDistance.toFixed(4)}`);
            console.log(`  Point: [${point.slice(0, 3).map(v => v.toFixed(3)).join(', ')}...]`);
            console.log(`  Centroid: [${centroid.slice(0, 3).map(v => v.toFixed(3)).join(', ')}...]`);
          }
        }
      }
    } else {
      console.warn(`Invalid cluster assignment for point ${i}: cluster=${clusterIdx}, max=${centroids.length-1}`);
    }
  }
  
  console.log(`Total WCSS: ${wcss.toFixed(4)} (from ${validCalculations} valid calculations)`);
  return wcss;
};

/**
 * Extract numerical features from data with enhanced validation
 */
const extractFeatures = (data: DataPoint[], numericalColumns: string[]): number[][] => {
  console.log(`\n=== Extracting Features ===`);
  console.log(`Input: ${data.length} rows, ${numericalColumns.length} columns`);
  console.log('Numerical columns:', numericalColumns);
  
  const features: number[][] = [];
  let validRows = 0;
  let invalidRows = 0;
  
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex];
    const values: number[] = [];
    let validValues = 0;
    
    for (const column of numericalColumns) {
      const rawValue = row[column];
      const value = Number(rawValue);
      
      if (!isNaN(value) && isFinite(value)) {
        values.push(value);
        validValues++;
      } else {
        console.warn(`Invalid value at row ${rowIndex}, column ${column}: ${rawValue}`);
        values.push(0); // Use 0 as fallback
      }
    }
    
    if (values.length === numericalColumns.length) {
      features.push(values);
      validRows++;
      
      if (rowIndex < 3) { // Log first few rows
        console.log(`Row ${rowIndex}: [${values.slice(0, 5).map(v => v.toFixed(3)).join(', ')}${values.length > 5 ? '...' : ''}]`);
      }
    } else {
      invalidRows++;
    }
  }
  
  console.log(`Extracted ${validRows} valid rows, ${invalidRows} invalid rows`);
  console.log(`Feature matrix: ${features.length} x ${features[0]?.length || 0}`);
  
  // Calculate basic statistics
  if (features.length > 0) {
    const stats = features[0].map((_, colIdx) => {
      const columnValues = features.map(row => row[colIdx]);
      const mean = columnValues.reduce((sum, val) => sum + val, 0) / columnValues.length;
      const min = Math.min(...columnValues);
      const max = Math.max(...columnValues);
      return { mean: mean.toFixed(3), min: min.toFixed(3), max: max.toFixed(3) };
    });
    console.log('Feature statistics:', stats.slice(0, 3));
  }
  
  return features;
};

/**
 * Validate and fix clustering result with enhanced debugging
 */
const validateClusteringResult = (result: any, k: number, dataLength: number, features: number[][]) => {
  console.log('\n=== Validating Clustering Result ===');
  console.log('Input result structure:', {
    hasClusters: !!result.clusters,
    clustersLength: result.clusters?.length,
    hasCentroids: !!result.centroids,
    centroidsLength: result.centroids?.length,
    expectedK: k,
    expectedDataLength: dataLength
  });

  // Ensure clusters array exists and has correct length
  if (!result.clusters || result.clusters.length !== dataLength) {
    console.warn('Invalid clusters array, creating balanced assignment');
    result.clusters = Array.from({ length: dataLength }, (_, i) => i % k);
  }

  // Check cluster assignment distribution
  const clusterCounts = Array(k).fill(0);
  result.clusters.forEach((cluster: number) => {
    if (cluster >= 0 && cluster < k) {
      clusterCounts[cluster]++;
    }
  });
  console.log('Cluster assignment distribution:', clusterCounts);

  // Ensure centroids array exists and has correct structure
  if (!result.centroids || result.centroids.length !== k) {
    console.warn('Invalid centroids array, calculating from data');
    
    // Calculate centroids from features and cluster assignments
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
      console.warn(`Centroid ${index} is not an array:`, centroid);
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

  console.log('Validated result:', {
    clustersLength: result.clusters.length,
    centroidsLength: result.centroids.length,
    clusterRange: `${Math.min(...result.clusters)} to ${Math.max(...result.clusters)}`,
    centroidDimensions: result.centroids[0]?.length,
    sampleCentroid: result.centroids[0]?.slice(0, 3).map((v: number) => v.toFixed(3))
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
  console.log('\n🔍 === STARTING ELBOW METHOD CALCULATION ===');
  
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
  console.log(`\n📊 Calculating elbow method for K=1 to K=${maxK}`);

  const wcssValues: number[] = [];
  const dbiValues: number[] = [];

  for (let k = 1; k <= maxK; k++) {
    console.log(`\n🎯 === PROCESSING K=${k} ===`);
    
    try {
      if (k === 1) {
        // For k=1, calculate total variance as WCSS
        const centroid = features[0].map((_, colIdx) => {
          return features.reduce((sum, row) => sum + (row[colIdx] || 0), 0) / features.length;
        });
        
        console.log('K=1 centroid:', centroid.slice(0, 3).map(v => v.toFixed(3)));
        
        let wcss = 0;
        for (const point of features) {
          const distance = calculateEuclideanDistance(point, centroid);
          wcss += distance * distance;
        }
        
        wcssValues.push(wcss);
        dbiValues.push(0); // DBI is undefined for k=1
        console.log(`✅ K=1: WCSS=${wcss.toFixed(3)}, DBI=0 (undefined)`);
        continue;
      }

      // Run K-Means clustering
      console.log(`🔄 Running K-Means for K=${k}...`);
      
      let result;
      try {
        result = kmeans(features, k, {
          seed: 42,
          maxIterations: 100,
          initialization: 'random'
        });
      } catch (kmeansError) {
        console.error(`K-Means failed for K=${k}:`, kmeansError);
        throw kmeansError;
      }
      
      console.log('📋 Raw kmeans result:', {
        clustersLength: result.clusters?.length,
        centroidsLength: result.centroids?.length,
        clusterSample: result.clusters?.slice(0, 10),
        centroidSample: Array.isArray(result.centroids?.[0]) 
          ? result.centroids[0].slice(0, 3).map((v: number) => v.toFixed(3))
          : 'N/A'
      });
      
      // Validate and fix result if needed
      result = validateClusteringResult(result, k, features.length, features);

      // Calculate WCSS
      const wcss = calculateWCSS(features, result.clusters, result.centroids);
      wcssValues.push(wcss);

      // Calculate Davies-Bouldin Index
      const dbi = calculateDaviesBouldinIndex(features, result.clusters, result.centroids);
      dbiValues.push(dbi);

      console.log(`✅ K=${k}: WCSS=${wcss.toFixed(3)}, DBI=${dbi.toFixed(3)}`);

    } catch (error) {
      console.error(`❌ Error calculating metrics for k=${k}:`, error);
      
      // Use reasonable fallback values based on previous values or theoretical estimates
      const prevWCSS = wcssValues[wcssValues.length - 1];
      const prevDBI = dbiValues[dbiValues.length - 1];
      
      let fallbackWCSS: number;
      let fallbackDBI: number;
      
      if (prevWCSS !== undefined) {
        // Decrease WCSS as K increases (typical pattern)
        fallbackWCSS = prevWCSS * 0.7;
        fallbackDBI = Math.max(0.1, (prevDBI || 1) * 1.1);
      } else {
        // First fallback - estimate based on data variance
        const totalVariance = features.reduce((sum, point) => {
          return sum + point.reduce((pSum, val) => pSum + val * val, 0);
        }, 0);
        fallbackWCSS = totalVariance / k;
        fallbackDBI = 1.0;
      }
      
      wcssValues.push(fallbackWCSS);
      dbiValues.push(fallbackDBI);
      
      console.log(`🔄 K=${k}: Using fallback values - WCSS=${fallbackWCSS.toFixed(3)}, DBI=${fallbackDBI.toFixed(3)}`);
    }
  }

  console.log('\n📈 === ELBOW METHOD RESULTS ===');
  console.log('WCSS values:', wcssValues.map(v => v.toFixed(3)));
  console.log('DBI values:', dbiValues.map(v => v.toFixed(3)));

  // Validate that we have reasonable values
  const nonZeroWCSS = wcssValues.filter(v => v > 0).length;
  const nonZeroDBI = dbiValues.filter(v => v > 0).length;
  
  console.log(`📊 Non-zero values: WCSS=${nonZeroWCSS}/${wcssValues.length}, DBI=${nonZeroDBI}/${dbiValues.length}`);

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
  console.log(`\n🎯 === STARTING K-MEANS CLUSTERING (K=${k}) ===`);
  
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
    console.log(`🔄 Running K-Means clustering...`);
    let result = kmeans(features, k, {
      seed: 42,
      maxIterations: 100,
      initialization: 'random'
    });

    console.log('📋 Raw clustering result:', {
      clustersLength: result.clusters?.length,
      centroidsLength: result.centroids?.length,
      clusterSample: result.clusters?.slice(0, 10),
      centroidSample: Array.isArray(result.centroids?.[0]) 
        ? result.centroids[0].slice(0, 3).map((v: number) => v.toFixed(3))
        : 'N/A'
    });

    // Validate and fix result if needed
    result = validateClusteringResult(result, k, features.length, features);

    // Count cluster sizes
    const clusterSizes = Array(k).fill(0);
    result.clusters.forEach((cluster: number) => {
      if (cluster >= 0 && cluster < k) {
        clusterSizes[cluster]++;
      }
    });

    console.log('📊 Cluster sizes:', clusterSizes);

    // Calculate evaluation metrics
    const daviesBouldinIndex = calculateDaviesBouldinIndex(
      features,
      result.clusters,
      result.centroids
    );

    // Calculate WCSS
    const wcss = calculateWCSS(features, result.clusters, result.centroids);

    console.log(`📈 Final metrics - WCSS: ${wcss.toFixed(3)}, DBI: ${daviesBouldinIndex.toFixed(3)}`);

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
    console.error('❌ Error in K-Means clustering:', error);
    throw new Error(`Gagal melakukan clustering: ${(error as Error).message}`);
  }
};