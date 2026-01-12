import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { SECTORS } from '../services/stockAPI';

export default function HomeScreen({ onSectorPress }) {
  const sectorColors = {
    'Technology': '#667eea',
    'Banking': '#4facfe',
    'Financial Services': '#43e97b',
    'FMCG': '#fa709a',
    'Automobile': '#f093fb',
    'Pharma': '#30cfd0',
    'Energy': '#fee140',
    'Metals & Mining': '#a8edea',
    'Infrastructure': '#ffecd2',
    'Consumer Durables': '#ff6e7f',
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stock Analyzer</Text>
        <Text style={styles.headerSubtitle}>Select a sector to analyze stocks</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.sectorsContainer}>
          {Object.keys(SECTORS).map((sector) => (
            <TouchableOpacity
              key={sector}
              onPress={() => onSectorPress(sector)}
              style={[styles.sectorCard, { backgroundColor: sectorColors[sector] || '#2196F3' }]}
            >
              <Text style={styles.sectorName}>{sector}</Text>
              <Text style={styles.sectorCount}>{SECTORS[sector].length} stocks</Text>
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
    backgroundColor: '#1e3c72',
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
  sectorCard: {
    width: '48%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
});
