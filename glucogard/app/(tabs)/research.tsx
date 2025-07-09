import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { Database, Download, TrendingUp, Users, MapPin, Calendar, Filter, RefreshCw, FileText, Shield, TriangleAlert as AlertTriangle, ChartBar as BarChart3, ChartPie as PieChart, Activity, Globe } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { 
  generatePublicHealthMetrics,
  exportDataForResearchers,
  type PublicHealthMetrics 
} from '@/lib/research';

const { width } = Dimensions.get('window');

export default function ResearchScreen() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PublicHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'3m' | '6m' | '12m'>('6m');
  const [selectedRegion, setSelectedRegion] = useState<'all' | 'urban' | 'rural'>('all');

  useEffect(() => {
    loadMetrics();
  }, [selectedTimeframe, selectedRegion]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await generatePublicHealthMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Error loading research metrics:', error);
      Alert.alert('Error', 'Failed to load research data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    if (!metrics) return;

    Alert.alert(
      'Export Research Data',
      'This will export anonymized health data for research purposes. All data is fully anonymized and complies with privacy regulations.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            const csvData = exportDataForResearchers(metrics);
            // In a real app, this would trigger a download
            Alert.alert('Success', 'Research data exported successfully');
          },
        },
      ]
    );
  };

  const getRiskDistributionData = () => {
    if (!metrics) return { low: 0, moderate: 0, critical: 0 };
    return metrics.risk_distribution;
  };

  const getDemographicData = () => {
    if (!metrics) return { urban: 0, rural: 0 };
    return metrics.demographic_breakdown.urban_vs_rural;
  };

  const getTopRiskFactors = () => {
    if (!metrics) return [];
    const factors = metrics.trend_analysis.risk_factors;
    return [
      { name: 'Sedentary Lifestyle', count: factors.sedentary_lifestyle, color: '#FF6B6B' },
      { name: 'Poor Diet', count: factors.poor_diet, color: '#4ECDC4' },
      { name: 'Family History', count: factors.family_history, color: '#45B7D1' },
      { name: 'Symptoms Present', count: factors.symptoms_present, color: '#96CEB4' },
    ].sort((a, b) => b.count - a.count);
  };

  if (user?.role !== 'doctor') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDenied}>
          <Shield size={64} color="#DC3545" />
          <Text style={styles.accessDeniedTitle}>Access Restricted</Text>
          <Text style={styles.accessDeniedText}>
            This research platform is only available to healthcare providers.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Loading research data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const riskData = getRiskDistributionData();
  const demographicData = getDemographicData();
  const topRiskFactors = getTopRiskFactors();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Database size={24} color="#0066CC" />
          <Text style={styles.title}>Research Platform</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadMetrics}
          >
            <RefreshCw size={20} color="#0066CC" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.subtitle}>
          Anonymized health data for diabetes prevention research
        </Text>
      </View>

      {/* Filter Controls */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Timeframe:</Text>
            {(['3m', '6m', '12m'] as const).map((timeframe) => (
              <TouchableOpacity
                key={timeframe}
                style={[
                  styles.filterButton,
                  selectedTimeframe === timeframe && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedTimeframe(timeframe)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedTimeframe === timeframe && styles.filterButtonTextActive,
                  ]}
                >
                  {timeframe === '3m' ? '3 Months' : timeframe === '6m' ? '6 Months' : '12 Months'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Region:</Text>
            {(['all', 'urban', 'rural'] as const).map((region) => (
              <TouchableOpacity
                key={region}
                style={[
                  styles.filterButton,
                  selectedRegion === region && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedRegion(region)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedRegion === region && styles.filterButtonTextActive,
                  ]}
                >
                  {region.charAt(0).toUpperCase() + region.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Users size={24} color="#0066CC" />
              <Text style={styles.statNumber}>{metrics?.total_assessments || 0}</Text>
              <Text style={styles.statLabel}>Total Assessments</Text>
            </View>

            <View style={styles.statCard}>
              <AlertTriangle size={24} color="#DC3545" />
              <Text style={styles.statNumber}>{riskData.critical}</Text>
              <Text style={styles.statLabel}>Critical Risk</Text>
            </View>

            <View style={styles.statCard}>
              <Globe size={24} color="#28A745" />
              <Text style={styles.statNumber}>{demographicData.urban + demographicData.rural}</Text>
              <Text style={styles.statLabel}>Regions Covered</Text>
            </View>

            <View style={styles.statCard}>
              <TrendingUp size={24} color="#FF9800" />
              <Text style={styles.statNumber}>
                {metrics?.trend_analysis.monthly_assessments.length || 0}
              </Text>
              <Text style={styles.statLabel}>Months Tracked</Text>
            </View>
          </View>
        </View>

        {/* Risk Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Risk Distribution</Text>
          <View style={styles.chartCard}>
            <View style={styles.riskDistribution}>
              <View style={styles.riskItem}>
                <View style={[styles.riskIndicator, { backgroundColor: '#28A745' }]} />
                <View style={styles.riskInfo}>
                  <Text style={styles.riskLabel}>Low Risk</Text>
                  <Text style={styles.riskValue}>{riskData.low}</Text>
                  <Text style={styles.riskPercentage}>
                    {metrics ? Math.round((riskData.low / metrics.total_assessments) * 100) : 0}%
                  </Text>
                </View>
              </View>

              <View style={styles.riskItem}>
                <View style={[styles.riskIndicator, { backgroundColor: '#FFA500' }]} />
                <View style={styles.riskInfo}>
                  <Text style={styles.riskLabel}>Moderate Risk</Text>
                  <Text style={styles.riskValue}>{riskData.moderate}</Text>
                  <Text style={styles.riskPercentage}>
                    {metrics ? Math.round((riskData.moderate / metrics.total_assessments) * 100) : 0}%
                  </Text>
                </View>
              </View>

              <View style={styles.riskItem}>
                <View style={[styles.riskIndicator, { backgroundColor: '#DC3545' }]} />
                <View style={styles.riskInfo}>
                  <Text style={styles.riskLabel}>Critical Risk</Text>
                  <Text style={styles.riskValue}>{riskData.critical}</Text>
                  <Text style={styles.riskPercentage}>
                    {metrics ? Math.round((riskData.critical / metrics.total_assessments) * 100) : 0}%
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Geographic Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗺️ Geographic Distribution</Text>
          <View style={styles.chartCard}>
            <View style={styles.geographicChart}>
              <View style={styles.geoItem}>
                <MapPin size={20} color="#0066CC" />
                <View style={styles.geoInfo}>
                  <Text style={styles.geoLabel}>Urban Areas</Text>
                  <Text style={styles.geoValue}>{demographicData.urban}</Text>
                  <View style={styles.geoBar}>
                    <View 
                      style={[
                        styles.geoBarFill, 
                        { 
                          width: `${(demographicData.urban / (demographicData.urban + demographicData.rural)) * 100}%`,
                          backgroundColor: '#0066CC'
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>

              <View style={styles.geoItem}>
                <MapPin size={20} color="#28A745" />
                <View style={styles.geoInfo}>
                  <Text style={styles.geoLabel}>Rural Areas</Text>
                  <Text style={styles.geoValue}>{demographicData.rural}</Text>
                  <View style={styles.geoBar}>
                    <View 
                      style={[
                        styles.geoBarFill, 
                        { 
                          width: `${(demographicData.rural / (demographicData.urban + demographicData.rural)) * 100}%`,
                          backgroundColor: '#28A745'
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Top Risk Factors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Top Risk Factors</Text>
          <View style={styles.chartCard}>
            {topRiskFactors.map((factor, index) => (
              <View key={factor.name} style={styles.riskFactorItem}>
                <View style={styles.riskFactorHeader}>
                  <Text style={styles.riskFactorName}>{factor.name}</Text>
                  <Text style={styles.riskFactorCount}>{factor.count}</Text>
                </View>
                <View style={styles.riskFactorBar}>
                  <View 
                    style={[
                      styles.riskFactorBarFill, 
                      { 
                        width: `${(factor.count / topRiskFactors[0].count) * 100}%`,
                        backgroundColor: factor.color
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Monthly Trends */}
        {metrics?.trend_analysis.monthly_assessments && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📈 Monthly Trends</Text>
            <View style={styles.chartCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.trendChart}>
                  {metrics.trend_analysis.monthly_assessments.slice(-6).map((month, index) => (
                    <View key={month.month} style={styles.trendItem}>
                      <View 
                        style={[
                          styles.trendBar, 
                          { 
                            height: Math.max(20, (month.count / Math.max(...metrics.trend_analysis.monthly_assessments.map(m => m.count))) * 100),
                            backgroundColor: '#0066CC'
                          }
                        ]} 
                      />
                      <Text style={styles.trendLabel}>{month.month.split('-')[1]}</Text>
                      <Text style={styles.trendValue}>{month.count}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        )}

        {/* Data Export */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📁 Data Export</Text>
          <View style={styles.exportCard}>
            <View style={styles.exportHeader}>
              <Shield size={24} color="#28A745" />
              <View style={styles.exportInfo}>
                <Text style={styles.exportTitle}>Anonymized Research Data</Text>
                <Text style={styles.exportDescription}>
                  Export fully anonymized health data for research purposes. 
                  All personal identifiers have been removed to ensure privacy compliance.
                </Text>
              </View>
            </View>

            <View style={styles.exportFeatures}>
              <View style={styles.exportFeature}>
                <FileText size={16} color="#64748B" />
                <Text style={styles.exportFeatureText}>CSV Format</Text>
              </View>
              <View style={styles.exportFeature}>
                <Shield size={16} color="#64748B" />
                <Text style={styles.exportFeatureText}>GDPR Compliant</Text>
              </View>
              <View style={styles.exportFeature}>
                <Database size={16} color="#64748B" />
                <Text style={styles.exportFeatureText}>Aggregated Data</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExportData}
            >
              <Download size={20} color="white" />
              <Text style={styles.exportButtonText}>Export Research Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Shield size={20} color="#0066CC" />
          <Text style={styles.privacyText}>
            All data is anonymized and complies with Rwanda's Law No. 058/2021 on data protection. 
            No personally identifiable information is included in research exports.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  refreshButton: {
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 16,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginRight: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginRight: 12,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#0066CC',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  riskDistribution: {
    gap: 16,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  riskInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  riskValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginRight: 12,
  },
  riskPercentage: {
    fontSize: 12,
    color: '#64748B',
    minWidth: 40,
    textAlign: 'right',
  },
  geographicChart: {
    gap: 20,
  },
  geoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  geoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  geoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  geoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  geoBar: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  geoBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  riskFactorItem: {
    marginBottom: 16,
  },
  riskFactorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskFactorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  riskFactorCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  riskFactorBar: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  riskFactorBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  trendChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    paddingVertical: 20,
  },
  trendItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  trendBar: {
    width: 24,
    marginBottom: 8,
    borderRadius: 2,
  },
  trendLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  trendValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  exportCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  exportHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  exportInfo: {
    flex: 1,
    marginLeft: 12,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  exportDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  exportFeatures: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  exportFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exportFeatureText: {
    fontSize: 12,
    color: '#64748B',
  },
  exportButton: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  privacyNotice: {
    flexDirection: 'row',
    backgroundColor: '#EBF4FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    gap: 12,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: '#1E293B',
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
});