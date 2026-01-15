import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';

export default function HomeScreen({ onSectorPress }) {
  const handleComingSoon = (featureName) => {
    Alert.alert('Coming Soon', `${featureName} will be available soon!`);
  };

  const analysisCategories = [
    {
      id: 'target-oriented',
      name: 'Target Oriented Stocks',
      description: 'Clear price targets with stop loss',
      badge: 'High probability trades',
      color: '#10b981',
      icon: '🎯',
    },
    {
      id: 'swing',
      name: 'Swing Stocks',
      description: 'High momentum trending stocks',
      badge: 'Riding the wave',
      color: '#f59e0b',
      icon: '📈',
    },
    {
      id: 'fundamentally-strong',
      name: 'Fundamentally Strong',
      description: 'Best P/E, ROE, debt ratios',
      badge: 'Quality picks',
      color: '#3b82f6',
      icon: '💎',
    },
    {
      id: 'technically-strong',
      name: 'Technically Strong',
      description: 'RSI, MACD, breakout patterns',
      badge: 'Chart winners',
      color: '#8b5cf6',
      icon: '📊',
    },
    {
      id: 'hot-stocks',
      name: 'Hot Stocks Today',
      description: 'Top gainers, losers, most active',
      badge: 'Live market movers',
      color: '#ef4444',
      icon: '🔥',
    },
    {
      id: 'graha-gochar',
      name: 'Graha Gochar Impact',
      description: 'Stocks influenced by planetary transits',
      badge: 'Vedic astrology insights',
      color: '#a855f7',
      icon: '🌙',
    },
    {
      id: 'sectors',
      name: 'Browse by Sectors',
      description: 'Explore all 10 NSE sectors',
      badge: '100 stocks categorized',
      color: '#06b6d4',
      icon: '🏢',
    },
    {
      id: 'options',
      name: 'Options Trading',
      description: 'Call & Put with entry/target/SL',
      badge: 'Top 20 trades - 9:00-9:20 AM',
      color: '#ec4899',
      icon: '🎯',
    },
    {
      id: 'commodities',
      name: 'Commodities',
      description: 'Live gold & silver prices',
      badge: 'Real-time data',
      color: '#eab308',
      icon: '📦',
    },
    {
      id: 'gold-silver',
      name: 'Gold & Silver',
      description: 'Precious metals with astro analysis',
      badge: 'Venus & Moon impact',
      color: '#f59e0b',
      icon: '🔱',
    },
    {
      id: 'etf',
      name: 'ETF Analysis',
      description: 'Exchange Traded Funds performance',
      badge: 'NIFTY, BANK, GOLD ETFs',
      color: '#06b6d4',
      icon: '📦',
    },
    {
      id: 'mutual-funds',
      name: 'Mutual Fund Stocks',
      description: 'AMC stocks & fund performance',
      badge: 'Top fund houses',
      color: '#14b8a6',
      icon: '💰',
    },
  ];

  const comingSoonFeatures = [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 NSE Stock Analyzer</Text>
        <Text style={styles.headerSubtitle}>AI-Powered Multi-Strategy Analysis</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.categoriesContainer}>
          {analysisCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => onSectorPress(category.id)}
              style={[styles.categoryCard, { borderLeftColor: category.color }]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>{category.icon}</Text>
                <Text style={styles.cardName}>{category.name}</Text>
              </View>
              <Text style={styles.cardDescription}>{category.description}</Text>
              <View style={[styles.cardBadge, { backgroundColor: category.color }]}>
                <Text style={styles.cardBadgeText}>{category.badge}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Coming Soon Features - now empty */}
          {comingSoonFeatures.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              onPress={() => handleComingSoon(feature.name)}
              style={[styles.categoryCard, styles.comingSoonCard, { borderLeftColor: feature.color }]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardIcon}>{feature.icon}</Text>
                <Text style={styles.cardName}>{feature.name}</Text>
              </View>
              <Text style={styles.cardDescription}>{feature.description}</Text>
              <View style={[styles.cardBadge, { backgroundColor: feature.color }]}>
                <Text style={styles.cardBadgeText}>{feature.badge}</Text>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
              </View>
            </TouchableOpacity>
          ))}
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
    padding: 30,
    paddingTop: 20,
    backgroundColor: '#5f4de0',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 26,
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
  categoriesContainer: {
    padding: 15,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderLeftWidth: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  comingSoonCard: {
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  cardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10,
    lineHeight: 20,
  },
  cardBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cardBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonBadgeText: {
    fontSize: 11,
    color: 'white',
    fontWeight: 'bold',
  },
  footerContainer: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerIcon: {
    fontSize: 24,
    marginRight: 12,
    color: '#ffffff',
  },
  footerTextContainer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 2,
  },
  footerBrand: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
