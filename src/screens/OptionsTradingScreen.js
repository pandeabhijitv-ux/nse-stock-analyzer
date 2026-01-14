import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function OptionsTradingScreen({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [isTimeValid, setIsTimeValid] = useState(false);
  const [timeMessage, setTimeMessage] = useState('');
  const [optionsData, setOptionsData] = useState({ calls: [], puts: [] });

  useEffect(() => {
    checkTimeAndFetchData();
    // Check time every minute
    const interval = setInterval(checkTimeAndFetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkTimeAndFetchData = async () => {
    const now = new Date();
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    const hours = istTime.getUTCHours();
    const minutes = istTime.getUTCMinutes();
    const currentMinutes = hours * 60 + minutes;
    
    // 9:00 AM IST = 540 minutes, 9:20 AM IST = 560 minutes
    const startTime = 9 * 60; // 540
    const endTime = 9 * 60 + 20; // 560
    
    if (currentMinutes >= startTime && currentMinutes <= endTime) {
      setIsTimeValid(true);
      setTimeMessage('');
      await fetchOptionsData();
    } else {
      setIsTimeValid(false);
      setLoading(false);
      
      if (currentMinutes < startTime) {
        const minutesUntil = startTime - currentMinutes;
        const hoursUntil = Math.floor(minutesUntil / 60);
        const minsUntil = minutesUntil % 60;
        setTimeMessage(`Options recommendations will be available at 9:00 AM IST (in ${hoursUntil}h ${minsUntil}m)`);
      } else {
        setTimeMessage('Options recommendations were available from 9:00 AM to 9:20 AM IST today. Check back tomorrow!');
      }
    }
  };

  const fetchOptionsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://stock-analyzer-backend-nu.vercel.app/api/options');
      const result = await response.json();
      
      if (result.success) {
        setOptionsData(result.data);
      } else {
        console.error('Failed to fetch options data');
      }
    } catch (err) {
      console.error('Error fetching options:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderOptionCard = (option, type) => {
    const isCall = type === 'call';
    const colors = isCall ? ['#10b981', '#059669'] : ['#ef4444', '#dc2626'];
    
    return (
      <View style={styles.optionCard} key={`${option.symbol}-${option.strike}`}>
        <LinearGradient
          colors={colors}
          style={styles.optionHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.optionHeaderContent}>
            <Text style={styles.optionType}>{isCall ? '📈 CALL' : '📉 PUT'}</Text>
            <Text style={styles.optionSymbol}>{option.symbol}</Text>
          </View>
        </LinearGradient>
        
        <View style={styles.optionBody}>
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Strike Price</Text>
            <Text style={styles.optionValue}>₹{option.strike}</Text>
          </View>
          
          {option.expiry && (
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Expiry</Text>
              <Text style={styles.optionValueSmall}>{option.expiry}</Text>
            </View>
          )}
          
          <View style={styles.divider} />
          
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Entry</Text>
            <Text style={styles.optionValueBold}>₹{option.entry}</Text>
          </View>
          
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Target</Text>
            <Text style={[styles.optionValueBold, { color: '#10b981' }]}>
              ₹{option.target}
            </Text>
          </View>
          
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Stop Loss</Text>
            <Text style={[styles.optionValueBold, { color: '#ef4444' }]}>
              ₹{option.stopLoss}
            </Text>
          </View>
          
          {option.potential && (
            <View style={styles.potentialBadge}>
              <Text style={styles.potentialText}>
                Potential: {option.potential}%
              </Text>
            </View>
          )}
          
          {option.confidence && (
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                Confidence: {option.confidence}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>📊 Options Trading</Text>
        <Text style={styles.headerSubtitle}>Daily Recommendations (9:00-9:20 AM IST)</Text>
      </LinearGradient>

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>Loading options data...</Text>
        </View>
      ) : !isTimeValid ? (
        <View style={styles.messageContainer}>
          <Text style={styles.messageIcon}>⏰</Text>
          <Text style={styles.messageTitle}>Not Available Right Now</Text>
          <Text style={styles.messageText}>{timeMessage}</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>📌 How It Works</Text>
            <Text style={styles.infoText}>
              • Options recommendations are available daily from 9:00 AM to 9:20 AM IST{'\n'}
              • This 20-minute window provides pre-market insights{'\n'}
              • Both Call and Put options are analyzed{'\n'}
              • Entry, Target, and Stop Loss levels are provided{'\n'}
              • Check back tomorrow during the active window!
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.alertCard}>
            <Text style={styles.alertIcon}>⚡</Text>
            <Text style={styles.alertText}>
              Live options recommendations - Available until 9:20 AM IST
            </Text>
          </View>

          {optionsData.calls.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📈 Top Call Options</Text>
              {optionsData.calls.map(option => renderOptionCard(option, 'call'))}
            </View>
          )}

          {optionsData.puts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📉 Top Put Options</Text>
              {optionsData.puts.map(option => renderOptionCard(option, 'put'))}
            </View>
          )}

          {optionsData.calls.length === 0 && optionsData.puts.length === 0 && (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>
                No options recommendations available at this moment
              </Text>
            </View>
          )}

          <View style={styles.disclaimerCard}>
            <Text style={styles.disclaimerText}>
              ⚠️ Disclaimer: Options trading involves high risk. These recommendations are for 
              educational purposes only. Always do your own research and consult with a financial 
              advisor before making investment decisions.
            </Text>
          </View>
        </ScrollView>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  messageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  infoCard: {
    backgroundColor: '#e0e7ff',
    padding: 20,
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
    width: '100%',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4c1d95',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#5b21b6',
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  alertCard: {
    flexDirection: 'row',
    margin: 15,
    padding: 15,
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 15,
    marginBottom: 10,
    marginTop: 10,
  },
  optionCard: {
    margin: 15,
    marginTop: 10,
    borderRadius: 15,
    backgroundColor: 'white',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  optionHeader: {
    padding: 15,
  },
  optionHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  optionSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  optionBody: {
    padding: 15,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionLabel: {
    fontSize: 14,
    color: '#666',
  },
  optionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  optionValueSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  optionValueBold: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  potentialBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  potentialText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#166534',
  },
  confidenceBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  confidenceText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  disclaimerCard: {
    margin: 15,
    padding: 15,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  disclaimerText: {
    fontSize: 13,
    color: '#991b1b',
    lineHeight: 18,
  },
});
