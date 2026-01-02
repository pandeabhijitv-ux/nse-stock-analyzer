import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ScreenerScreen() {
  const [filters, setFilters] = useState({
    minPE: '',
    maxPE: '',
    minROE: '',
    minMarketCap: '',
    maxDebtToEquity: '',
    minDividendYield: '',
  });

  const handleFilter = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const applyFilters = () => {
    // In a real app, this would filter stocks based on criteria
    console.log('Applying filters:', filters);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stock Screener</Text>
        <Text style={styles.headerSubtitle}>Set criteria to find matching stocks</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Valuation</Text>
          
          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Min P/E Ratio</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 10"
                keyboardType="numeric"
                value={filters.minPE}
                onChangeText={(value) => handleFilter('minPE', value)}
              />
            </View>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Max P/E Ratio</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 25"
                keyboardType="numeric"
                value={filters.maxPE}
                onChangeText={(value) => handleFilter('maxPE', value)}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Profitability</Text>
          
          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Min ROE (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 15"
                keyboardType="numeric"
                value={filters.minROE}
                onChangeText={(value) => handleFilter('minROE', value)}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Size & Health</Text>
          
          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Min Market Cap (B)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 1"
                keyboardType="numeric"
                value={filters.minMarketCap}
                onChangeText={(value) => handleFilter('minMarketCap', value)}
              />
            </View>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Max Debt/Equity</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 1"
                keyboardType="numeric"
                value={filters.maxDebtToEquity}
                onChangeText={(value) => handleFilter('maxDebtToEquity', value)}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💵 Income</Text>
          
          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Min Dividend Yield (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2"
                keyboardType="numeric"
                value={filters.minDividendYield}
                onChangeText={(value) => handleFilter('minDividendYield', value)}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
          <Ionicons name="search" size={20} color="white" />
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#2196F3" />
          <Text style={styles.infoText}>
            This feature will allow you to screen stocks across all sectors based on your custom criteria. 
            Coming soon in the next update!
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
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
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
  section: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterItem: {
    flex: 1,
    marginHorizontal: 5,
  },
  filterLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f8f9fa',
  },
  applyButton: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    margin: 15,
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
});
