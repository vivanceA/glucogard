import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { Database, Download, TrendingUp, Users, MapPin, Shield, ChartBar as BarChart3, ChartPie as PieChart, Activity, Globe, Calendar, FileText, TriangleAlert as AlertTriangle } from 'lucide-react-native';

interface PublicHealthMetrics {
  total_assessments: number;
  risk_distribution: {
    low: number;
    moderate: number;
    critical: number;
  };
  demographic_breakdown: {
    age_groups: Record<string, number>;
    gender_distribution: Record<string, number>;
    urban_vs_rural: {
      urban: number;
      rural: number;
    };
  };
  trend_analysis: {
    monthly_assessments: Array<{
      month: string;
      count: number;
      average_risk_score: number;
    }>;
    risk_factors: {
      sedentary_lifestyle: number;
      poor_diet: number;
      family_history: number;
      symptoms_present: number;
    };
  };
}

export default function ResearchPortalScreen() {
  const [metrics, setMetrics] = useState<PublicHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/research-portal?action=metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const response = await fetch('/research-portal?action=export');
      if (response.ok) {
        const blob = await response.blob();
        
        if (Platform.OS === 'web') {
          // Web download
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'health-research-data.csv';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Loading research portal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/3938023/pexels-photo-3938023.jpeg?auto=compress&cs=tinysrgb&w=1200' }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay}>
          <View style={styles.heroContent}>
            <Database size={48} color="white" />
            <Text style={styles.heroTitle}>Healthcare Research Portal</Text>
            <Text style={styles.heroSubtitle}>
              Advancing diabetes prevention through data-driven insights
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Research Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Users size={32} color="#0066CC" />
              <Text style={styles.statNumber}>{metrics?.total_assessments || 0}</Text>
              <Text style={styles.statLabel}>Total Participants</Text>
              <Text style={styles.statDescription}>Anonymized health assessments</Text>
            </View>

            <View style={styles.statCard}>
              <Globe size={32} color="#28A745" />
              <Text style={styles.statNumber}>
                {metrics ? metrics.demographic_breakdown.urban_vs_rural.urban + metrics.demographic_breakdown.urban_vs_rural.rural : 0}
              </Text>
              <Text style={styles.statLabel}>Geographic Coverage</Text>
              <Text style={styles.statDescription}>Urban and rural regions</Text>
            </View>

            <View style={styles.statCard}>
              <TrendingUp size={32} color="#FF9800" />
              <Text style={styles.statNumber}>
                {metrics?.trend_analysis.monthly_assessments.length || 0}
              </Text>
              <Text style={styles.statLabel}>Months of Data</Text>
              <Text style={styles.statDescription}>Longitudinal tracking</Text>
            </View>
          </View>
        </View>

        {/* Risk Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Risk Distribution Analysis</Text>
          <View style={styles.chartCard}>
            <View style={styles.riskChart}>
              {metrics && (
                <>
                  <View style={styles.riskItem}>
                    <View style={[styles.riskBar, { 
                      width: `${(metrics.risk_distribution.low / metrics.total_assessments) * 100}%`,
                      backgroundColor: '#28A745'
                    }]} />
                    <View style={styles.riskInfo}>
                      <Text style={styles.riskLabel}>Low Risk</Text>
                      <Text style={styles.riskValue}>{metrics.risk_distribution.low}</Text>
                      <Text style={styles.riskPercentage}>
                        {Math.round((metrics.risk_distribution.low / metrics.total_assessments) * 100)}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.riskItem}>
                    <View style={[styles.riskBar, { 
                      width: `${(metrics.risk_distribution.moderate / metrics.total_assessments) * 100}%`,
                      backgroundColor: '#FFA500'
                    }]} />
                    <View style={styles.riskInfo}>
                      <Text style={styles.riskLabel}>Moderate Risk</Text>
                      <Text style={styles.riskValue}>{metrics.risk_distribution.moderate}</Text>
                      <Text style={styles.riskPercentage}>
                        {Math.round((metrics.risk_distribution.moderate / metrics.total_assessments) * 100)}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.riskItem}>
                    <View style={[styles.riskBar, { 
                      width: `${(metrics.risk_distribution.critical / metrics.total_assessments) * 100}%`,
                      backgroundColor: '#DC3545'
                    }]} />
                    <View style={styles.riskInfo}>
                      <Text style={styles.riskLabel}>Critical Risk</Text>
                      <Text style={styles.riskValue}>{metrics.risk_distribution.critical}</Text>
                      <Text style={styles.riskPercentage}>
                        {Math.round((metrics.risk_distribution.critical / metrics.total_assessments) * 100)}%
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Geographic Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗺️ Geographic Health Patterns</Text>
          <View style={styles.chartCard}>
            {metrics && (
              <View style={styles.geoChart}>
                <View style={styles.geoItem}>
                  <MapPin size={24} color="#0066CC" />
                  <View style={styles.geoContent}>
                    <Text style={styles.geoTitle}>Urban Areas</Text>
                    <Text style={styles.geoValue}>{metrics.demographic_breakdown.urban_vs_rural.urban}</Text>
                    <Text style={styles.geoDescription}>
                      Higher access to healthcare facilities and resources
                    </Text>
                  </View>
                </View>

                <View style={styles.geoItem}>
                  <MapPin size={24} color="#28A745" />
                  <View style={styles.geoContent}>
                    <Text style={styles.geoTitle}>Rural Areas</Text>
                    <Text style={styles.geoValue}>{metrics.demographic_breakdown.urban_vs_rural.rural}</Text>
                    <Text style={styles.geoDescription}>
                      Focus on mobile health solutions and community outreach
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Key Risk Factors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Primary Risk Factors</Text>
          <View style={styles.chartCard}>
            {metrics && (
              <View style={styles.riskFactors}>
                {Object.entries(metrics.trend_analysis.risk_factors)
                  .sort(([,a], [,b]) => b - a)
                  .map(([factor, count]) => (
                    <View key={factor} style={styles.factorItem}>
                      <Text style={styles.factorName}>
                        {factor.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Text>
                      <View style={styles.factorBar}>
                        <View 
                          style={[
                            styles.factorBarFill, 
                            { 
                              width: `${(count / Math.max(...Object.values(metrics.trend_analysis.risk_factors))) * 100}%`
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.factorCount}>{count}</Text>
                    </View>
                  ))}
              </View>
            )}
          </View>
        </View>

        {/* Research Applications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔬 Research Applications</Text>
          <View style={styles.applicationsGrid}>
            <View style={styles.applicationCard}>
              <BarChart3 size={32} color="#9B59B6" />
              <Text style={styles.applicationTitle}>Epidemiological Studies</Text>
              <Text style={styles.applicationDescription}>
                Population-level diabetes risk assessment and prevention strategies
              </Text>
            </View>

            <View style={styles.applicationCard}>
              <Activity size={32} color="#E74C3C" />
              <Text style={styles.applicationTitle}>Intervention Design</Text>
              <Text style={styles.applicationDescription}>
                Evidence-based health interventions tailored to local populations
              </Text>
            </View>

            <View style={styles.applicationCard}>
              <TrendingUp size={32} color="#3498DB" />
              <Text style={styles.applicationTitle}>Predictive Modeling</Text>
              <Text style={styles.applicationDescription}>
                Machine learning models for early diabetes risk detection
              </Text>
            </View>

            <View style={styles.applicationCard}>
              <Globe size={32} color="#27AE60" />
              <Text style={styles.applicationTitle}>Public Health Policy</Text>
              <Text style={styles.applicationDescription}>
                Data-driven policy recommendations for healthcare systems
              </Text>
            </View>
          </View>
        </View>

        {/* Data Export */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📁 Research Data Access</Text>
          <View style={styles.exportCard}>
            <View style={styles.exportHeader}>
              <Shield size={32} color="#28A745" />
              <View style={styles.exportInfo}>
                <Text style={styles.exportTitle}>Anonymized Dataset</Text>
                <Text style={styles.exportDescription}>
                  Access fully anonymized health data for research purposes. 
                  All data complies with international privacy standards and Rwanda's data protection laws.
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
                <Text style={styles.exportFeatureText}>Privacy Compliant</Text>
              </View>
              <View style={styles.exportFeature}>
                <Database size={16} color="#64748B" />
                <Text style={styles.exportFeatureText}>Structured Data</Text>
              </View>
              <View style={styles.exportFeature}>
                <Calendar size={16} color="#64748B" />
                <Text style={styles.exportFeatureText}>Time-series</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
              onPress={handleExportData}
              disabled={exporting}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Download size={20} color="white" />
              )}
              <Text style={styles.exportButtonText}>
                {exporting ? 'Preparing Export...' : 'Download Research Dataset'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ethics & Compliance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛡️ Ethics & Compliance</Text>
          <View style={styles.ethicsCard}>
            <View style={styles.ethicsItem}>
              <Shield size={20} color="#0066CC" />
              <Text style={styles.ethicsText}>
                <Text style={styles.ethicsLabel}>Data Protection: </Text>
                Compliant with Rwanda's Law No. 058/2021 on personal data protection
              </Text>
            </View>

            <View style={styles.ethicsItem}>
              <Users size={20} color="#0066CC" />
              <Text style={styles.ethicsText}>
                <Text style={styles.ethicsLabel}>Informed Consent: </Text>
                All participants have explicitly consented to research use
              </Text>
            </View>

            <View style={styles.ethicsItem}>
              <Database size={20} color="#0066CC" />
              <Text style={styles.ethicsText}>
                <Text style={styles.ethicsLabel}>Anonymization: </Text>
                Complete removal of personally identifiable information
              </Text>
            </View>

            <View style={styles.ethicsItem}>
              <Globe size={20} color="#0066CC" />
              <Text style={styles.ethicsText}>
                <Text style={styles.ethicsLabel}>Global Standards: </Text>
                Adherence to international research ethics guidelines
              </Text>
            </View>
          </View>
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
  heroSection: {
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 102, 204, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: '30%',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  statDescription: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  riskChart: {
    gap: 20,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskBar: {
    height: 8,
    borderRadius: 4,
    marginRight: 16,
    minWidth: 40,
  },
  riskInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  riskValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginRight: 12,
  },
  riskPercentage: {
    fontSize: 14,
    color: '#64748B',
    minWidth: 50,
    textAlign: 'right',
  },
  geoChart: {
    gap: 24,
  },
  geoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  geoContent: {
    flex: 1,
    marginLeft: 16,
  },
  geoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  geoValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 8,
  },
  geoDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  riskFactors: {
    gap: 16,
  },
  factorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  factorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    minWidth: 120,
  },
  factorBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  factorBarFill: {
    height: '100%',
    backgroundColor: '#0066CC',
    borderRadius: 4,
  },
  factorCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    minWidth: 40,
    textAlign: 'right',
  },
  applicationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  applicationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minWidth: '45%',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  applicationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  applicationDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  exportCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  exportHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  exportInfo: {
    flex: 1,
    marginLeft: 16,
  },
  exportTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  exportDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  exportFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  exportFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  exportButtonDisabled: {
    opacity: 0.7,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  ethicsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 16,
  },
  ethicsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  ethicsText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  ethicsLabel: {
    fontWeight: '600',
    color: '#1E293B',
  },
});