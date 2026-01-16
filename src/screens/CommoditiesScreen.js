import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function CommoditiesScreen({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commoditiesData, setCommoditiesData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCommodities();
  }, []);

  const fetchCommodities = async () => {
    try {
      setError(null);
      const response = await fetch('https://stock-analyzer-backend-nu.vercel.app/api/commodities');
      const result = await response.json();
      
      if (result.success) {
        setCommoditiesData(result.data);
      } else {
        setError('Failed to fetch commodity prices');
      }
    } catch (err) {
      console.error('Error fetching commodities:', err);
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCommodities();
  };

  const renderCommodityCard = (commodity, name, icon, color) => {
    if (!commodity) return null;

    return (
      <View style={styles.commodityCard}>
        <LinearGradient
          colors={color}
          style={styles.commodityHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.commodityIcon}>{icon}</Text>
          <Text style={styles.commodityName}>{name}</Text>
        </LinearGradient>
        
        <View style={styles.commodityBody}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Current Price</Text>
            <Text style={styles.priceValue}>₹{commodity.price}</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Unit</Text>
            <Text style={styles.unitValue}>{commodity.unit}</Text>
          </View>
          
          {commodity.change && (
            <View style={styles.changeRow}>
              <Text style={styles.changeLabel}>Change</Text>
              <Text style={[
                styles.changeValue,
                { color: commodity.change.startsWith('+') ? '#10b981' : '#ef4444' }
              ]}>
                {commodity.change}
              </Text>
            </View>
          )}
          
          {commodity.trend && (
            <View style={styles.trendRow}>
              <View style={[
                styles.trendBadge,
                { backgroundColor: commodity.trend === 'BULLISH' ? '#dcfce7' : commodity.trend === 'BEARISH' ? '#fee2e2' : '#fef3c7' }
              ]}>
                <Text style={[
                  styles.trendText,
                  { color: commodity.trend === 'BULLISH' ? '#166534' : commodity.trend === 'BEARISH' ? '#991b1b' : '#92400e' }
                ]}>
                  {commodity.trend}
                </Text>
              </View>
            </View>
          )}
          
          {commodity.lastUpdated && (
            <Text style={styles.lastUpdated}>
              Updated: {new Date(commodity.lastUpdated).toLocaleString()}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#eab308', '#ca8a04']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>📦 Commodities</Text>
        <Text style={styles.headerSubtitle}>Live Commodity Futures (Yahoo Finance)</Text>
      </LinearGradient>
      <View style={styles.disclaimerBanner}>
        <Text style={styles.disclaimerText}>ℹ️ International futures prices (COMEX/LME via Yahoo Finance). MCX may differ due to local premiums & taxes.</Text>
      </View>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#eab308" />
          <Text style={styles.loadingText}>Fetching live prices...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCommodities}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#eab308']} />
          }
        >
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              Pull down to refresh prices. MCX commodity prices updated in real-time.
            </Text>
          </View>

          {/* Precious Metals Section */}
          <Text style={styles.sectionHeader}>💎 Precious Metals</Text>
          {renderCommodityCard(
            commoditiesData?.gold,
            'Gold',
            '🥇',
            ['#f59e0b', '#d97706']
          )}

          {renderCommodityCard(
            commoditiesData?.silver,
            'Silver',
            '🥈',
            ['#94a3b8', '#64748b']
          )}

          {/* Energy Commodities Section */}
          <Text style={styles.sectionHeader}>⚡ Energy Commodities</Text>

          {renderCommodityCard(
            commoditiesData?.brentCrude,
            'Brent Crude Oil',
            '🛢️',
            ['#1e293b', '#334155']
          )}

          {renderCommodityCard(
            commoditiesData?.crudeOil,
            'WTI Crude Oil',
            '🛢️',
            ['#0f172a', '#475569']
          )}

          {renderCommodityCard(
            commoditiesData?.naturalGas,
            'Natural Gas',
            '🔥',
            ['#1e40af', '#3b82f6']
          )}

          {/* Base Metals Section */}
          <Text style={styles.sectionHeader}>🔩 Base Metals</Text>
          {renderCommodityCard(
            commoditiesData?.aluminium,
            'Aluminium',
            '⚪',
            ['#94a3b8', '#64748b']
          )}

          {renderCommodityCard(
            commoditiesData?.copper,
            'Copper',
            '🔶',
            ['#d97706', '#f59e0b']
          )}

          {renderCommodityCard(
            commoditiesData?.lead,
            'Lead',
            '⚫',
            ['#334155', '#475569']
          )}

          {renderCommodityCard(
            commoditiesData?.nickel,
            'Nickel',
            '⚪',
            ['#71717a', '#a1a1aa']
          )}

          {renderCommodityCard(
            commoditiesData?.zinc,
            'Zinc',
            '🔘',
            ['#52525b', '#71717a']
          )}

          {!commoditiesData && (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No commodity data available</Text>
            </View>
          )}

          <View style={styles.disclaimerCard}>
            <Text style={styles.disclaimerText}>
              💡 Prices shown are indicative and may vary based on location, purity, and market conditions. 
              For actual trading, please consult authorized dealers and exchanges.
            </Text>
          </View>
        </ScrollView>
      )}
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
  },  disclaimerBanner: {
    backgroundColor: '#fff3cd',
    padding: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  disclaimerText: {
    fontSize: 13,
    color: '#856404',
    textAlign: 'center',
  },  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  backButton: {
    padding: 15,
    backgroundColor: '#2196F3',
    marginTop: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#eab308',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  infoCard: {
    flexDirection: 'row',
    margin: 15,
    padding: 15,
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  commodityCard: {
    margin: 15,
    borderRadius: 15,
    backgroundColor: 'white',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  commodityHeader: {
    padding: 20,
    alignItems: 'center',
  },
  commodityIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  commodityName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  commodityBody: {
    padding: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  unitValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  changeLabel: {
    fontSize: 16,
    color: '#666',
  },
  changeValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  trendRow: {
    marginBottom: 12,
  },
  trendBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  trendText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
  },
  disclaimerCard: {
    margin: 15,
    padding: 15,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#eab308',
  },
  disclaimerText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
  },
});
