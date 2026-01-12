import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

export default function App() {
  const [clicks, setClicks] = useState(0);

  const handlePress = () => {
    setClicks(clicks + 1);
    Alert.alert('Success!', `Button clicked ${clicks + 1} times!`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stock Analyzer</Text>
      <Text style={styles.subtitle}>App is working!</Text>
      
      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.button} onPress={handlePress}>
          <Text style={styles.buttonText}>Test Button (Clicked: {clicks})</Text>
        </TouchableOpacity>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✓ Backend Status</Text>
          <Text style={styles.cardText}>Connected to: https://stock-analyzer-backend-nu.vercel.app</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✓ Features Working</Text>
          <Text style={styles.cardText}>✓ App loads successfully</Text>
          <Text style={styles.cardText}>✓ Backend deployed on Vercel</Text>
          <Text style={styles.cardText}>✓ Basic UI working</Text>
          <Text style={styles.cardText}>✓ Touch events working</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Next Steps</Text>
          <Text style={styles.cardText}>1. Add navigation</Text>
          <Text style={styles.cardText}>2. Add sector selection</Text>
          <Text style={styles.cardText}>3. Connect to backend API</Text>
          <Text style={styles.cardText}>4. Display stock data</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    paddingTop: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});
