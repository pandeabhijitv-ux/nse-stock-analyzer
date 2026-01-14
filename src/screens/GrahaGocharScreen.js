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

export default function GrahaGocharScreen({ navigation, onBack }) {
  const grahaGochars = [
    {
      planet: 'Guru (Jupiter)',
      sign: 'Vrishabha (Taurus)',
      period: 'May 2025 - April 2026',
      color: ['#fbbf24', '#f59e0b'],
      icon: '♃',
      impact: 'POSITIVE',
      strength: 'Strong',
      sectors: [
        { name: 'Banking & Finance', impact: '⬆️ Very Bullish', reason: 'Jupiter rules wealth, strong in Taurus. Expansion in banking sector, mergers expected.' },
        { name: 'Luxury Goods & Jewelry', impact: '⬆️ Highly Positive', reason: 'Venus-ruled Taurus + Jupiter = luxury boom. Wedding season + gold demand rising.' },
        { name: 'Real Estate', impact: '⬆️ Bullish', reason: 'Property market expansion, good time for land/realty stocks.' },
        { name: 'Agriculture & FMCG', impact: '⬆️ Moderate Positive', reason: 'Taurus is earth sign, agriculture/food sectors benefit.' }
      ],
      description: 'Jupiter in Taurus brings growth in financial sectors, wealth accumulation, and luxury markets. This is a strong period for banks and high-value goods.'
    },
    {
      planet: 'Shani (Saturn)',
      sign: 'Kumbha (Aquarius)',
      period: 'Jan 2023 - March 2026',
      color: ['#6366f1', '#4f46e5'],
      icon: '♄',
      impact: 'TRANSFORMATIVE',
      strength: 'Very Strong (Own Sign)',
      sectors: [
        { name: 'Technology & IT', impact: '⬆️ Very Bullish', reason: 'Saturn in Aquarius favors innovation, AI, blockchain. Tech transformation accelerating.' },
        { name: 'Telecom', impact: '⬆️ Positive', reason: '5G expansion, digital infrastructure growth. Saturn in own sign strengthens.' },
        { name: 'Power & Utilities', impact: '⬆️ Steady Growth', reason: 'Saturn rules structure, Aquarius rules electricity. Renewable energy push.' },
        { name: 'Aviation', impact: '⚠️ Cautious', reason: 'Aquarius rules air travel, but Saturn brings delays/restrictions. Slow recovery.' }
      ],
      description: 'Saturn in its own sign Aquarius is powerful. This period brings technological advancement, but also tests traditional systems. Long-term gains in tech sector.'
    },
    {
      planet: 'Rahu (North Node)',
      sign: 'Meena (Pisces)',
      period: 'Oct 2023 - May 2025',
      color: ['#8b5cf6', '#7c3aed'],
      icon: '☊',
      impact: 'VOLATILE',
      strength: 'Unpredictable',
      sectors: [
        { name: 'Pharma & Healthcare', impact: '⬆️ Strong Growth', reason: 'Pisces rules healing, Rahu amplifies. Medical innovation, biotech boom expected.' },
        { name: 'Chemicals & Specialty Chem', impact: '⬆️ Bullish', reason: 'Pisces is water sign, Rahu brings sudden changes. Chemical sector expansion.' },
        { name: 'Oil & Gas', impact: '⬇️ Volatile', reason: 'Pisces is water element, oil is connected. Expect price swings and uncertainty.' },
        { name: 'Spirituality & Media', impact: '⬆️ Moderate', reason: 'Pisces rules spirituality, creativity. Media and entertainment sector active.' }
      ],
      description: 'Rahu in Pisces creates unconventional opportunities in pharma and healthcare. Expect sudden breakthroughs but also volatility. Good for research-based stocks.'
    },
    {
      planet: 'Mangal (Mars)',
      sign: 'Currently Transiting',
      period: 'Changes Every 45 Days',
      color: ['#ef4444', '#dc2626'],
      icon: '♂',
      impact: 'SHORT-TERM',
      strength: 'Fast-Moving',
      sectors: [
        { name: 'Defense & Aerospace', impact: '⬆️ Bullish (Always)', reason: 'Mars rules defense, weapons, military. Strong sector regardless of transit.' },
        { name: 'Metal & Steel', impact: '⬆️ Positive', reason: 'Mars rules metals, iron, steel production. Infrastructure push benefits.' },
        { name: 'Energy & Power', impact: '⬆️ Active', reason: 'Mars represents energy, fire. Power generation and distribution favored.' },
        { name: 'Sports & Fitness', impact: '⬆️ Growing', reason: 'Mars rules sports, physical activity. Fitness industry expanding.' }
      ],
      description: 'Mars gives short-term momentum to sectors it influences. Defense and metals are always strong with Mars energy.'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#9333ea', '#7c3aed']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🔮 Graha Gochar Impact</Text>
        <Text style={styles.headerSubtitle}>Vedic Astrology & Stock Market Analysis</Text>
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ℹ️ This analysis combines planetary transits with market trends for educational purposes.{'\n'}
            Not investment advice • Use alongside technical analysis
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView}>
        {/* Current Period Info */}
        <View style={styles.periodCard}>
          <Text style={styles.periodTitle}>📅 Current Period: January 2026</Text>
          <Text style={styles.periodText}>
            <Text style={styles.bold}>Active Transits:</Text> Jupiter in Taurus • Saturn in Aquarius • Rahu in Pisces{'\n'}
            <Text style={styles.bold}>Market Sentiment:</Text> Cautiously Optimistic • Tech & Banking sectors favored{'\n'}
            <Text style={styles.bold}>Best Trading Days:</Text> Thursday (Guru), Saturday (Shani) traditionally favorable
          </Text>
        </View>

        {/* Planetary Transits */}
        {grahaGochars.map((graha, index) => (
          <View key={index} style={styles.grahaCard}>
            <LinearGradient
              colors={graha.color}
              style={styles.grahaHeader}
            >
              <Text style={styles.planetIcon}>{graha.icon}</Text>
              <Text style={styles.planetName}>{graha.planet}</Text>
              <Text style={styles.planetTransit}>Transit: {graha.sign}</Text>
              <Text style={styles.planetPeriod}>Period: {graha.period}</Text>
              <View style={styles.impactBadge}>
                <Text style={styles.impactText}>{graha.impact} • Strength: {graha.strength}</Text>
              </View>
            </LinearGradient>

            <View style={styles.descriptionBox}>
              <Text style={styles.description}>{graha.description}</Text>
            </View>

            <View style={styles.sectorsContainer}>
              <Text style={styles.sectorsTitle}>🎯 Sector Impact Analysis:</Text>
              {graha.sectors.map((sector, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.sectorCard,
                    sector.impact.includes('⬆️') ? styles.bullishBorder :
                    sector.impact.includes('⬇️') ? styles.bearishBorder :
                    styles.cautionBorder
                  ]}
                >
                  <Text style={styles.sectorName}>{sector.name}</Text>
                  <Text style={styles.sectorImpact}>{sector.impact}</Text>
                  <Text style={styles.sectorReason}>{sector.reason}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>← Back to Home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    padding: 20,
    paddingTop: 10,
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
    color: 'white',
    opacity: 0.9,
    marginBottom: 10,
  },
  disclaimer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  disclaimerText: {
    fontSize: 12,
    color: 'white',
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
  },
  periodCard: {
    backgroundColor: '#fef3c7',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  periodText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
  },
  grahaCard: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  grahaHeader: {
    padding: 20,
  },
  planetIcon: {
    fontSize: 40,
    marginBottom: 10,
    color: 'white',
  },
  planetName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  planetTransit: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    opacity: 0.95,
  },
  planetPeriod: {
    fontSize: 12,
    color: 'white',
    opacity: 0.85,
    marginTop: 5,
  },
  impactBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  impactText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  descriptionBox: {
    padding: 15,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  description: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  sectorsContainer: {
    padding: 15,
  },
  sectorsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  sectorCard: {
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 2,
  },
  bullishBorder: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
  },
  bearishBorder: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  cautionBorder: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
  },
  sectorName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  sectorImpact: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  sectorReason: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  backButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
