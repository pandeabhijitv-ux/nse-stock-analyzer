import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import HomeScreenSimple from './src/screens/HomeScreenSimple';
import StockListScreen from './src/screens/StockListScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedSector, setSelectedSector] = useState(null);

  const navigateToStockList = (sector) => {
    setSelectedSector(sector);
    setCurrentScreen('stockList');
  };

  const navigateBack = () => {
    setCurrentScreen('home');
    setSelectedSector(null);
  };

  if (currentScreen === 'stockList' && selectedSector) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <StockListScreen sector={selectedSector} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HomeScreenSimple onSectorPress={navigateToStockList} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  backButton: {
    padding: 15,
    backgroundColor: '#2196F3',
    marginTop: 40,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
