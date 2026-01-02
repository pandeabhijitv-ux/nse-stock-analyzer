import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { generateRecommendation } from '../services/analysisEngine';

const screenWidth = Dimensions.get('window').width;

export default function StockDetailScreen({ route }) {
  const { stock } = route.params;
  const [activeTab, setActiveTab] = useState('overview'); // overview, fundamental, technical

  const recommendation = generateRecommendation(
    stock.overallScore,
    stock.fundamentalScores,
    stock.technicalScore,
    stock
  );

  const getActionColor = (action) => {
    if (action.includes('Strong Buy')) return '#4CAF50';
    if (action.includes('Buy')) return '#8BC34A';
    if (action.includes('Hold')) return '#FFC107';
    if (action.includes('Sell') && !action.includes('Strong')) return '#FF9800';
    return '#F44336';
  };

  const getRiskColor = (risk) => {
    if (risk === 'Low') return '#4CAF50';
    if (risk === 'Medium') return '#FFC107';
    return '#F44336';
  };

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Recommendation Card */}
      <View style={[styles.card, styles.recommendationCard]}>
        <View style={[styles.actionBadge, { backgroundColor: getActionColor(recommendation.action) }]}>
          <Text style={styles.actionText}>{recommendation.action}</Text>
        </View>
        <Text style={styles.recommendationText}>{recommendation.recommendation}</Text>
        
        <View style={styles.riskContainer}>
          <Text style={styles.riskLabel}>Risk Level:</Text>
          <View style={[styles.riskBadge, { backgroundColor: getRiskColor(recommendation.riskLevel) }]}>
            <Text style={styles.riskText}>{recommendation.riskLevel}</Text>
          </View>
        </View>
        
        {recommendation.reasons.length > 0 && (
          <View style={styles.reasonsContainer}>
            <Text style={styles.reasonsTitle}>Key Points:</Text>
            {recommendation.reasons.map((reason, index) => (
              <View key={index} style={styles.reasonItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Overall Score */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Overall Score</Text>
        <View style={styles.scoreDisplay}>
          <View style={[styles.scoreBadgeLarge, { backgroundColor: getActionColor(recommendation.action) }]}>
            <Text style={styles.scoreLarge}>{stock.overallScore}</Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
        </View>
      </View>

      {/* Category Scores */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Score Breakdown</Text>
        {renderScoreBar('Valuation', stock.fundamentalScores.valuation)}
        {renderScoreBar('Profitability', stock.fundamentalScores.profitability)}
        {renderScoreBar('Growth', stock.fundamentalScores.growth)}
        {renderScoreBar('Financial Health', stock.fundamentalScores.financialHealth)}
        {renderScoreBar('Dividend', stock.fundamentalScores.dividend)}
        {renderScoreBar('Technical', stock.technicalScore.overall)}
      </View>

      {/* Price Chart */}
      {stock.prices && stock.prices.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price Chart (1 Year)</Text>
          <LineChart
            data={{
              labels: [],
              datasets: [{
                data: stock.prices.filter(p => p !== null).slice(-90),
              }],
            }}
            width={screenWidth - 60}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '0',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}
    </View>
  );

  const renderFundamental = () => (
    <View style={styles.tabContent}>
      {/* Valuation Metrics */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Valuation Metrics</Text>
        {renderMetric('P/E Ratio', stock.peRatio?.toFixed(2))}
        {renderMetric('Forward P/E', stock.forwardPE?.toFixed(2))}
        {renderMetric('PEG Ratio', stock.pegRatio?.toFixed(2))}
        {renderMetric('Price to Book', stock.priceToBook?.toFixed(2))}
        {renderMetric('Price to Sales', stock.priceToSales?.toFixed(2))}
        {renderMetric('EV/Revenue', stock.enterpriseToRevenue?.toFixed(2))}
        {renderMetric('EV/EBITDA', stock.enterpriseToEbitda?.toFixed(2))}
      </View>

      {/* Profitability */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profitability</Text>
        {renderMetric('Profit Margin', stock.profitMargin ? (stock.profitMargin * 100).toFixed(2) + '%' : 'N/A')}
        {renderMetric('Operating Margin', stock.operatingMargin ? (stock.operatingMargin * 100).toFixed(2) + '%' : 'N/A')}
        {renderMetric('Return on Equity (ROE)', stock.returnOnEquity ? (stock.returnOnEquity * 100).toFixed(2) + '%' : 'N/A')}
        {renderMetric('Return on Assets (ROA)', stock.returnOnAssets ? (stock.returnOnAssets * 100).toFixed(2) + '%' : 'N/A')}
      </View>

      {/* Growth */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Growth Metrics</Text>
        {renderMetric('Revenue Growth', stock.revenueGrowth ? (stock.revenueGrowth * 100).toFixed(2) + '%' : 'N/A')}
        {renderMetric('Earnings Growth', stock.earningsGrowth ? (stock.earningsGrowth * 100).toFixed(2) + '%' : 'N/A')}
        {renderMetric('Quarterly Earnings Growth', stock.earningsQuarterlyGrowth ? (stock.earningsQuarterlyGrowth * 100).toFixed(2) + '%' : 'N/A')}
      </View>

      {/* Financial Health */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Financial Health</Text>
        {renderMetric('Debt to Equity', stock.debtToEquity?.toFixed(2))}
        {renderMetric('Current Ratio', stock.currentRatio?.toFixed(2))}
        {renderMetric('Quick Ratio', stock.quickRatio?.toFixed(2))}
        {renderMetric('Free Cash Flow', stock.freeCashflow ? `$${(stock.freeCashflow / 1e9).toFixed(2)}B` : 'N/A')}
      </View>

      {/* Dividend */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dividend Information</Text>
        {renderMetric('Dividend Yield', stock.dividendYield ? (stock.dividendYield * 100).toFixed(2) + '%' : 'N/A')}
        {renderMetric('Dividend Rate', stock.dividendRate ? `$${stock.dividendRate.toFixed(2)}` : 'N/A')}
        {renderMetric('Payout Ratio', stock.payoutRatio ? (stock.payoutRatio * 100).toFixed(2) + '%' : 'N/A')}
      </View>

      {/* Risk */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Risk Metrics</Text>
        {renderMetric('Beta', stock.beta?.toFixed(2))}
        {renderMetric('Market Cap', stock.marketCap ? `$${(stock.marketCap / 1e9).toFixed(2)}B` : 'N/A')}
      </View>
    </View>
  );

  const renderTechnical = () => {
    const tech = stock.technical;
    if (!tech) {
      return (
        <View style={styles.tabContent}>
          <Text style={styles.noDataText}>Technical data not available</Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {/* Momentum Indicators */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Momentum Indicators</Text>
          {renderMetric('RSI (14)', tech.rsi?.toFixed(2), tech.rsiSignal)}
          {renderMetric('Stochastic %K', tech.stochastic?.k?.toFixed(2), tech.stochasticSignal)}
          {renderMetric('MACD', tech.macd?.macd?.toFixed(2), tech.macdSignal)}
          {renderMetric('MACD Signal', tech.macd?.signal?.toFixed(2))}
          {renderMetric('MACD Histogram', tech.macd?.histogram?.toFixed(2))}
        </View>

        {/* Trend Indicators */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trend & Moving Averages</Text>
          {renderMetric('Trend', tech.trend)}
          {renderMetric('SMA 20', tech.movingAverages?.sma20?.toFixed(2))}
          {renderMetric('SMA 50', tech.movingAverages?.sma50?.toFixed(2))}
          {renderMetric('SMA 200', tech.movingAverages?.sma200?.toFixed(2))}
          {renderMetric('EMA 12', tech.movingAverages?.ema12?.toFixed(2))}
          {renderMetric('EMA 26', tech.movingAverages?.ema26?.toFixed(2))}
        </View>

        {/* Volatility */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Volatility Indicators</Text>
          {renderMetric('Bollinger Upper', tech.bollingerBands?.upper?.toFixed(2))}
          {renderMetric('Bollinger Middle', tech.bollingerBands?.middle?.toFixed(2))}
          {renderMetric('Bollinger Lower', tech.bollingerBands?.lower?.toFixed(2))}
          {renderMetric('BB Signal', tech.bbSignal)}
          {renderMetric('ATR (14)', tech.atr?.toFixed(2))}
        </View>

        {/* Support & Resistance */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Support & Resistance</Text>
          {renderMetric('Resistance', tech.supportResistance?.resistance?.toFixed(2) || 'N/A')}
          {renderMetric('Support', tech.supportResistance?.support?.toFixed(2) || 'N/A')}
        </View>

        {/* Volume Analysis */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Volume Analysis</Text>
          {renderMetric('Current Volume', tech.volumeAnalysis?.currentVolume?.toLocaleString())}
          {renderMetric('Average Volume', tech.volumeAnalysis?.averageVolume?.toFixed(0))}
          {renderMetric('Volume Ratio', tech.volumeAnalysis?.volumeRatio?.toFixed(2))}
          {renderMetric('High Volume?', tech.volumeAnalysis?.isHighVolume ? 'Yes' : 'No')}
        </View>

        {/* Technical Score Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Technical Score Breakdown</Text>
          {renderScoreBar('Momentum', stock.technicalScore.momentum)}
          {renderScoreBar('Trend', stock.technicalScore.trend)}
          {renderScoreBar('Volatility', stock.technicalScore.volatility)}
          {renderScoreBar('Volume', stock.technicalScore.volume)}
        </View>
      </View>
    );
  };

  const renderMetric = (label, value, badge = null) => (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricValueContainer}>
        <Text style={styles.metricValue}>{value || 'N/A'}</Text>
        {badge && (
          <View style={[styles.badge, getBadgeStyle(badge)]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const getBadgeStyle = (badge) => {
    if (badge.includes('Bullish') || badge.includes('Oversold') || badge.includes('Uptrend')) {
      return { backgroundColor: '#4CAF50' };
    }
    if (badge.includes('Bearish') || badge.includes('Overbought') || badge.includes('Downtrend')) {
      return { backgroundColor: '#F44336' };
    }
    return { backgroundColor: '#9E9E9E' };
  };

  const renderScoreBar = (label, value) => (
    <View style={styles.scoreBarContainer}>
      <View style={styles.scoreBarHeader}>
        <Text style={styles.scoreBarLabel}>{label}</Text>
        <Text style={styles.scoreBarValue}>{Math.round(value)}</Text>
      </View>
      <View style={styles.scoreBarTrack}>
        <View
          style={[
            styles.scoreBarFill,
            {
              width: `${value}%`,
              backgroundColor: value >= 70 ? '#4CAF50' : value >= 40 ? '#FFC107' : '#F44336',
            },
          ]}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSymbol}>{stock.symbol}</Text>
            <Text style={styles.headerName}>{stock.companyName}</Text>
            <Text style={styles.headerIndustry}>{stock.industry}</Text>
          </View>
          <View style={styles.headerPrice}>
            <Text style={styles.price}>${stock.currentPrice?.toFixed(2)}</Text>
            <Text style={[
              styles.change,
              { color: stock.changePercent >= 0 ? '#4CAF50' : '#F44336' }
            ]}>
              {stock.changePercent >= 0 ? '+' : ''}
              {stock.changePercent?.toFixed(2)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'fundamental' && styles.tabActive]}
          onPress={() => setActiveTab('fundamental')}
        >
          <Text style={[styles.tabText, activeTab === 'fundamental' && styles.tabTextActive]}>
            Fundamental
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'technical' && styles.tabActive]}
          onPress={() => setActiveTab('technical')}
        >
          <Text style={[styles.tabText, activeTab === 'technical' && styles.tabTextActive]}>
            Technical
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'fundamental' && renderFundamental()}
        {activeTab === 'technical' && renderTechnical()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerSymbol: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerName: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  headerIndustry: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  headerPrice: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  change: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  recommendationCard: {
    backgroundColor: '#f8f9fa',
  },
  actionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 15,
  },
  actionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recommendationText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 15,
  },
  riskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  riskLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  riskText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  reasonsContainer: {
    marginTop: 10,
  },
  reasonsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reasonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  scoreDisplay: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  scoreBadgeLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreLarge: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  scoreMax: {
    fontSize: 18,
    color: 'white',
  },
  scoreBarContainer: {
    marginBottom: 20,
  },
  scoreBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scoreBarLabel: {
    fontSize: 14,
    color: '#666',
  },
  scoreBarValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  scoreBarTrack: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 50,
  },
});
