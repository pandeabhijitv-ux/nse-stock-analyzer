import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { fetchSectorStocks, fetchAllStocks, fetchETFs, fetchMutualFunds, testBackendConnection } from '../services/stockAPI';
import { calculateTechnicalIndicators } from '../services/technicalAnalysis';
import { scoreFundamentals, scoreTechnical, calculateOverallScore } from '../services/analysisEngine';

export default function StockListScreen({ sector, onStockPress }) {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('score'); // score, price, change
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStocks();
  }, [sector]); // Only reload when sector changes

  const getAnalysisCategoryTitle = (categoryId) => {
    const titles = {
      'target-oriented': 'Target Oriented Stocks',
      'swing': 'Swing Stocks',
      'fundamentally-strong': 'Fundamentally Strong',
      'technically-strong': 'Technically Strong',
      'hot-stocks': 'Hot Stocks Today',
      'graha-gochar': 'Graha Gochar Impact',
      'etf': 'ETF Analysis',
      'mutual-funds': 'Mutual Fund Stocks',
    };
    return titles[categoryId] || categoryId;
  };

  const filterStocksByAnalysis = (allStocks, analysisType) => {
    console.log(`\n=== FILTERING ${allStocks.length} STOCKS FOR ${analysisType.toUpperCase()} ===`);
    let filtered = [...allStocks];
    
    // Calculate target prices and category-specific scores for all stocks
    filtered = filtered.map(stock => {
      const currentPrice = stock.currentPrice || 0;
      let targetPrice = currentPrice;
      let stopLoss = currentPrice * 0.95;
      let categoryScore = stock.overallScore || 50;
      
      // Calculate target based on recommendation and category
      const action = stock.overallScore >= 70 ? 'BUY' : stock.overallScore >= 50 ? 'HOLD' : 'SELL';
      
      if (analysisType === 'target-oriented') {
        targetPrice = action === 'BUY' ? currentPrice * 1.15 : action === 'HOLD' ? currentPrice * 1.05 : currentPrice * 0.92;
        categoryScore = stock.overallScore;
      } else if (analysisType === 'swing') {
        const momentum = Math.abs(stock.changePercent || 0);
        categoryScore = momentum > 3 ? 90 : momentum > 2 ? 80 : momentum > 1 ? 70 : 50;
        targetPrice = action === 'BUY' ? currentPrice * 1.10 : action === 'HOLD' ? currentPrice * 1.05 : currentPrice * 0.95;
        stopLoss = currentPrice * 0.97;
      } else if (analysisType === 'fundamentally-strong') {
        const pe = stock.peRatio || 25;
        categoryScore = pe < 20 ? 90 : pe < 30 ? 75 : 60;
        targetPrice = action === 'BUY' ? currentPrice * 1.20 : action === 'HOLD' ? currentPrice * 1.08 : currentPrice * 0.90;
        stopLoss = currentPrice * 0.93;
      } else if (analysisType === 'technically-strong') {
        categoryScore = stock.technicalScore || 50;
        targetPrice = action === 'BUY' ? currentPrice * 1.12 : action === 'HOLD' ? currentPrice * 1.05 : currentPrice * 0.92;
        stopLoss = currentPrice * 0.96;
      } else if (analysisType === 'hot-stocks') {
        categoryScore = Math.abs(stock.changePercent || 0) * 10;
        const baseMultiplier = (stock.changePercent || 0) > 0 ? 1.08 : 0.95;
        targetPrice = action === 'BUY' ? currentPrice * baseMultiplier : action === 'HOLD' ? currentPrice * 1.03 : currentPrice * 0.93;
        stopLoss = currentPrice * 0.97;
      } else {
        targetPrice = action === 'BUY' ? currentPrice * 1.10 : action === 'HOLD' ? currentPrice * 1.05 : currentPrice * 0.95;
      }
      
      return {
        ...stock,
        targetPrice: parseFloat(targetPrice.toFixed(2)),
        stopLoss: parseFloat(stopLoss.toFixed(2)),
        categoryScore,
        upsidePercent: parseFloat((((targetPrice - currentPrice) / currentPrice) * 100).toFixed(2)),
      };
    });
    
    switch (analysisType) {
      case 'target-oriented':
        // Stocks with clear upside potential and good overall score
        filtered = filtered.filter(s => {
          const rsi = s.technical?.rsi || 50;
          const macd = s.technical?.macd?.macd || 0;
          const score = s.overallScore || 50;
          const upside = s.upsidePercent || 0;
          // Must have good upside potential (>5%) AND good score/technicals
          return upside > 5 && (score >= 65 || (rsi >= 45 && rsi <= 65 && macd > 0));
        });
        filtered.sort((a, b) => (b.upsidePercent || 0) - (a.upsidePercent || 0));
        console.log(`Target-Oriented: ${filtered.length} stocks with >5% upside`);
        break;
        
      case 'swing':
        // High momentum stocks with volatility
        filtered = filtered.filter(s => {
          const macd = s.technical?.macd?.macd || 0;
          const rsi = s.technical?.rsi || 50;
          const change = Math.abs(s.changePercent || 0);
          const histogram = s.technical?.macd?.histogram || 0;
          // Must have strong momentum indicators
          return (change > 1) || (macd > 0 && rsi > 55 && histogram > 0);
        });
        filtered.sort((a, b) => Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0));
        console.log(`Swing: ${filtered.length} stocks with high momentum`);
        break;
        
      case 'fundamentally-strong':
        // Best fundamental metrics only
        filtered = filtered.filter(s => {
          const pe = s.peRatio;
          const roe = s.returnOnEquity;
          const profitMargin = s.profitMargin;
          const fundamentalScore = s.fundamentalScores?.overall || 0;
          
          // Must have good fundamentals (not just overall score)
          const hasFundamentals = pe !== null && pe !== undefined;
          if (hasFundamentals) {
            // Good PE (<25), or good ROE (>15%), or good profit margin (>10%)
            const goodPE = pe > 0 && pe < 25;
            const goodROE = roe && roe > 0.15;
            const goodMargin = profitMargin && profitMargin > 0.10;
            return goodPE || goodROE || goodMargin || fundamentalScore >= 70;
          }
          return false; // Skip stocks without fundamentals
        });
        filtered.sort((a, b) => {
          const scoreA = (a.fundamentalScores?.overall || 0);
          const scoreB = (b.fundamentalScores?.overall || 0);
          return scoreB - scoreA;
        });
        console.log(`Fundamentally-Strong: ${filtered.length} stocks with good fundamentals`);
        break;
        
      case 'technically-strong':
        // Strong technical patterns and indicators
        filtered = filtered.filter(s => {
          const rsi = s.technical?.rsi || 50;
          const macd = s.technical?.macd?.macd || 0;
          const signal = s.technical?.macd?.signal || 0;
          const trend = s.technical?.trend || '';
          const technicalScore = s.technicalScore || 50;
          
          // Must have strong technical setup
          const bullishMACD = macd > signal && macd > 0;
          const goodRSI = rsi >= 50 && rsi <= 70;
          const uptrend = trend === 'Uptrend';
          
          // At least 2 of 3 conditions must be true, OR high technical score
          const conditions = [bullishMACD, goodRSI, uptrend].filter(Boolean).length;
          return conditions >= 2 || technicalScore >= 70;
        });
        filtered.sort((a, b) => (b.technicalScore || 0) - (a.technicalScore || 0));
        console.log(`Technically-Strong: ${filtered.length} stocks with strong technicals`);
        break;
        
      case 'hot-stocks':
        // Highest movers today - significant movement only
        filtered = filtered.filter(s => {
          const change = Math.abs(s.changePercent || 0);
          return change > 0.3; // At least 0.3% movement
        });
        if (filtered.length < 5) {
          // If too few movers, include all with any movement
          filtered = allStocks.filter(s => (s.changePercent || 0) !== 0);
        }
        filtered.sort((a, b) => (b.categoryScore || 0) - (a.categoryScore || 0));
        console.log(`Hot-Stocks: ${filtered.length} stocks with significant movement`);
        break;
        
      case 'graha-gochar':
        // Stocks influenced by planetary transits
        // Focus on astrologically favorable sectors and momentum
        filtered = filtered.filter(s => {
          const rsi = s.technical?.rsi || 50;
          const score = s.overallScore || 50;
          const sector = s.sector || '';
          const isInfluencedSector = 
            sector.toLowerCase().includes('energy') || 
            sector.toLowerCase().includes('bank') || 
            sector.toLowerCase().includes('technology') ||
            sector.toLowerCase().includes('financial');
          
          // Prefer influenced sectors with good momentum
          if (isInfluencedSector) {
            return rsi > 45 && rsi < 75;
          }
          // Others must have strong score
          return score >= 65 && rsi > 50;
        });
        // If too few, expand to all with good momentum
        if (filtered.length < 10) {
          filtered = allStocks.filter(s => {
            const rsi = s.technical?.rsi || 50;
            const score = s.overallScore || 50;
            return score >= 60 && rsi > 45 && rsi < 75;
          });
        }
        filtered.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
        console.log(`Graha-Gochar: ${filtered.length} stocks with favorable planetary influence`);
        break;
        
      default:
        // Keep all stocks
        filtered.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
        console.log(`Default: ${filtered.length} stocks sorted by overall score`);
    }
    
    console.log(`=== FILTERING COMPLETE: Returning top ${Math.min(filtered.length, 20)} stocks ===\n`);
    return filtered.slice(0, 20); // Return top 20 stocks
  };

  const loadStocks = async () => {
    setLoading(true);
    setError(null);
    try {
      // First test backend connection
      console.log('Testing backend connection...');
      await testBackendConnection();
      console.log('Backend connection successful!');
      
      // Check if this is an analysis category or traditional sector
      const isAnalysisCategory = ['target-oriented', 'swing', 'fundamentally-strong', 'technically-strong', 'hot-stocks', 'graha-gochar'].includes(sector);
      const isETF = sector === 'etf';
      const isMutualFund = sector === 'mutual-funds';
      
      console.log('Loading stocks for:', sector, '(Analysis category:', isAnalysisCategory, ', ETF:', isETF, ', MF:', isMutualFund, ')');
      
      let data;
      if (isETF) {
        // Fetch ETF data
        data = await fetchETFs();
      } else if (isMutualFund) {
        // Fetch Mutual Fund stocks
        data = await fetchMutualFunds();
      } else if (isAnalysisCategory) {
        // Fetch all stocks for analysis filtering
        data = await fetchAllStocks();
      } else {
        // Fetch sector-specific stocks
        data = await fetchSectorStocks(sector);
      }
      
      console.log('Fetched data:', data.length, 'stocks');
      
      if (!data || data.length === 0) {
        console.warn('No stocks returned from API');
        setError('No stocks available');
        setStocks([]);
        return;
      }
      
      // Calculate scores for each stock
      const scoredStocks = data.map(stock => {
        try {
          const technical = calculateTechnicalIndicators(stock) || {};
          const fundamentalScores = scoreFundamentals(stock) || {};
          const technicalScore = scoreTechnical(technical) || 50;
          const overallScore = calculateOverallScore(fundamentalScores, technicalScore) || 50;
          
          return {
            ...stock,
            technical,
            fundamentalScores,
            technicalScore,
            overallScore,
          };
        } catch (error) {
          console.error('Error calculating scores for stock:', stock.symbol, error);
          // Return stock with default scores if calculation fails
          return {
            ...stock,
            technical: {},
            fundamentalScores: {},
            technicalScore: 50,
            overallScore: 50,
          };
        }
      });
      
      // Apply analysis filtering if it's an analysis category
      let finalStocks = scoredStocks;
      if (isAnalysisCategory) {
        console.log(`Applying ${sector} category filter...`);
        finalStocks = filterStocksByAnalysis(scoredStocks, sector);
        console.log(`After filtering: ${finalStocks.length} stocks match ${sector} criteria`);
        
        // Fallback: if filtering resulted in 0 stocks, show all stocks
        if (finalStocks.length === 0) {
          console.warn(`No stocks matched ${sector} filter, showing all stocks`);
          finalStocks = scoredStocks;
          // Only sort by overall score if no filtering was applied
          finalStocks.sort((a, b) => b.overallScore - a.overallScore);
        }
        // DON'T sort again here - filtering already sorted by category-specific criteria
      } else {
        // For regular sectors (not analysis categories), sort by overall score
        finalStocks.sort((a, b) => b.overallScore - a.overallScore);
      }
      
      // Final check
      if (finalStocks.length === 0) {
        console.warn('Final stocks list is empty');
        setError('No stocks available for this category');
        setStocks([]);
        setLoading(false);
        return;
      }
      
      setStocks(finalStocks);
      setLoading(false);
      console.log('Load complete. Stocks displayed:', finalStocks.length);
    } catch (error) {
      console.error('Error loading stocks:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });
      const errorMsg = error.message || 'Unknown error occurred while loading stocks';
      setError(`Failed to load stocks: ${errorMsg}`);
      Alert.alert(
        'Error Loading Stocks',
        `Could not load stock data.\n\nError: ${errorMsg}\n\nPlease check your internet connection and try again.`,
        [
          { text: 'Retry', onPress: loadStocks },
          { text: 'Cancel', style: 'cancel' }
        ]
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
      sorted.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
    } else if (sortType === 'price') {
      sorted.sort((a, b) => (b.currentPrice || 0) - (a.currentPrice || 0));
    } else if (sortType === 'change') {
      sorted.sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));
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

  // Memoized render function for better performance
  const renderStockItem = useCallback(({ item, index }) => (
    <TouchableOpacity
      style={styles.stockCard}
      onPress={() => onStockPress && onStockPress(item, sector)}
    >
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{index + 1}</Text>
      </View>
      
      <View style={styles.stockHeader}>
        <View style={styles.stockInfo}>
          <Text style={styles.stockSymbol}>{item.symbol || 'N/A'}</Text>
          <Text style={styles.stockName} numberOfLines={1}>
            {item.companyName || item.symbol?.replace('.NS', '') || 'Unknown'}
          </Text>
        </View>
        
        <View style={styles.priceInfo}>
          <Text style={styles.stockPrice}>
            ₹{(item.currentPrice || 0).toFixed(2)}
          </Text>
          <Text style={[
            styles.stockChange,
            { color: (item.changePercent || 0) >= 0 ? '#4CAF50' : '#F44336' }
          ]}>
            {(item.changePercent || 0) >= 0 ? '+' : ''}
            {(item.changePercent || 0).toFixed(2)}%
          </Text>
        </View>
      </View>
      
      <View style={styles.scoreContainer}>
        <View style={styles.scoreBar}>
          <View
            style={[
              styles.scoreBarFill,
              {
                width: `${Math.min(100, Math.max(0, item.overallScore || 50))}%`,
                backgroundColor: getScoreColor(item.overallScore || 50),
              },
            ]}
          />
        </View>
        <View style={styles.scoreDetails}>
          <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.overallScore || 50) }]}>
            <Text style={styles.scoreValue}>{Math.round(item.overallScore || 50)}</Text>
          </View>
          <Text style={styles.scoreLabel}>{getScoreLabel(item.overallScore || 50)}</Text>
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
      
      <View style={styles.analysisRow}>
        <View style={styles.analysisItem}>
          <Text style={styles.analysisLabel}>Trend</Text>
          <Text style={[styles.analysisValue, { 
            color: item.technical?.trend === 'Uptrend' ? '#4CAF50' : 
                   item.technical?.trend === 'Downtrend' ? '#F44336' : '#FFC107'
          }]}>
            {item.technical?.trend || 'N/A'}
          </Text>
        </View>
        <View style={styles.analysisItem}>
          <Text style={styles.analysisLabel}>MACD</Text>
          <Text style={[styles.analysisValue, { 
            color: item.technical?.macdSignal === 'Bullish' ? '#4CAF50' : '#F44336'
          }]}>
            {item.technical?.macdSignal || 'N/A'}
          </Text>
        </View>
        <View style={styles.analysisItem}>
          <Text style={styles.analysisLabel}>Volume</Text>
          <Text style={styles.analysisValue}>
            {item.volume ? (item.volume / 1000000).toFixed(2) + 'M' : 'N/A'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [sector, onStockPress]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>
          Analyzing {getAnalysisCategoryTitle(sector)}...
        </Text>
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
          {error ? 'Please check your internet connection and try again.' : `Unable to load stocks for ${getAnalysisCategoryTitle(sector)}.`}
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
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => ({
          length: 180,
          offset: 180 * index,
          index,
        })}
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
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  analysisItem: {
    alignItems: 'center',
  },
  analysisLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  analysisValue: {
    fontSize: 12,
    fontWeight: '600',
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
