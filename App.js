import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

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
}
