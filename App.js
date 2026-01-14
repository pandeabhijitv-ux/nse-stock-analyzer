import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import HomeScreenSimple from './src/screens/HomeScreenSimple';
import StockListScreen from './src/screens/StockListScreen';
import StockDetailScreen from './src/screens/StockDetailScreen';
import GrahaGocharScreen from './src/screens/GrahaGocharScreen';
import SectorsScreen from './src/screens/SectorsScreen';
import GoldSilverScreen from './src/screens/GoldSilverScreen';
import CommoditiesScreen from './src/screens/CommoditiesScreen';
import OptionsTradingScreen from './src/screens/OptionsTradingScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedSector, setSelectedSector] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);

  const navigateToStockList = (sector) => {
    // Special screens get their own dedicated components
    if (sector === 'graha-gochar') {
      setCurrentScreen('grahaGochar');
    } else if (sector === 'sectors') {
      setCurrentScreen('sectors');
    } else if (sector === 'gold-silver') {
      setCurrentScreen('goldSilver');
    } else if (sector === 'commodities') {
      setCurrentScreen('commodities');
    } else if (sector === 'options') {
      setCurrentScreen('optionsTrading');
    } else {
      setSelectedSector(sector);
      setCurrentScreen('stockList');
    }
  };

  const navigateToDetail = (stock, category) => {
    setSelectedStock({ stock, category });
    setCurrentScreen('detail');
  };

  const navigateBack = () => {
    if (currentScreen === 'detail') {
      setCurrentScreen('stockList');
      setSelectedStock(null);
    } else if (currentScreen === 'grahaGochar' || currentScreen === 'sectors' || 
               currentScreen === 'goldSilver' || currentScreen === 'commodities' || 
               currentScreen === 'optionsTrading') {
      setCurrentScreen('home');
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

  if (currentScreen === 'grahaGochar') {
    return (
      <View style={styles.container}>
        <GrahaGocharScreen onBack={navigateBack} />
      </View>
    );
  }

  if (currentScreen === 'sectors') {
    return (
      <View style={styles.container}>
        <SectorsScreen onBack={navigateBack} onSectorPress={navigateToStockList} />
      </View>
    );
  }

  if (currentScreen === 'goldSilver') {
    return (
      <View style={styles.container}>
        <GoldSilverScreen onBack={navigateBack} />
      </View>
    );
  }

  if (currentScreen === 'commodities') {
    return (
      <View style={styles.container}>
        <CommoditiesScreen onBack={navigateBack} />
      </View>
    );
  }

  if (currentScreen === 'optionsTrading') {
    return (
      <View style={styles.container}>
        <OptionsTradingScreen onBack={navigateBack} />
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
