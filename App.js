import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import StockListScreen from './src/screens/StockListScreen';
import StockDetailScreen from './src/screens/StockDetailScreen';
import OptionsScreen from './src/screens/OptionsScreen';
import WatchlistScreen from './src/screens/WatchlistScreen';
import ScreenerScreen from './src/screens/ScreenerScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="StockList" 
        component={StockListScreen}
        options={{ title: 'Top Stocks' }}
      />
      <Stack.Screen 
        name="StockDetail" 
        component={StockDetailScreen}
        options={{ title: 'Stock Analysis' }}
      />
      <Stack.Screen 
        name="Options" 
        component={OptionsScreen}
        options={{ title: 'Options Analysis' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simple initialization - just mark as ready
    // This prevents crash if fonts aren't loaded yet
    const timer = setTimeout(() => {
      try {
        console.log('App initializing...');
        setIsReady(true);
        console.log('App ready!');
      } catch (err) {
        console.error('App initialization error:', err);
        setError(err.message);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={{ marginTop: 10, fontSize: 14, color: '#999' }}>
          Please restart the app
        </Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading Stock Analyzer...</Text>
      </View>
    );
  }

  try {
    return (
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Analyze') {
                iconName = focused ? 'analytics' : 'analytics-outline';
              } else if (route.name === 'Screener') {
                iconName = focused ? 'search' : 'search-outline';
              } else if (route.name === 'Watchlist') {
                iconName = focused ? 'star' : 'star-outline';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#2196F3',
            tabBarInactiveTintColor: 'gray',
          })}
        >
          <Tab.Screen 
            name="Analyze" 
            component={HomeStack}
            options={{ headerShown: false }}
          />
          <Tab.Screen name="Screener" component={ScreenerScreen} />
          <Tab.Screen name="Watchlist" component={WatchlistScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    );
  } catch (err) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Navigation Error: {err.message}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    padding: 20,
    textAlign: 'center',
  },
});
