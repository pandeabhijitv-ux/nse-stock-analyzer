import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SECTORS } from '../services/stockAPI';

export default function SectorsScreen({ onSectorPress, onBack }) {
  const sectorColors = {
    'Technology': ['#667eea', '#764ba2'],
    'Banking': ['#4facfe', '#00f2fe'],
    'Financial Services': ['#43e97b', '#38f9d7'],
    'FMCG': ['#fa709a', '#fee140'],
    'Automobile': ['#30cfd0', '#330867'],
    'Pharma': ['#a8edea', '#fed6e3'],
    'Energy': ['#ff9a9e', '#fecfef'],
    'Metals & Mining': ['#ffecd2', '#fcb69f'],
    'Infrastructure': ['#ff6e7f', '#bfe9ff'],
    'Consumer Durables': ['#f093fb', '#f5576c'],
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e3c72', '#2a5298']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>📑 Browse by Sectors</Text>
        <Text style={styles.headerSubtitle}>100 curated stocks across 10 sectors</Text>
      </LinearGradient>

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back to Home</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView}>
        <View style={styles.sectorsGrid}>
          {Object.keys(SECTORS).map((sectorName) => (
            <TouchableOpacity
              key={sectorName}
              style={styles.sectorCard}
              onPress={() => onSectorPress(sectorName)}
            >
              <LinearGradient
                colors={sectorColors[sectorName] || ['#667eea', '#764ba2']}
                style={styles.sectorGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.sectorName}>{sectorName}</Text>
                <Text style={styles.sectorDescription}>View top performing stocks</Text>
                <View style={styles.stockCountBadge}>
                  <Text style={styles.stockCountText}>{SECTORS[sectorName].length} stocks</Text>
                </View>
              </LinearGradient>
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
  scrollView: {
    flex: 1,
  },
  sectorsGrid: {
    padding: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sectorCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sectorGradient: {
    padding: 20,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  sectorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  sectorDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 10,
  },
  stockCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  stockCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
