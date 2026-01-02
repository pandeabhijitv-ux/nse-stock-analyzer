import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { analyzeOptions, getIndiaVIX } from '../services/optionsAnalysis';

const OptionsScreen = ({ route }) => {
  const { stock, technicalData } = route.params;
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [selectedTab, setSelectedTab] = useState('recommendation');

  useEffect(() => {
    loadOptionsAnalysis();
  }, []);

  const loadOptionsAnalysis = async () => {
    try {
      const vix = await getIndiaVIX();
      const optionsData = analyzeOptions(stock, technicalData, vix);
      setAnalysis(optionsData);
    } catch (error) {
      console.error('Error analyzing options:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Analyzing Options...</Text>
      </View>
    );
  }

  const getRecommendationColor = () => {
    if (analysis.recommendation === 'BULLISH') return '#22c55e';
    if (analysis.recommendation === 'BEARISH') return '#ef4444';
    return '#f59e0b';
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.title}>{stock.symbol} Options</Text>
        <Text style={styles.subtitle}>Options Trading Analysis</Text>
      </LinearGradient>

      {/* Recommendation Card */}
      <View style={[styles.card, { backgroundColor: getRecommendationColor() }]}>
        <Text style={styles.recommendationTitle}>{analysis.recommendation}</Text>
        <Text style={styles.recommendationSubtitle}>
          Buy {analysis.strategy.optionType} Options
        </Text>
        <Text style={styles.confidenceText}>
          Confidence: {analysis.confidence}%
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'recommendation' && styles.activeTab]}
          onPress={() => setSelectedTab('recommendation')}
        >
          <Text style={[styles.tabText, selectedTab === 'recommendation' && styles.activeTabText]}>
            Recommendation
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'strikes' && styles.activeTab]}
          onPress={() => setSelectedTab('strikes')}
        >
          <Text style={[styles.tabText, selectedTab === 'strikes' && styles.activeTabText]}>
            Strike Prices
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'greeks' && styles.activeTab]}
          onPress={() => setSelectedTab('greeks')}
        >
          <Text style={[styles.tabText, selectedTab === 'greeks' && styles.activeTabText]}>
            Greeks
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content based on selected tab */}
      {selectedTab === 'recommendation' && (
        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Strategy</Text>
            <Text style={styles.strategyName}>{analysis.strategy.strategy}</Text>
            <Text style={styles.strategyDescription}>{analysis.strategy.description}</Text>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Suitability:</Text>
              <Text style={styles.metricValue}>{analysis.strategy.suitability}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Risk Level:</Text>
              <Text style={styles.metricValue}>{analysis.strategy.riskLevel}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Volatility Analysis</Text>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>India VIX:</Text>
              <Text style={styles.metricValue}>{analysis.volatility.current.toFixed(2)}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Level:</Text>
              <Text style={styles.metricValue}>{analysis.volatility.level}</Text>
            </View>
            <Text style={styles.impactText}>{analysis.volatility.impact}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Expiration</Text>
            <View style={styles.expiryOption}>
              <Text style={styles.expiryLabel}>Near Term</Text>
              <Text style={styles.expiryDate}>{analysis.expiration.nearTerm.date}</Text>
              <Text style={styles.expiryDays}>{analysis.expiration.nearTerm.days} days</Text>
            </View>
            <View style={styles.expiryOption}>
              <Text style={styles.expiryLabel}>Monthly</Text>
              <Text style={styles.expiryDate}>{analysis.expiration.monthly.date}</Text>
              <Text style={styles.expiryDays}>{analysis.expiration.monthly.days} days</Text>
            </View>
            <Text style={styles.recommendedLabel}>
              ✓ Recommended: {analysis.expiration.recommended}
            </Text>
            <Text style={styles.explanationText}>{analysis.expiration.explanation}</Text>
          </View>
        </View>
      )}

      {selectedTab === 'strikes' && (
        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Strike Prices</Text>
            <View style={styles.strikeOption}>
              <View style={styles.strikeHeader}>
                <Text style={styles.strikeLabel}>ITM (In-The-Money)</Text>
                <Text style={styles.strikePrice}>₹{analysis.strikePrice.itm}</Text>
              </View>
              <View style={styles.premiumRow}>
                <Text style={styles.premiumLabel}>Call Premium:</Text>
                <Text style={styles.premiumValue}>₹{analysis.premium.call.itm}</Text>
              </View>
              <View style={styles.premiumRow}>
                <Text style={styles.premiumLabel}>Put Premium:</Text>
                <Text style={styles.premiumValue}>₹{analysis.premium.put.itm}</Text>
              </View>
            </View>

            <View style={[styles.strikeOption, analysis.strikePrice.recommended === analysis.strikePrice.atm && styles.recommendedStrike]}>
              <View style={styles.strikeHeader}>
                <Text style={styles.strikeLabel}>ATM (At-The-Money)</Text>
                <Text style={styles.strikePrice}>₹{analysis.strikePrice.atm}</Text>
              </View>
              <View style={styles.premiumRow}>
                <Text style={styles.premiumLabel}>Call Premium:</Text>
                <Text style={styles.premiumValue}>₹{analysis.premium.call.atm}</Text>
              </View>
              <View style={styles.premiumRow}>
                <Text style={styles.premiumLabel}>Put Premium:</Text>
                <Text style={styles.premiumValue}>₹{analysis.premium.put.atm}</Text>
              </View>
            </View>

            <View style={[styles.strikeOption, analysis.strikePrice.recommended === analysis.strikePrice.otm && styles.recommendedStrike]}>
              <View style={styles.strikeHeader}>
                <Text style={styles.strikeLabel}>OTM (Out-Of-The-Money)</Text>
                <Text style={styles.strikePrice}>₹{analysis.strikePrice.otm}</Text>
              </View>
              <View style={styles.premiumRow}>
                <Text style={styles.premiumLabel}>Call Premium:</Text>
                <Text style={styles.premiumValue}>₹{analysis.premium.call.otm}</Text>
              </View>
              <View style={styles.premiumRow}>
                <Text style={styles.premiumLabel}>Put Premium:</Text>
                <Text style={styles.premiumValue}>₹{analysis.premium.put.otm}</Text>
              </View>
            </View>

            <Text style={styles.explanationText}>{analysis.strikePrice.explanation}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Risk-Reward Analysis</Text>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Max Risk:</Text>
              <Text style={styles.metricValue}>{analysis.riskReward.maxRisk}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Max Reward:</Text>
              <Text style={styles.metricValue}>{analysis.riskReward.maxReward}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Expected Move:</Text>
              <Text style={styles.metricValue}>±₹{analysis.riskReward.expectedMove}</Text>
            </View>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Risk-Reward:</Text>
              <Text style={styles.metricValue}>{analysis.riskReward.riskRewardRatio}</Text>
            </View>
          </View>
        </View>
      )}

      {selectedTab === 'greeks' && (
        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Option Greeks</Text>
            <Text style={styles.greeksSubtitle}>
              For Strike: ₹{analysis.strikePrice.recommended}
            </Text>
            
            <View style={styles.greekItem}>
              <Text style={styles.greekName}>Delta (Δ)</Text>
              <Text style={styles.greekValue}>{analysis.greeks.delta}</Text>
              <Text style={styles.greekExplanation}>{analysis.greeks.explanation.delta}</Text>
            </View>

            <View style={styles.greekItem}>
              <Text style={styles.greekName}>Gamma (Γ)</Text>
              <Text style={styles.greekValue}>{analysis.greeks.gamma}</Text>
              <Text style={styles.greekExplanation}>Rate of change of Delta</Text>
            </View>

            <View style={styles.greekItem}>
              <Text style={styles.greekName}>Theta (Θ)</Text>
              <Text style={styles.greekValue}>{analysis.greeks.theta}</Text>
              <Text style={styles.greekExplanation}>{analysis.greeks.explanation.theta}</Text>
            </View>

            <View style={styles.greekItem}>
              <Text style={styles.greekName}>Vega (ν)</Text>
              <Text style={styles.greekValue}>{analysis.greeks.vega}</Text>
              <Text style={styles.greekExplanation}>{analysis.greeks.explanation.vega}</Text>
            </View>
          </View>

          <View style={styles.disclaimerCard}>
            <Text style={styles.disclaimerTitle}>⚠️ Important Note</Text>
            <Text style={styles.disclaimerText}>
              Options trading involves significant risk and is not suitable for all investors. 
              This analysis is for educational purposes only and should not be considered as financial advice.
              Always consult with a qualified financial advisor before trading options.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  card: {
    margin: 15,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  recommendationTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  recommendationSubtitle: {
    fontSize: 18,
    color: 'white',
    marginTop: 5,
  },
  confidenceText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 15,
    borderRadius: 10,
    padding: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#667eea',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    padding: 15,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  strategyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 8,
  },
  strategyDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
  impactText: {
    fontSize: 13,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  expiryOption: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  expiryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  expiryDate: {
    fontSize: 16,
    color: '#667eea',
    marginTop: 4,
  },
  expiryDays: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  recommendedLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#22c55e',
    marginTop: 10,
  },
  explanationText: {
    fontSize: 13,
    color: '#666',
    marginTop: 10,
    lineHeight: 18,
  },
  strikeOption: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
  },
  recommendedStrike: {
    borderWidth: 2,
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  strikeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  strikeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  strikePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  premiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  premiumLabel: {
    fontSize: 13,
    color: '#666',
  },
  premiumValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  greeksSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  greekItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  greekName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  greekValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
    marginVertical: 5,
  },
  greekExplanation: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  disclaimerCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 20,
  },
});

export default OptionsScreen;
