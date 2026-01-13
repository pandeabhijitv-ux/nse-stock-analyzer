import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import HomeScreenSimple from './src/screens/HomeScreenSimple';
import StockListScreen from './src/screens/StockListScreen';
import StockDetailScreen from './src/screens/StockDetailScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedSector, setSelectedSector] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);

  const navigateToStockList = (sector) => {
    setSelectedSector(sector);
    setCurrentScreen('stockList');
  };

  const navigateToDetail = (stock, category) => {
    setSelectedStock({ stock, category });
    setCurrentScreen('detail');
  };

  const navigateBack = () => {
    if (currentScreen === 'detail') {
      setCurrentScreen('stockList');
      setSelectedStock(null);
    } else {
      setCurrentScreen('home');
      setSelectedSector(null);
    }
  };

  if (currentScreen === 'detail' && selectedStock) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <StockDetailScreen 
          route={{ params: selectedStock }} 
          navigation={{ goBack: navigateBack }}
        />
      </View>
    );
  }

  if (currentScreen === 'stockList' && selectedSector) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <StockListScreen 
          key={selectedSector} // Force remount when sector changes
          sector={selectedSector} 
          onStockPress={navigateToDetail}
        />
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
