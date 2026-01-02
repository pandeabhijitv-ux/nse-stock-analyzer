import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SECTORS } from '../services/stockAPI';

export default function HomeScreen({ navigation }) {
  const sectorIcons = {
    'Technology': 'hardware-chip',
    'Healthcare': 'medkit',
    'Financial': 'cash',
    'Consumer': 'cart',
    'Energy': 'flash',
    'Industrial': 'construct',
    'Materials': 'cube',
    'Utilities': 'water',
    'Real Estate': 'home',
    'Communication': 'chatbubbles',
  };

  const sectorColors = {
    'Technology': ['#667eea', '#764ba2'],
    'Healthcare': ['#f093fb', '#f5576c'],
    'Financial': ['#4facfe', '#00f2fe'],
    'Consumer': ['#43e97b', '#38f9d7'],
    'Energy': ['#fa709a', '#fee140'],
    'Industrial': ['#30cfd0', '#330867'],
    'Materials': ['#a8edea', '#fed6e3'],
    'Utilities': ['#ff9a9e', '#fecfef'],
    'Real Estate': ['#ffecd2', '#fcb69f'],
    'Communication': ['#ff6e7f', '#bfe9ff'],
  };

  const handleSectorPress = (sector) => {
    navigation.navigate('StockList', { sector });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1e3c72', '#2a5298']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Stock Analyzer</Text>
        <Text style={styles.headerSubtitle}>Select a sector to analyze top stocks</Text>
      </LinearGradient>

      <ScrollView style={styles.scrollView}>
        <View style={styles.sectorsContainer}>
          {Object.keys(SECTORS).map((sector) => (
            <TouchableOpacity
              key={sector}
              onPress={() => handleSectorPress(sector)}
              style={styles.sectorCardWrapper}
            >
              <LinearGradient
                colors={sectorColors[sector]}
                style={styles.sectorCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons
                  name={sectorIcons[sector]}
                  size={32}
                  color="white"
                  style={styles.sectorIcon}
                />
                <Text style={styles.sectorName}>{sector}</Text>
                <Text style={styles.sectorCount}>
                  {SECTORS[sector].length} stocks
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📊 Analysis Includes:</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>✓ Fundamental Analysis (P/E, ROE, Debt Ratios)</Text>
            <Text style={styles.infoItem}>✓ Technical Indicators (RSI, MACD, Bollinger Bands)</Text>
            <Text style={styles.infoItem}>✓ Growth Metrics & Profitability</Text>
            <Text style={styles.infoItem}>✓ Financial Health Assessment</Text>
            <Text style={styles.infoItem}>✓ AI-Powered Stock Scoring</Text>
          </View>
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  scrollView: {
    flex: 1,
  },
  sectorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    justifyContent: 'space-between',
  },
  sectorCardWrapper: {
    width: '48%',
    marginBottom: 15,
  },
  sectorCard: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sectorIcon: {
    marginBottom: 10,
  },
  sectorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  sectorCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  infoCard: {
    margin: 15,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoList: {
    marginLeft: 10,
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});
