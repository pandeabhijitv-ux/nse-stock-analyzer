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
import { FEATURES } from '../services/features';

const screenWidth = Dimensions.get('window').width;

export default function StockDetailScreen({ route, navigation }) {
  const { stock, category } = route.params;
  const [activeTab, setActiveTab] = useState('overview');

  // Ensure all required scores exist with safe defaults
  const safeOverallScore = (typeof stock.overallScore === 'number' && !isNaN(stock.overallScore)) 
    ? stock.overallScore 
    : (stock.fundamentalScore || 50);
    
  const safeFundamentalScores = stock.fundamentalScores || stock.categoryScores || {
    valuation: 0,
    profitability: 0,
    growth: 0,
    financialHealth: 0,
    dividend: 0,
    overall: stock.fundamentalScore || 50
  };
  
  const safeTechnicalScore = (typeof stock.technicalScore === 'number' && !isNaN(stock.technicalScore))
    ? stock.technicalScore
    : 50;

  const recommendation = generateRecommendation(
    safeOverallScore,
    safeFundamentalScores,
    safeTechnicalScore,
    stock
  );
  
  // Determine which tabs to show based on category
  const getTabs = () => {
    if (category === 'target-oriented') {
      return ['overview', 'targets', 'levels'];
    } else if (category === 'swing') {
      return ['overview', 'momentum', 'entry-exit'];
    } else if (category === 'fundamentally-strong') {
      return ['overview', 'fundamentals', 'valuation'];
    } else if (category === 'technically-strong') {
      return ['overview', 'technical', 'patterns'];
    } else {
      return ['overview', 'fundamental', 'technical'];
    }
  };
  
  const tabs = getTabs();
  
  const getTabLabel = (tab) => {
    const labels = {
      'overview': 'Overview',
      'targets': 'Targets',
      'levels': 'Levels',
      'momentum': 'Momentum',
      'entry-exit': 'Entry/Exit',
      'fundamentals': 'Fundamentals',
      'valuation': 'Valuation',
      'technical': 'Technical',
      'patterns': 'Patterns',
      'fundamental': 'Fundamental'
    };
    return labels[tab] || tab;
  };

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
      {/* BIG ACTION BUTTON AT TOP - Like PWA */}
      <TouchableOpacity 
        style={[styles.bigActionButton, { backgroundColor: getActionColor(recommendation.action) }]}
        activeOpacity={0.9}
      >
        <Text style={styles.bigActionText}>{recommendation.action.toUpperCase()}</Text>
      </TouchableOpacity>
      
      {/* Target Price Section - Centered like PWA */}
      {stock.targetPrice && (
        <View style={styles.targetPriceCard}>
          <Text style={styles.targetLabel}>Target Price</Text>
          <Text style={styles.targetPrice}>₹{stock.targetPrice.toFixed(2)}</Text>
          {stock.upsidePercent && (
            <Text style={[styles.upsideText, { color: stock.upsidePercent > 0 ? '#4CAF50' : '#F44336' }]}>
              ({stock.upsidePercent > 0 ? '+' : ''}{stock.upsidePercent.toFixed(1)}% upside)
            </Text>
          )}
        </View>
      )}
      
      {/* Overview Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Overview</Text>
        {renderMetric('Current Price', `₹${stock.currentPrice.toFixed(2)}`)}
        {renderMetric('Overall Score', `${stock.overallScore}/100`)}
        {renderMetric('Market Cap', stock.marketCap ? `₹${(stock.marketCap / 1e7).toFixed(2)}Cr` : 'N/A')}
        {renderMetric('Volume', stock.volume ? `${(stock.volume / 100000).toFixed(2)}L` : 'N/A')}
        {renderMetric('Day High', `₹${stock.high?.[stock.high.length - 1]?.toFixed(2) || 'N/A'}`)}
        {renderMetric('Day Low', `₹${stock.low?.[stock.low.length - 1]?.toFixed(2) || 'N/A'}`)}
      </View>

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
        {renderScoreBar('Valuation', stock.fundamentalScores?.valuation || 0)}
        {renderScoreBar('Profitability', stock.fundamentalScores?.profitability || 0)}
        {renderScoreBar('Growth', stock.fundamentalScores?.growth || 0)}
        {renderScoreBar('Financial Health', stock.fundamentalScores?.financialHealth || 0)}
        {renderScoreBar('Dividend', stock.fundamentalScores?.dividend || 0)}
        {renderScoreBar('Technical', stock.technicalScore?.overall || stock.technicalScore || 0)}
      </View>

      {/* Price Chart */}
      {stock.prices && stock.prices.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price Chart (1 Year)</Text>
          <LineChart
            data={{
              labels: [],
              datasets: [{
                data: stock.prices.filter(p => p !== null && p !== undefined).slice(-90),
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
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price Chart</Text>
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#999', fontSize: 14, textAlign: 'center' }}>
              Historical price data not available for this stock.{'\n'}
              Technical analysis requires at least 50 days of price history.
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderFundamental = () => {
    // Check what data is available
    const hasPE = stock.peRatio !== null && stock.peRatio !== undefined;
    const hasEPS = stock.eps !== null && stock.eps !== undefined;
    const hasMarketCap = stock.marketCapCr !== null && stock.marketCapCr !== undefined;
    const hasBookValue = stock.bookValue !== null && stock.bookValue !== undefined;
    const hasProfitMargin = stock.profitMargin !== null && stock.profitMargin !== undefined;
    const hasROE = stock.returnOnEquity !== null && stock.returnOnEquity !== undefined;
    const hasDebtToEquity = stock.debtToEquity !== null && stock.debtToEquity !== undefined;
    const hasDividendYield = stock.dividendYield !== null && stock.dividendYield !== undefined;
    
    const hasValuationData = hasPE || hasEPS || hasMarketCap || hasBookValue;
    const hasProfitabilityData = hasProfitMargin || hasROE;
    const hasFinancialHealthData = hasDebtToEquity;
    const hasDividendData = hasDividendYield;
    
    return (
      <View style={styles.tabContent}>
        {hasValuationData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Valuation Metrics</Text>
            {hasPE && renderMetric('P/E Ratio', stock.peRatio.toFixed(2))}
            {stock.sectorPE && renderMetric('Sector P/E', stock.sectorPE.toFixed(2))}
            {hasEPS && renderMetric('EPS', `₹${stock.eps.toFixed(2)}`)}
            {hasMarketCap && renderMetric('Market Cap', `₹${stock.marketCapCr.toFixed(0)} Cr`)}
            {hasBookValue && renderMetric('Book Value', `₹${stock.bookValue.toFixed(2)}`)}
            {stock.faceValue && renderMetric('Face Value', `₹${stock.faceValue}`)}
          </View>
        )}

        {hasProfitabilityData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profitability</Text>
            {hasProfitMargin && renderMetric('Profit Margin', (stock.profitMargin * 100).toFixed(2) + '%')}
            {hasROE && renderMetric('Return on Equity (ROE)', (stock.returnOnEquity * 100).toFixed(2) + '%')}
            {stock.returnOnAssets && renderMetric('Return on Assets (ROA)', (stock.returnOnAssets * 100).toFixed(2) + '%')}
          </View>
        )}

        {(stock.revenueGrowth || stock.earningsGrowth) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Growth Metrics</Text>
            {stock.revenueGrowth && renderMetric('Revenue Growth', (stock.revenueGrowth * 100).toFixed(2) + '%')}
            {stock.earningsGrowth && renderMetric('Earnings Growth', (stock.earningsGrowth * 100).toFixed(2) + '%')}
          </View>
        )}

        {hasFinancialHealthData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Financial Health</Text>
            {hasDebtToEquity && renderMetric('Debt to Equity', stock.debtToEquity.toFixed(2))}
            {stock.currentRatio && renderMetric('Current Ratio', stock.currentRatio.toFixed(2))}
          </View>
        )}

        {hasDividendData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dividend Information</Text>
            {hasDividendYield && renderMetric('Dividend Yield', (stock.dividendYield * 100).toFixed(2) + '%')}
          </View>
        )}

        {(stock.week52High || stock.week52Low) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>52-Week Range</Text>
            {stock.week52High && renderMetric('52W High', `₹${stock.week52High.toFixed(2)}`)}
            {stock.week52Low && renderMetric('52W Low', `₹${stock.week52Low.toFixed(2)}`)}
          </View>
        )}
        
        {!hasValuationData && !hasProfitabilityData && !hasFinancialHealthData && !hasDividendData && (
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { color: '#999', textAlign: 'center', marginTop: 20 }]}>
              Limited fundamental data available for this stock.
            </Text>
            <Text style={[styles.analysisText, { textAlign: 'center', marginTop: 10, fontSize: 12 }]}>
              Price and technical indicators are available in other tabs.
            </Text>
          </View>
        )}
        
        {stock.fundamentalSource && (hasValuationData || hasProfitabilityData) && (
          <Text style={[styles.metricLabel, { fontSize: 10, color: '#999', marginTop: 10, textAlign: 'center' }]}>
            Data source: {stock.fundamentalSource}
          </Text>
        )}
      </View>
    );
  };

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
          {renderMetric('RSI (14)', tech.rsi?.current?.toFixed(2) || tech.rsi?.toFixed(2) || 'N/A', tech.rsi?.signal || tech.rsiSignal)}
          {renderMetric('Stochastic %K', tech.stochastic?.k?.toFixed(2) || 'N/A', tech.stochastic?.signal || tech.stochasticSignal)}
          {renderMetric('MACD', tech.macd?.macd?.toFixed(2) || 'N/A', tech.macd?.signal ? (tech.macd.signal > 0 ? 'Bullish' : 'Bearish') : tech.macdSignal)}
          {renderMetric('MACD Signal', tech.macd?.signal?.toFixed(2) || 'N/A')}
          {renderMetric('MACD Histogram', tech.macd?.histogram?.toFixed(2) || 'N/A')}
        </View>

        {/* Trend Indicators */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trend & Moving Averages</Text>
          {renderMetric('Trend', tech.trend || 'N/A')}
          {renderMetric('SMA 20', tech.movingAverages?.sma20?.toFixed(2) || 'N/A')}
          {renderMetric('SMA 50', tech.movingAverages?.sma50?.toFixed(2) || 'N/A')}
          {renderMetric('SMA 200', tech.movingAverages?.sma200?.toFixed(2) || 'N/A')}
          {renderMetric('EMA 12', tech.movingAverages?.ema12?.toFixed(2) || 'N/A')}
          {renderMetric('EMA 26', tech.movingAverages?.ema26?.toFixed(2) || 'N/A')}
        </View>

        {/* Volatility */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Volatility Indicators</Text>
          {renderMetric('Bollinger Upper', tech.bollingerBands?.upper?.toFixed(2) || tech.bollinger?.upper?.toFixed(2) || 'N/A')}
          {renderMetric('Bollinger Middle', tech.bollingerBands?.middle?.toFixed(2) || tech.bollinger?.middle?.toFixed(2) || 'N/A')}
          {renderMetric('Bollinger Lower', tech.bollingerBands?.lower?.toFixed(2) || tech.bollinger?.lower?.toFixed(2) || 'N/A')}
          {renderMetric('BB Signal', tech.bollinger?.signal || tech.bbSignal || 'N/A')}
          {renderMetric('ATR (14)', typeof tech.atr === 'number' ? tech.atr.toFixed(2) : (tech.atr?.current?.toFixed(2) || 'N/A'))}
        </View>

        {/* Support & Resistance */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Support & Resistance</Text>
          {renderMetric('Resistance', tech.supportResistance?.resistance?.toFixed(2) || 'N/A')}
          {renderMetric('Support', tech.supportResistance?.support?.toFixed(2) || 'N/A')}
        </View>

        {/* Analyst Target Prices */}
        {(stock.targetMeanPrice || stock.targetHighPrice || stock.targetLowPrice) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Analyst Target Prices</Text>
            {stock.targetHighPrice && renderMetric('High Target', `₹${stock.targetHighPrice.toFixed(2)}`)}
            {stock.targetMeanPrice && renderMetric('Mean Target', `₹${stock.targetMeanPrice.toFixed(2)}`)}
            {stock.targetLowPrice && renderMetric('Low Target', `₹${stock.targetLowPrice.toFixed(2)}`)}
            {stock.numberOfAnalystOpinions && renderMetric('Analyst Count', stock.numberOfAnalystOpinions.toString())}
            {stock.targetMeanPrice && stock.currentPrice && renderMetric(
              'Upside Potential', 
              `${(((stock.targetMeanPrice - stock.currentPrice) / stock.currentPrice) * 100).toFixed(2)}%`,
              (stock.targetMeanPrice > stock.currentPrice) ? 'Bullish' : 'Bearish'
            )}
          </View>
        )}

        {/* Volume Analysis */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Volume Analysis</Text>
          {renderMetric('Current Volume', tech.volumeAnalysis?.currentVolume?.toLocaleString() || 'N/A')}
          {renderMetric('Average Volume', tech.volumeAnalysis?.averageVolume?.toFixed(0) || 'N/A')}
          {renderMetric('Volume Ratio', tech.volumeAnalysis?.volumeRatio?.toFixed(2) || 'N/A')}
          {renderMetric('High Volume?', tech.volumeAnalysis?.isHighVolume ? 'Yes' : 'No')}
        </View>

        {/* Technical Score Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Technical Score Breakdown</Text>
          {renderScoreBar('Momentum', stock.technicalScore?.momentum || 0)}
          {renderScoreBar('Trend', stock.technicalScore?.trend || 0)}
          {renderScoreBar('Volatility', stock.technicalScore?.volatility || 0)}
          {renderScoreBar('Volume', stock.technicalScore?.volume || 0)}
        </View>
      </View>
    );
  };

  // Targets tab for Target Oriented stocks
  const renderTargets = () => {
    const currentPrice = stock.currentPrice || 0;
    const primaryTarget = stock.targetPrice || currentPrice * 1.15;
    const conservativeTarget = currentPrice * 1.05;
    const stretchTarget = primaryTarget * 1.08;
    
    const conservativeUpside = ((conservativeTarget - currentPrice) / currentPrice) * 100;
    const primaryUpside = ((primaryTarget - currentPrice) / currentPrice) * 100;
    const stretchUpside = ((stretchTarget - currentPrice) / currentPrice) * 100;

    return (
      <View style={styles.tabContent}>
        {/* Conservative Target */}
        <View style={[styles.card, { backgroundColor: '#E8F5E9' }]}>
          <View style={styles.targetHeader}>
            <Text style={styles.targetTitle}>Conservative Target</Text>
            <View style={[styles.riskBadge, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.riskBadgeText}>Low Risk</Text>
            </View>
          </View>
          <Text style={styles.targetPrice}>₹{conservativeTarget.toFixed(2)}</Text>
          <Text style={styles.targetUpside}>+{conservativeUpside.toFixed(1)}% upside</Text>
          <Text style={styles.targetTimeframe}>Timeframe: 7-10 days</Text>
          <Text style={styles.targetDescription}>
            This is a conservative target based on normal market movement. Suitable for risk-averse investors.
          </Text>
        </View>

        {/* Primary Target */}
        <View style={[styles.card, { backgroundColor: '#FFF9C4' }]}>
          <View style={styles.targetHeader}>
            <Text style={styles.targetTitle}>Primary Target</Text>
            <View style={[styles.riskBadge, { backgroundColor: '#FFC107' }]}>
              <Text style={styles.riskBadgeText}>Medium Risk</Text>
            </View>
          </View>
          <Text style={styles.targetPrice}>₹{primaryTarget.toFixed(2)}</Text>
          <Text style={styles.targetUpside}>+{primaryUpside.toFixed(1)}% upside</Text>
          <Text style={styles.targetTimeframe}>Timeframe: 15-20 days</Text>
          <Text style={styles.targetDescription}>
            Main target based on technical analysis and fundamental strength. Recommended for most traders.
          </Text>
        </View>

        {/* Stretch Target */}
        <View style={[styles.card, { backgroundColor: '#E3F2FD' }]}>
          <View style={styles.targetHeader}>
            <Text style={styles.targetTitle}>Stretch Target</Text>
            <View style={[styles.riskBadge, { backgroundColor: '#2196F3' }]}>
              <Text style={styles.riskBadgeText}>High Risk</Text>
            </View>
          </View>
          <Text style={styles.targetPrice}>₹{stretchTarget.toFixed(2)}</Text>
          <Text style={styles.targetUpside}>+{stretchUpside.toFixed(1)}% upside</Text>
          <Text style={styles.targetTimeframe}>Timeframe: 25-30 days</Text>
          <Text style={styles.targetDescription}>
            Aggressive target for breakout scenarios. Requires favorable market conditions.
          </Text>
        </View>

        {/* Risk Management */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Risk Management</Text>
          {renderMetric('Stop Loss', `₹${(stock.stopLoss || currentPrice * 0.95).toFixed(2)}`)}
          {renderMetric('Max Loss', `${(((currentPrice - (stock.stopLoss || currentPrice * 0.95)) / currentPrice) * 100).toFixed(1)}%`)}
          {renderMetric('Risk/Reward Ratio', `1:${(primaryUpside / (((currentPrice - (stock.stopLoss || currentPrice * 0.95)) / currentPrice) * 100)).toFixed(2)}`)}
        </View>
      </View>
    );
  };

  // Levels tab with Support/Resistance
  const renderLevels = () => {
    const currentPrice = stock.currentPrice || 0;
    const high = stock.high?.[stock.high.length - 1] || currentPrice * 1.02;
    const low = stock.low?.[stock.low.length - 1] || currentPrice * 0.98;
    
    // Calculate pivot points
    const pivot = (high + low + currentPrice) / 3;
    const r1 = (2 * pivot) - low;
    const r2 = pivot + (high - low);
    const s1 = (2 * pivot) - high;
    const s2 = pivot - (high - low);

    return (
      <View style={styles.tabContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Support & Resistance Levels</Text>
          
          {/* Resistance Levels */}
          <View style={[styles.levelRow, { backgroundColor: '#FFEBEE' }]}>
            <Text style={styles.levelLabel}>Strong Resistance (R2)</Text>
            <Text style={[styles.levelValue, { color: '#F44336' }]}>₹{r2.toFixed(2)}</Text>
          </View>
          
          <View style={[styles.levelRow, { backgroundColor: '#FFEBEE' }]}>
            <Text style={styles.levelLabel}>Resistance (R1)</Text>
            <Text style={[styles.levelValue, { color: '#FF5722' }]}>₹{r1.toFixed(2)}</Text>
          </View>
          
          {/* Current Price */}
          <View style={[styles.levelRow, { backgroundColor: '#E3F2FD', borderWidth: 2, borderColor: '#2196F3' }]}>
            <Text style={[styles.levelLabel, { fontWeight: 'bold' }]}>Current Price</Text>
            <Text style={[styles.levelValue, { fontWeight: 'bold', color: '#2196F3' }]}>₹{currentPrice.toFixed(2)}</Text>
          </View>
          
          {/* Pivot Point */}
          <View style={[styles.levelRow, { backgroundColor: '#FFF9C4' }]}>
            <Text style={styles.levelLabel}>Pivot Point</Text>
            <Text style={[styles.levelValue, { color: '#FFC107' }]}>₹{pivot.toFixed(2)}</Text>
          </View>
          
          {/* Support Levels */}
          <View style={[styles.levelRow, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.levelLabel}>Support (S1)</Text>
            <Text style={[styles.levelValue, { color: '#4CAF50' }]}>₹{s1.toFixed(2)}</Text>
          </View>
          
          <View style={[styles.levelRow, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.levelLabel}>Strong Support (S2)</Text>
            <Text style={[styles.levelValue, { color: '#2E7D32' }]}>₹{s2.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Level Analysis</Text>
          <Text style={styles.analysisText}>
            • The stock is currently {currentPrice > pivot ? 'above' : 'below'} the pivot point, indicating {currentPrice > pivot ? 'bullish' : 'bearish'} sentiment.
          </Text>
          <Text style={styles.analysisText}>
            • Next resistance: ₹{r1.toFixed(2)} ({((r1 - currentPrice) / currentPrice * 100).toFixed(1)}% above)
          </Text>
          <Text style={styles.analysisText}>
            • Next support: ₹{s1.toFixed(2)} ({((currentPrice - s1) / currentPrice * 100).toFixed(1)}% below)
          </Text>
        </View>
      </View>
    );
  };

  // Momentum tab for Swing stocks
  const renderMomentum = () => {
    const momentumScore = stock.momentumScore || stock.categoryScore || stock.overallScore || 50;
    // CRITICAL FIX: Handle missing technical object (causes crash)
    const hasTechnical = stock.technical && typeof stock.technical === 'object';
    // Handle both backend structure (rsi.current) and client-side (rsi as number)
    const rsi = hasTechnical ? (stock.technical.rsi?.current || stock.technical.rsi || 50) : 50;
    const macd = hasTechnical ? (stock.technical.macd?.macd || 0) : 0;
    const trend = hasTechnical ? (stock.technical.trend || 'Neutral') : 'Neutral';
    const changePercent = stock.changePercent || 0;

    return (
      <View style={styles.tabContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Momentum Score</Text>
          <View style={styles.scoreDisplay}>
            <View style={[styles.scoreBadgeLarge, { backgroundColor: getScoreColor(momentumScore) }]}>
              <Text style={styles.scoreLarge}>{Math.round(momentumScore)}</Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Momentum Indicators</Text>
          {renderMetric('RSI', typeof rsi === 'number' ? rsi.toFixed(1) : 'N/A', rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral')}
          {renderMetric('MACD', typeof macd === 'number' ? macd.toFixed(2) : 'N/A', macd > 0 ? 'Bullish' : 'Bearish')}
          {renderMetric('Trend', trend || 'N/A')}
          {renderMetric('Price Change', typeof changePercent === 'number' ? `${changePercent.toFixed(2)}%` : 'N/A')}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Swing Trading Signals</Text>
          <Text style={styles.analysisText}>
            • Momentum: {momentumScore >= 70 ? 'Strong' : momentumScore >= 50 ? 'Moderate' : 'Weak'}
          </Text>
          <Text style={styles.analysisText}>
            • RSI Status: {rsi > 70 ? 'Overbought - Consider taking profits' : rsi < 30 ? 'Oversold - Potential entry' : 'Neutral zone'}
          </Text>
          <Text style={styles.analysisText}>
            • MACD: {macd > 0 ? 'Bullish crossover active' : 'Bearish pressure present'}
          </Text>
        </View>
      </View>
    );
  };

  // Entry/Exit tab for Swing stocks
  const renderEntryExit = () => {
    const currentPrice = stock.currentPrice || 0;
    const targetPrice = stock.targetPrice || currentPrice * 1.10;
    const stopLoss = stock.stopLoss || currentPrice * 0.97;
    const entryZone = currentPrice * 0.98;
    const entryZoneHigh = currentPrice * 1.02;

    return (
      <View style={styles.tabContent}>
        <View style={[styles.card, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.cardTitle}>Entry Zone</Text>
          <Text style={styles.targetPrice}>₹{entryZone.toFixed(2)} - ₹{entryZoneHigh.toFixed(2)}</Text>
          <Text style={styles.analysisText}>
            Ideal entry zone for swing trading. Wait for price to stabilize in this range before entering.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: '#E3F2FD' }]}>
          <Text style={styles.cardTitle}>Exit Target</Text>
          <Text style={styles.targetPrice}>₹{targetPrice.toFixed(2)}</Text>
          <Text style={styles.targetUpside}>
            +{((targetPrice - currentPrice) / currentPrice * 100).toFixed(1)}% potential gain
          </Text>
          <Text style={styles.analysisText}>
            Book profits when price reaches this level or shows signs of reversal.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: '#FFEBEE' }]}>
          <Text style={styles.cardTitle}>Stop Loss</Text>
          <Text style={[styles.targetPrice, { color: '#F44336' }]}>₹{stopLoss.toFixed(2)}</Text>
          <Text style={[styles.targetUpside, { color: '#F44336' }]}>
            -{((currentPrice - stopLoss) / currentPrice * 100).toFixed(1)}% max loss
          </Text>
          <Text style={styles.analysisText}>
            Exit position if price falls below this level to limit losses.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trade Setup</Text>
          {renderMetric('Position Size', 'Based on risk tolerance')}
          {renderMetric('Risk/Reward', `1:${(((targetPrice - currentPrice) / (currentPrice - stopLoss))).toFixed(2)}`)}
          {renderMetric('Holding Period', '3-7 days (typical swing)')}
        </View>
      </View>
    );
  };

  // Patterns tab for Technical stocks
  const renderPatterns = () => {
    // CRITICAL FIX: Handle missing technical object (causes crash)
    const hasTechnical = stock.technical && typeof stock.technical === 'object';
    const rsi = hasTechnical ? (stock.technical.rsi?.current || stock.technical.rsi || 50) : 50;
    const macd = hasTechnical ? (stock.technical.macd?.macd || 0) : 0;
    const trend = hasTechnical ? (stock.technical.trend || 'Neutral') : 'Neutral';
    const changePercent = stock.changePercent || 0;
    const technicalScore = stock.technicalScore?.overall || stock.technicalScore || 50;

    // Simple pattern detection
    let patterns = [];
    if (rsi < 30 && macd > 0) {
      patterns.push({ name: 'Potential Reversal', confidence: 'High', direction: 'Bullish' });
    }
    if (rsi > 70 && macd < 0) {
      patterns.push({ name: 'Potential Reversal', confidence: 'High', direction: 'Bearish' });
    }
    if (trend === 'Uptrend' && changePercent > 2) {
      patterns.push({ name: 'Strong Momentum', confidence: 'Medium', direction: 'Bullish' });
    }
    if (trend === 'Downtrend' && changePercent < -2) {
      patterns.push({ name: 'Strong Momentum', confidence: 'Medium', direction: 'Bearish' });
    }

    return (
      <View style={styles.tabContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detected Patterns</Text>
          {patterns.length > 0 ? (
            patterns.map((pattern, index) => (
              <View key={index} style={styles.patternCard}>
                <View style={styles.patternHeader}>
                  <Text style={styles.patternName}>{pattern.name}</Text>
                  <View style={[styles.badge, { backgroundColor: pattern.direction === 'Bullish' ? '#4CAF50' : '#F44336' }]}>
                    <Text style={styles.badgeText}>{pattern.direction}</Text>
                  </View>
                </View>
                <Text style={styles.patternConfidence}>Confidence: {pattern.confidence}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No clear patterns detected at this time</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Technical Setup</Text>
          {renderMetric('Current Trend', trend)}
          {renderMetric('RSI Signal', rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral')}
          {renderMetric('MACD', macd > 0 ? 'Bullish' : 'Bearish')}
          {renderMetric('Price Momentum', `${changePercent.toFixed(2)}%`)}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pattern Analysis</Text>
          <Text style={styles.analysisText}>
            • The stock is in {trend.toLowerCase()} showing {Math.abs(changePercent) > 2 ? 'strong' : 'moderate'} movement.
          </Text>
          <Text style={styles.analysisText}>
            • RSI at {rsi.toFixed(0)} suggests {rsi > 70 ? 'overbought conditions' : rsi < 30 ? 'oversold conditions' : 'balanced momentum'}.
          </Text>
          <Text style={styles.analysisText}>
            • MACD is {macd > 0 ? 'positive' : 'negative'}, indicating {macd > 0 ? 'bullish' : 'bearish'} pressure.
          </Text>
        </View>
      </View>
    );
  };

  // Valuation tab for Fundamentally Strong stocks
  const renderValuation = () => {
    const fundScore = stock.fundamentalScores?.overall || 50;
    
    // Check what fundamental data is available
    const hasPE = stock.peRatio !== null && stock.peRatio !== undefined;
    const hasEPS = stock.eps !== null && stock.eps !== undefined;
    const hasMarketCap = stock.marketCapCr !== null && stock.marketCapCr !== undefined;
    const hasBookValue = stock.bookValue !== null && stock.bookValue !== undefined;
    const has52WeekData = stock.week52High !== null && stock.week52High !== undefined;
    const hasFaceValue = stock.faceValue !== null && stock.faceValue !== undefined;
    const hasSectorPE = stock.sectorPE !== null && stock.sectorPE !== undefined;
    
    const hasAnyValuationData = hasPE || hasEPS || hasMarketCap || hasBookValue;
    
    return (
      <View style={styles.tabContent}>
        {hasAnyValuationData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Valuation Metrics</Text>
            {hasPE && renderMetric('P/E Ratio', stock.peRatio.toFixed(2), stock.peRatio < 20 ? 'Good' : stock.peRatio < 30 ? 'Fair' : null)}
            {hasSectorPE && renderMetric('Sector P/E', stock.sectorPE.toFixed(2))}
            {hasEPS && renderMetric('EPS', `₹${stock.eps.toFixed(2)}`)}
            {hasMarketCap && renderMetric('Market Cap', `₹${stock.marketCapCr.toFixed(0)} Cr`)}
            {hasBookValue && renderMetric('Book Value', `₹${stock.bookValue.toFixed(2)}`)}
            {hasFaceValue && renderMetric('Face Value', `₹${stock.faceValue}`)}
            {stock.fundamentalSource && (
              <Text style={[styles.metricLabel, { fontSize: 10, color: '#999', marginTop: 10, textAlign: 'right' }]}>
                Source: {stock.fundamentalSource}
              </Text>
            )}
          </View>
        )}

        {has52WeekData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>52-Week Range</Text>
            {renderMetric('52W High', `₹${stock.week52High.toFixed(2)}`)}
            {renderMetric('52W Low', `₹${stock.week52Low.toFixed(2)}`)}
            {stock.currentPrice && renderMetric('Current', `₹${stock.currentPrice.toFixed(2)}`)}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Valuation Analysis</Text>
          {hasPE ? (
            <Text style={styles.analysisText}>
              • P/E Ratio: {stock.peRatio < 20 ? 'Undervalued - Trading below industry average' : stock.peRatio < 30 ? 'Fair valuation - In line with market' : 'Premium valuation - Trading above average'}
            </Text>
          ) : (
            <Text style={styles.analysisText}>
              • P/E Ratio data not available for detailed valuation analysis
            </Text>
          )}
          <Text style={styles.analysisText}>
            • Based on fundamental analysis, the stock shows {fundScore >= 70 ? 'strong' : fundScore >= 50 ? 'moderate' : 'weak'} value proposition.
          </Text>
          {hasAnyValuationData && (
            <Text style={[styles.analysisText, { fontSize: 12, color: '#666', marginTop: 10, fontStyle: 'italic' }]}>
              Note: Fundamental data sourced from {stock.fundamentalSource || 'NSE India'}. Some metrics may not be available for all stocks.
            </Text>
          )}
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
            <Text style={styles.price}>₹{stock.currentPrice?.toFixed(2)}</Text>
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
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {getTabLabel(tab)}
            </Text>
          </TouchableOpacity>
        ))}
        {FEATURES.showOptions && (
          <TouchableOpacity
            style={styles.optionsButton}
            onPress={() => navigation.navigate && navigation.navigate('Options', { stock })}
          >
            <Text style={styles.optionsButtonText}>Options</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'targets' && renderTargets()}
        {activeTab === 'levels' && renderLevels()}
        {activeTab === 'momentum' && renderMomentum()}
        {activeTab === 'entry-exit' && renderEntryExit()}
        {activeTab === 'patterns' && renderPatterns()}
        {activeTab === 'valuation' && renderValuation()}
        {activeTab === 'fundamental' && renderFundamental()}
        {activeTab === 'fundamentals' && renderFundamental()}
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
  targetCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  buyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  targetPriceSection: {
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  targetPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  upsideText: {
    fontSize: 14,
    fontWeight: '600',
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
  optionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 'auto',
    gap: 6,
  },
  optionsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Target tab styles
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  targetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  riskBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  targetPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
  },
  targetUpside: {
    fontSize: 18,
    color: '#4CAF50',
    marginBottom: 8,
  },
  targetTimeframe: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  targetDescription: {
    fontSize: 14,
    color: '#777',
    lineHeight: 20,
  },
  // Levels tab styles
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  levelLabel: {
    fontSize: 15,
    color: '#333',
  },
  levelValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  analysisText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
  },
  // Pattern tab styles
  patternCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  patternName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  patternConfidence: {
    fontSize: 13,
    color: '#666',
  },
  // Score display styles
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
  // PWA-style Big Action Button
  bigActionButton: {
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bigActionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  // PWA-style Target Price Card
  targetPriceCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  targetLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  targetPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  upsideText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
