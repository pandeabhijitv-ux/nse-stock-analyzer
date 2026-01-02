// QUICK TEST VERSION - Copy this to Expo Snack
// https://snack.expo.dev/

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

// Mock stock data for quick testing
const MOCK_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 195.50, change: 2.5, score: 85 },
  { symbol: 'MSFT', name: 'Microsoft Corp', price: 378.90, change: 1.8, score: 82 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.30, change: -0.5, score: 80 },
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: 495.20, change: 5.2, score: 88 },
  { symbol: 'META', name: 'Meta Platforms', price: 352.80, change: 3.1, score: 78 },
];

export default function App() {
  const [selectedStock, setSelectedStock] = useState(null);

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFC107';
    return '#F44336';
  };

  if (selectedStock) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setSelectedStock(null)} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.detailSymbol}>{selectedStock.symbol}</Text>
          <Text style={styles.detailName}>{selectedStock.name}</Text>
          <Text style={styles.detailPrice}>${selectedStock.price}</Text>
        </View>

        <ScrollView style={styles.detailContent}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Overall Score</Text>
            <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(selectedStock.score) }]}>
              <Text style={styles.scoreText}>{selectedStock.score}/100</Text>
            </View>
            <Text style={styles.recommendation}>
              {selectedStock.score >= 80 ? '✅ Strong Buy' : selectedStock.score >= 60 ? '👍 Buy' : '⏸️ Hold'}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Key Metrics</Text>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>P/E Ratio</Text>
              <Text style={styles.metricValue}>18.5</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>ROE</Text>
              <Text style={styles.metricValue}>22.5%</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Debt/Equity</Text>
              <Text style={styles.metricValue}>0.45</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>RSI</Text>
              <Text style={styles.metricValue}>65</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Analysis</Text>
            <Text style={styles.analysisText}>
              ✓ Strong fundamentals{'\n'}
              ✓ Positive technical momentum{'\n'}
              ✓ Good valuation metrics{'\n'}
              ✓ Solid financial health
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stock Analyzer</Text>
        <Text style={styles.headerSubtitle}>Top Technology Stocks</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {MOCK_STOCKS.map((stock, index) => (
          <TouchableOpacity
            key={stock.symbol}
            style={styles.stockCard}
            onPress={() => setSelectedStock(stock)}
          >
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>#{index + 1}</Text>
            </View>

            <View style={styles.stockInfo}>
              <Text style={styles.stockSymbol}>{stock.symbol}</Text>
              <Text style={styles.stockName}>{stock.name}</Text>
            </View>

            <View style={styles.priceInfo}>
              <Text style={styles.stockPrice}>${stock.price}</Text>
              <Text style={[
                styles.stockChange,
                { color: stock.change >= 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {stock.change >= 0 ? '+' : ''}{stock.change}%
              </Text>
            </View>

            <View style={[styles.scoreBadgeSmall, { backgroundColor: getScoreColor(stock.score) }]}>
              <Text style={styles.scoreSmall}>{stock.score}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            📊 This is a demo version with mock data.{'\n\n'}
            The full app analyzes 100 real stocks with:{'\n'}
            • 30+ Fundamental Metrics{'\n'}
            • 10+ Technical Indicators{'\n'}
            • AI-Powered Scoring{'\n'}
            • Real-time Data from Yahoo Finance
          </Text>
        </View>
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
    backgroundColor: '#2196F3',
    padding: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  scrollView: {
    flex: 1,
  },
  stockCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    margin: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankBadge: {
    backgroundColor: '#2196F3',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 10,
  },
  rankText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stockInfo: {
    flex: 1,
  },
  stockSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  stockName: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  priceInfo: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  stockPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  stockChange: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  scoreBadgeSmall: {
    width: 35,
    height: 35,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreSmall: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailHeader: {
    backgroundColor: '#2196F3',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  backText: {
    color: 'white',
    fontSize: 16,
  },
  detailSymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  detailName: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 5,
  },
  detailPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  detailContent: {
    flex: 1,
    padding: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  scoreBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 10,
  },
  scoreText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  recommendation: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  analysisText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 15,
    padding: 20,
    margin: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 22,
  },
});
