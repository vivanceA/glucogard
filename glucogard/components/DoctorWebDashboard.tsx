import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Users, TriangleAlert as AlertTriangle, TrendingUp, Calendar, MapPin, Activity, Heart, Stethoscope, FileText, Download, Filter, Search, Eye, Clock, CircleCheck as CheckCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { generatePublicHealthMetrics, type PublicHealthMetrics } from '@/lib/research';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface PatientSummary {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastAssessment: string;
  riskCategory: 'low' | 'moderate' | 'critical';
  riskScore: number;
  status: 'pending' | 'reviewed';
}

interface DashboardStats {
  totalPatients: number;
  pendingReviews: number;
  criticalCases: number;
  monthlyAssessments: number;
  averageRiskScore: number;
}

export function DoctorWebDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    pendingReviews: 0,
    criticalCases: 0,
    monthlyAssessments: 0,
    averageRiskScore: 0,
  });
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [metrics, setMetrics] = useState<PublicHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'critical'>('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPatientStats(),
        loadPatientList(),
        loadPublicHealthMetrics(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientStats = async () => {
    try {
      const { data: submissions } = await supabase
        .from('health_submissions')
        .select(`
          id,
          status,
          submitted_at,
          patients!inner (
            id,
            profiles!inner (
              full_name
            )
          ),
          risk_predictions (
            risk_score,
            risk_category
          )
        `)
        .order('submitted_at', { ascending: false });

      if (submissions) {
        const uniquePatients = new Set(submissions.map(s => s.patients.id));
        const pendingReviews = submissions.filter(s => s.status === 'pending').length;
        const criticalCases = submissions.filter(
          s => s.risk_predictions?.[0]?.risk_category === 'critical'
        ).length;
        
        const thisMonth = new Date();
        thisMonth.setDate(1);
        const monthlyAssessments = submissions.filter(
          s => new Date(s.submitted_at) >= thisMonth
        ).length;

        const totalRiskScore = submissions.reduce(
          (sum, s) => sum + (s.risk_predictions?.[0]?.risk_score || 0),
          0
        );
        const averageRiskScore = submissions.length > 0 
          ? Math.round(totalRiskScore / submissions.length) 
          : 0;

        setStats({
          totalPatients: uniquePatients.size,
          pendingReviews,
          criticalCases,
          monthlyAssessments,
          averageRiskScore,
        });
      }
    } catch (error) {
      console.error('Error loading patient stats:', error);
    }
  };

  const loadPatientList = async () => {
    try {
      const { data: submissions } = await supabase
        .from('health_submissions')
        .select(`
          id,
          status,
          submitted_at,
          patients!inner (
            id,
            age,
            gender,
            profiles!inner (
              full_name
            )
          ),
          risk_predictions (
            risk_score,
            risk_category
          )
        `)
        .order('submitted_at', { ascending: false })
        .limit(20);

      if (submissions) {
        const patientSummaries: PatientSummary[] = submissions.map(submission => ({
          id: submission.id,
          name: submission.patients.profiles.full_name,
          age: submission.patients.age || 0,
          gender: submission.patients.gender || 'Unknown',
          lastAssessment: submission.submitted_at,
          riskCategory: submission.risk_predictions?.[0]?.risk_category || 'low',
          riskScore: submission.risk_predictions?.[0]?.risk_score || 0,
          status: submission.status,
        }));

        setPatients(patientSummaries);
      }
    } catch (error) {
      console.error('Error loading patient list:', error);
    }
  };

  const loadPublicHealthMetrics = async () => {
    try {
      const data = await generatePublicHealthMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Error loading public health metrics:', error);
    }
  };

  const getFilteredPatients = () => {
    switch (selectedFilter) {
      case 'pending':
        return patients.filter(p => p.status === 'pending');
      case 'critical':
        return patients.filter(p => p.riskCategory === 'critical');
      default:
        return patients;
    }
  };

  const getRiskColor = (category: string) => {
    switch (category) {
      case 'low':
        return '#28A745';
      case 'moderate':
        return '#FFA500';
      case 'critical':
        return '#DC3545';
      default:
        return '#64748B';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Stethoscope size={32} color="#0066CC" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Doctor Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              Comprehensive patient management and analytics
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={loadDashboardData}>
          <Activity size={20} color="#0066CC" />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Users size={24} color="#0066CC" />
            <Text style={styles.statNumber}>{stats.totalPatients}</Text>
            <Text style={styles.statLabel}>Total Patients</Text>
          </View>

          <View style={styles.statCard}>
            <Clock size={24} color="#FFA500" />
            <Text style={styles.statNumber}>{stats.pendingReviews}</Text>
            <Text style={styles.statLabel}>Pending Reviews</Text>
          </View>

          <View style={styles.statCard}>
            <AlertTriangle size={24} color="#DC3545" />
            <Text style={styles.statNumber}>{stats.criticalCases}</Text>
            <Text style={styles.statLabel}>Critical Cases</Text>
          </View>

          <View style={styles.statCard}>
            <Calendar size={24} color="#28A745" />
            <Text style={styles.statNumber}>{stats.monthlyAssessments}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>

          <View style={styles.statCard}>
            <TrendingUp size={24} color="#9B59B6" />
            <Text style={styles.statNumber}>{stats.averageRiskScore}</Text>
            <Text style={styles.statLabel}>Avg Risk Score</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <Eye size={24} color="#0066CC" />
            <Text style={styles.actionTitle}>Review Pending</Text>
            <Text style={styles.actionSubtitle}>{stats.pendingReviews} assessments</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <AlertTriangle size={24} color="#DC3545" />
            <Text style={styles.actionTitle}>Critical Cases</Text>
            <Text style={styles.actionSubtitle}>{stats.criticalCases} patients</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Download size={24} color="#28A745" />
            <Text style={styles.actionTitle}>Export Data</Text>
            <Text style={styles.actionSubtitle}>Research export</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <FileText size={24} color="#9B59B6" />
            <Text style={styles.actionTitle}>Generate Report</Text>
            <Text style={styles.actionSubtitle}>Monthly summary</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Patient List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>👥 Recent Patients</Text>
          <View style={styles.filterButtons}>
            {(['all', 'pending', 'critical'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  selectedFilter === filter && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedFilter === filter && styles.filterButtonTextActive,
                  ]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.patientList}>
          {getFilteredPatients().map((patient) => (
            <TouchableOpacity key={patient.id} style={styles.patientCard}>
              <View style={styles.patientHeader}>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  <Text style={styles.patientDetails}>
                    {patient.age} years • {patient.gender}
                  </Text>
                </View>
                <View style={styles.patientStatus}>
                  <View
                    style={[
                      styles.riskBadge,
                      { backgroundColor: `${getRiskColor(patient.riskCategory)}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.riskBadgeText,
                        { color: getRiskColor(patient.riskCategory) },
                      ]}
                    >
                      {patient.riskCategory.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.riskScore}>Score: {patient.riskScore}</Text>
                </View>
              </View>

              <View style={styles.patientFooter}>
                <Text style={styles.lastAssessment}>
                  Last assessment: {new Date(patient.lastAssessment).toLocaleDateString()}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    patient.status === 'reviewed'
                      ? styles.statusReviewed
                      : styles.statusPending,
                  ]}
                >
                  {patient.status === 'reviewed' ? (
                    <CheckCircle size={12} color="#065F46" />
                  ) : (
                    <Clock size={12} color="#92400E" />
                  )}
                  <Text
                    style={[
                      styles.statusText,
                      patient.status === 'reviewed'
                        ? styles.statusTextReviewed
                        : styles.statusTextPending,
                    ]}
                  >
                    {patient.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Public Health Insights */}
      {metrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌍 Public Health Insights</Text>
          <View style={styles.insightsGrid}>
            <View style={styles.insightCard}>
              <MapPin size={20} color="#0066CC" />
              <Text style={styles.insightTitle}>Geographic Distribution</Text>
              <Text style={styles.insightValue}>
                {metrics.demographic_breakdown.urban_vs_rural.urban} Urban • {' '}
                {metrics.demographic_breakdown.urban_vs_rural.rural} Rural
              </Text>
            </View>

            <View style={styles.insightCard}>
              <TrendingUp size={20} color="#28A745" />
              <Text style={styles.insightTitle}>Monthly Growth</Text>
              <Text style={styles.insightValue}>
                {metrics.trend_analysis.monthly_assessments.slice(-1)[0]?.count || 0} assessments
              </Text>
            </View>

            <View style={styles.insightCard}>
              <Heart size={20} color="#DC3545" />
              <Text style={styles.insightTitle}>Risk Distribution</Text>
              <Text style={styles.insightValue}>
                {Math.round((metrics.risk_distribution.critical / metrics.total_assessments) * 100)}% critical risk
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
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
  header: {
    backgroundColor: 'white',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EBF4FF',
    gap: 8,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0066CC',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    minWidth: width > 768 ? '18%' : '45%',
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
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    minWidth: width > 768 ? '22%' : '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
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
  patientList: {
    gap: 12,
  },
  patientCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 14,
    color: '#64748B',
  },
  patientStatus: {
    alignItems: 'flex-end',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  riskBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  riskScore: {
    fontSize: 12,
    color: '#64748B',
  },
  patientFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastAssessment: {
    fontSize: 12,
    color: '#64748B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusReviewed: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  statusTextReviewed: {
    color: '#065F46',
  },
  statusTextPending: {
    color: '#92400E',
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    minWidth: width > 768 ? '30%' : '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 12,
    color: '#64748B',
  },
});