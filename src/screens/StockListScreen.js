import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { fetchSectorStocks, testBackendConnection } from '../services/stockAPI';
import { calculateTechnicalIndicators } from '../services/technicalAnalysis';
import { scoreFundamentals, scoreTechnical, calculateOverallScore } from '../services/analysisEngine';

export default function StockListScreen({ sector }) {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('score'); // score, price, change
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    setLoading(true);
    setError(null);
    try {
      // First test backend connection
      console.log('Testing backend connection...');
      await testBackendConnection();
      console.log('Backend connection successful!');
      
      console.log('Loading stocks for sector:', sector);
      const data = await fetchSectorStocks(sector);
      console.log('Fetched data:', data.length, 'stocks');
      
      if (!data || data.length === 0) {
        console.warn('No stocks returned from API');
        setError('No stocks available for this sector');
        setStocks([]);
        return;
      }
      
      // Calculate scores for each stock
      const scoredStocks = data.map(stock => {
        const technical = calculateTechnicalIndicators(stock);
        const fundamentalScores = scoreFundamentals(stock);
        const technicalScore = scoreTechnical(technical);
        const overallScore = calculateOverallScore(fundamentalScores, technicalScore);
        
        return {
          ...stock,
          technical,
          fundamentalScores,
          technicalScore,
          overallScore,
        };
      });
      
      // Sort by overall score
      scoredStocks.sort((a, b) => b.overallScore - a.overallScore);
      console.log('Final stocks:', scoredStocks.length);
      setStocks(scoredStocks);
    } catch (error) {
      console.error('Error loading stocks:', error);
      const errorMsg = error.message || 'Unknown error';
      setError(`Failed to load stocks: ${errorMsg}`);
      Alert.alert(
        'Connection Error',
        `Unable to connect to backend server. Please check your internet connection.\n\nError: ${errorMsg}`,
        [{ text: 'OK' }]
      );
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (sortType) => {
    setSortBy(sortType);
    const sorted = [...stocks];
    
    if (sortType === 'score') {
      sorted.sort((a, b) => b.overallScore - a.overallScore);
    } else if (sortType === 'price') {
      sorted.sort((a, b) => b.currentPrice - a.currentPrice);
    } else if (sortType === 'change') {
      sorted.sort((a, b) => b.changePercent - a.changePercent);
    }
    
    setStocks(sorted);
  };

  const getScoreColor = (score) => {
    if (score >= 75) return '#4CAF50';
    if (score >= 60) return '#8BC34A';
    if (score >= 45) return '#FFC107';
    if (score >= 30) return '#FF9800';
    return '#F44336';
  };

  const getScoreLabel = (score) => {
    if (score >= 75) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 45) return 'Fair';
    if (score >= 30) return 'Poor';
    return 'Very Poor';
  };

  const renderStockItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.stockCard}
    >
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{index + 1}</Text>
      </View>
      
      <View style={styles.stockHeader}>
        <View style={styles.stockInfo}>
          <Text style={styles.stockSymbol}>{item.symbol}</Text>
          <Text style={styles.stockName} numberOfLines={1}>
            {item.companyName}
          </Text>
        </View>
        
        <View style={styles.priceInfo}>
          <Text style={styles.stockPrice}>${item.currentPrice?.toFixed(2)}</Text>
          <Text style={[
            styles.stockChange,
            { color: item.changePercent >= 0 ? '#4CAF50' : '#F44336' }
          ]}>
            {item.changePercent >= 0 ? '+' : ''}
            {item.changePercent?.toFixed(2)}%
          </Text>
        </View>
      </View>
      
      <View style={styles.scoreContainer}>
        <View style={styles.scoreBar}>
          <View
            style={[
              styles.scoreBarFill,
              {
                width: `${item.overallScore}%`,
                backgroundColor: getScoreColor(item.overallScore),
              },
            ]}
          />
        </View>
        <View style={styles.scoreDetails}>
          <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.overallScore) }]}>
            <Text style={styles.scoreValue}>{item.overallScore}</Text>
          </View>
          <Text style={styles.scoreLabel}>{getScoreLabel(item.overallScore)}</Text>
        </View>
      </View>
      
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>P/E</Text>
          <Text style={styles.metricValue}>
            {item.peRatio ? item.peRatio.toFixed(2) : 'N/A'}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>ROE</Text>
          <Text style={styles.metricValue}>
            {item.returnOnEquity ? (item.returnOnEquity * 100).toFixed(1) + '%' : 'N/A'}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Debt/Eq</Text>
          <Text style={styles.metricValue}>
            {item.debtToEquity ? item.debtToEquity.toFixed(2) : 'N/A'}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>RSI</Text>
          <Text style={styles.metricValue}>
            {item.technical?.rsi ? item.technical.rsi.toFixed(0) : 'N/A'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Analyzing {sector} stocks...</Text>
        <Text style={styles.loadingSubtext}>
          Fetching data and calculating fundamental & technical indicators
        </Text>
      </View>
    );
  }

  if (stocks.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          {error || 'No stocks found'}
        </Text>
        <Text style={styles.loadingSubtext}>
          {error ? 'Please check your internet connection and try again.' : `Unable to load ${sector} stocks.`}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStocks}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'score' && styles.sortButtonActive]}
          onPress={() => handleSort('score')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'score' && styles.sortButtonTextActive]}>
            Score
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'price' && styles.sortButtonActive]}
          onPress={() => handleSort('price')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'price' && styles.sortButtonTextActive]}>
            Price
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'change' && styles.sortButtonActive]}
          onPress={() => handleSort('change')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'change' && styles.sortButtonTextActive]}>
            Change
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={stocks}
        renderItem={renderStockItem}
        keyExtractor={(item) => item.symbol}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={loadStocks}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  loadingSubtext: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  sortContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  sortButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  sortButtonActive: {
    backgroundColor: '#2196F3',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
  },
  sortButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  listContainer: {
    padding: 15,
  },
  stockCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  rankBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#2196F3',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rankText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  stockInfo: {
    flex: 1,
  },
  stockSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  stockName: {
    fontSize: 14,
    color: '#666',
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  stockChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreContainer: {
    marginBottom: 15,
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  scoreValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
