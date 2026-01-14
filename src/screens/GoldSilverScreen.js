import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function GoldSilverScreen({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [liveData, setLiveData] = useState(null);

  useEffect(() => {
    fetchLivePrices();
  }, []);

  const fetchLivePrices = async () => {
    try {
      const response = await fetch('https://stock-analyzer-backend-nu.vercel.app/api/commodities');
      const result = await response.json();
      
      if (result.success) {
        setLiveData(result.data);
      }
    } catch (error) {
      console.error('Error fetching commodity prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const goldData = {
    metal: 'Gold',
    symbol: '🥇',
    color: ['#f59e0b', '#d97706'],
    price: liveData?.gold?.price || 'Loading...',
    unit: '₹/10g (24K)',
    change: liveData?.gold?.change || 'N/A',
    trend: liveData?.gold?.trend || 'NEUTRAL',
    planet: 'Shukra (Venus)',
    planetIcon: '♀',
    planetDescription: 'Venus rules gold, luxury, and wealth. Currently strong in favorable position.',
    currentTransit: 'Venus in supportive position - Favorable for gold investments',
    sectors: ['Jewelry', 'Luxury Goods', 'Banking (Gold Loans)', 'Mining Companies'],
    guidance: 'Good time for long-term gold accumulation. Consider SGB (Sovereign Gold Bonds) for tax benefits.'
  };

  const silverData = {
    metal: 'Silver',
    symbol: '🥈',
    color: ['#94a3b8', '#64748b'],
    price: liveData?.silver?.price || 'Loading...',
    unit: '₹/kg',
    change: liveData?.silver?.change || 'N/A',
    trend: liveData?.silver?.trend || 'NEUTRAL',
    planet: 'Chandra (Moon)',
    planetIcon: '☽',
    planetDescription: 'Moon rules silver, emotions, and liquidity. Waxing moon phase favorable for silver.',
    currentTransit: 'Moon in favorable nakshatra - Good for silver trading',
    sectors: ['Electronics', 'Solar Panels', 'Medical Equipment', 'Silverware & Utensils'],
    guidance: 'Industrial demand strong. Silver has dual value - precious metal + industrial commodity.'
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#f59e0b', '#d97706']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>💰 Gold & Silver</Text>
        <Text style={styles.headerSubtitle}>Precious Metals with Astrological Analysis</Text>
      </LinearGradient>

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingText}>Fetching live prices...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {/* Gold Section */}
          <View style={styles.metalCard}>
            <LinearGradient
              colors={goldData.color}
              style={styles.metalHeader}
            >
              <Text style={styles.metalSymbol}>{goldData.symbol}</Text>
              <Text style={styles.metalName}>{goldData.metal}</Text>
              <Text style={styles.metalPrice}>₹{goldData.price}</Text>
              <Text style={styles.metalUnit}>{goldData.unit}</Text>
              <Text style={[styles.metalChange, { color: goldData.change.startsWith('+') ? '#10b981' : '#ef4444' }]}>
                {goldData.change} {goldData.trend}
              </Text>
            </LinearGradient>

            <View style={styles.metalContent}>
              <Text style={styles.sectionTitle}>🪐 Astrological Influence</Text>
              <View style={styles.planetCard}>
                <Text style={styles.planetIcon}>{goldData.planetIcon}</Text>
                <View style={styles.planetInfo}>
                  <Text style={styles.planetName}>{goldData.planet}</Text>
                  <Text style={styles.planetDescription}>{goldData.planetDescription}</Text>
                  <Text style={styles.transitText}>{goldData.currentTransit}</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>📈 Affected Sectors</Text>
              <View style={styles.sectorsContainer}>
                {goldData.sectors.map((sector, index) => (
                  <View key={index} style={styles.sectorChip}>
                    <Text style={styles.sectorChipText}>{sector}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.sectionTitle}>💡 Investment Guidance</Text>
              <Text style={styles.guidanceText}>{goldData.guidance}</Text>
            </View>
          </View>

          {/* Silver Section */}
          <View style={styles.metalCard}>
            <LinearGradient
              colors={silverData.color}
              style={styles.metalHeader}
            >
              <Text style={styles.metalSymbol}>{silverData.symbol}</Text>
              <Text style={styles.metalName}>{silverData.metal}</Text>
              <Text style={styles.metalPrice}>₹{silverData.price}</Text>
              <Text style={styles.metalUnit}>{silverData.unit}</Text>
              <Text style={[styles.metalChange, { color: silverData.change.startsWith('+') ? '#10b981' : '#ef4444' }]}>
                {silverData.change} {silverData.trend}
              </Text>
            </LinearGradient>

            <View style={styles.metalContent}>
              <Text style={styles.sectionTitle}>🪐 Astrological Influence</Text>
              <View style={styles.planetCard}>
                <Text style={styles.planetIcon}>{silverData.planetIcon}</Text>
                <View style={styles.planetInfo}>
                  <Text style={styles.planetName}>{silverData.planet}</Text>
                  <Text style={styles.planetDescription}>{silverData.planetDescription}</Text>
                  <Text style={styles.transitText}>{silverData.currentTransit}</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>📈 Affected Sectors</Text>
              <View style={styles.sectorsContainer}>
                {silverData.sectors.map((sector, index) => (
                  <View key={index} style={styles.sectorChip}>
                    <Text style={styles.sectorChipText}>{sector}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.sectionTitle}>💡 Investment Guidance</Text>
              <Text style={styles.guidanceText}>{silverData.guidance}</Text>
            </View>
          </View>

          <View style={styles.disclaimerCard}>
            <Text style={styles.disclaimerText}>
              ℹ️ Prices are indicative and may vary by location and purity. Astrological analysis is for educational purposes only. Always consult certified advisors for investment decisions.
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
  },
  headerTitle: {
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
  scrollView: {
    flex: 1,
  },
  metalCard: {
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
  metalHeader: {
    padding: 25,
    alignItems: 'center',
  },
  metalSymbol: {
    fontSize: 60,
    marginBottom: 10,
  },
  metalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  metalPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  metalUnit: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 5,
  },
  metalChange: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 5,
  },
  metalContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 10,
  },
  planetCard: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  planetIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  planetInfo: {
    flex: 1,
  },
  planetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  planetDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  transitText: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
  },
  sectorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  sectorChip: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  sectorChipText: {
    color: '#0369a1',
    fontSize: 13,
    fontWeight: '600',
  },
  guidanceText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  disclaimerCard: {
    margin: 15,
    padding: 15,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  disclaimerText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
  },
});
