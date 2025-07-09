import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Users, TriangleAlert as AlertTriangle, Clock, CircleCheck as CheckCircle, TrendingUp, Eye, MessageSquare, Calendar, Activity, Target, Stethoscope, FileText } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { DoctorWebDashboard } from './DoctorWebDashboard';

interface SubmissionWithPatient {
  id: string;
  status: 'pending' | 'reviewed';
  submitted_at: string;
  patients: {
    id: string;
    age: number | null;
    gender: string | null;
    profiles: {
      full_name: string;
    };
  };
  risk_predictions?: {
    risk_score: number;
    risk_category: 'low' | 'moderate' | 'critical';
  }[];
  recommendations?: {
    id: string;
    content: string;
    type: 'lifestyle' | 'clinical';
    created_at: string;
  }[];
}

export function DoctorDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<SubmissionWithPatient[]>([]);
  const [loading, setLoading] = useState(true);

  // Use web dashboard for web platform
  if (Platform.OS === 'web') {
    return <DoctorWebDashboard />;
  }

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data } = await supabase
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
          ),
          recommendations (
            id,
            content,
            type,
            created_at
          )
        `)
        .order('submitted_at', { ascending: false });

      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const reviewedSubmissions = submissions.filter(s => s.status === 'reviewed');
  const criticalCases = submissions.filter(
    s => s.risk_predictions?.[0]?.risk_category === 'critical'
  );
  const totalRecommendations = submissions.reduce(
    (acc, s) => acc + (s.recommendations?.length || 0), 0
  );

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
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Welcome Header */}
      <View style={styles.welcomeHeader}>
        <View style={styles.welcomeContent}>
          <Stethoscope size={32} color="#0066CC" />
          <View style={styles.welcomeText}>
            <Text style={styles.welcomeTitle}>Doctor Dashboard</Text>
            <Text style={styles.welcomeSubtitle}>
              Manage patient care and health insights
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Users size={24} color="#0066CC" />
          </View>
          <Text style={styles.statNumber}>{submissions.length}</Text>
          <Text style={styles.statLabel}>Total Patients</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Clock size={24} color="#FFA500" />
          </View>
          <Text style={styles.statNumber}>{pendingSubmissions.length}</Text>
          <Text style={styles.statLabel}>Pending Review</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <AlertTriangle size={24} color="#DC3545" />
          </View>
          <Text style={styles.statNumber}>{criticalCases.length}</Text>
          <Text style={styles.statLabel}>Critical Cases</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <MessageSquare size={24} color="#28A745" />
          </View>
          <Text style={styles.statNumber}>{totalRecommendations}</Text>
          <Text style={styles.statLabel}>Recommendations</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/patients')}
          >
            <Users size={24} color="#0066CC" />
            <Text style={styles.actionTitle}>Manage Patients</Text>
            <Text style={styles.actionSubtitle}>{submissions.length} total</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/research')}
          >
            <Activity size={24} color="#9B59B6" />
            <Text style={styles.actionTitle}>Research Portal</Text>
            <Text style={styles.actionSubtitle}>Anonymized data</Text>
          </TouchableOpacity>
        </View>
      </View>

      {criticalCases.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={20} color="#DC3545" />
            <Text style={[styles.sectionTitle, { color: '#DC3545' }]}>
              🚨 Critical Cases - Immediate Attention Required
            </Text>
          </View>
          {criticalCases.slice(0, 3).map((submission) => (
            <TouchableOpacity
              key={submission.id}
              style={[styles.submissionCard, styles.criticalCard]}
              onPress={() => router.push(`/(tabs)/AssessmentDetailsScreen?id=${submission.id}`)}
            >
              <View style={styles.submissionHeader}>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>
                    {submission.patients.profiles.full_name}
                  </Text>
                  <Text style={styles.patientDetails}>
                    {submission.patients.age ? `${submission.patients.age} years` : 'Age not specified'} • {' '}
                    {submission.patients.gender || 'Gender not specified'}
                  </Text>
                </View>
                <View style={styles.criticalBadge}>
                  <AlertTriangle size={16} color="white" />
                  <Text style={styles.criticalBadgeText}>
                    CRITICAL
                  </Text>
                </View>
              </View>
              <Text style={styles.submissionDate}>
                Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
              </Text>
              <View style={styles.criticalActions}>
                <View style={styles.criticalAction}>
                  <Eye size={16} color="#0066CC" />
                  <Text style={styles.criticalActionText}>Review Immediately</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Recent Patient Assessments</Text>
        {submissions.slice(0, 5).map((submission) => (
          <TouchableOpacity
            key={submission.id}
            style={styles.submissionCard}
            onPress={() => router.push(`/(tabs)/AssessmentDetailsScreen?id=${submission.id}`)}
          >
            <View style={styles.submissionHeader}>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>
                  {submission.patients.profiles.full_name}
                </Text>
                <Text style={styles.patientDetails}>
                  {submission.patients.age ? `${submission.patients.age} years` : 'Age not specified'} • {' '}
                  {submission.patients.gender || 'Gender not specified'}
                </Text>
              </View>
              <View style={styles.submissionMeta}>
                <View
                  style={[
                    styles.statusBadge,
                    submission.status === 'reviewed'
                      ? styles.statusReviewed
                      : styles.statusPending,
                  ]}
                >
                  {submission.status === 'reviewed' ? (
                    <CheckCircle size={12} color="#065F46" />
                  ) : (
                    <Clock size={12} color="#92400E" />
                  )}
                  <Text
                    style={[
                      styles.statusText,
                      submission.status === 'reviewed'
                        ? styles.statusTextReviewed
                        : styles.statusTextPending,
                    ]}
                  >
                    {submission.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>
            
            {submission.risk_predictions?.[0] && (
              <View style={styles.riskInfo}>
                <View style={[
                  styles.riskBadge,
                  { backgroundColor: `${getRiskColor(submission.risk_predictions[0].risk_category)}20` }
                ]}>
                  <Text
                    style={[
                      styles.riskValue,
                      {
                        color: getRiskColor(
                          submission.risk_predictions[0].risk_category
                        ),
                      },
                    ]}
                  >
                    {submission.risk_predictions[0].risk_category.toUpperCase()}
                  </Text>
                  <Text style={styles.riskScore}>
                    Score: {submission.risk_predictions[0].risk_score}
                  </Text>
                </View>
              </View>
            )}

            {submission.recommendations && submission.recommendations.length > 0 && (
              <View style={styles.recommendationInfo}>
                <MessageSquare size={14} color="#28A745" />
                <Text style={styles.recommendationText}>
                  {submission.recommendations.length} recommendation{submission.recommendations.length !== 1 ? 's' : ''} sent
                </Text>
              </View>
            )}
            
            <Text style={styles.submissionDate}>
              {new Date(submission.submitted_at).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.viewAllButton}
        onPress={() => router.push('/(tabs)/patients')}
      >
        <Users size={20} color="#0066CC" />
        <Text style={styles.viewAllButtonText}>Manage All Patients</Text>
      </TouchableOpacity>
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
  },
  welcomeHeader: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 24,
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
  statIconContainer: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
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
  submissionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  criticalCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
    backgroundColor: '#FEF2F2',
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    fontSize: 12,
    color: '#64748B',
  },
  submissionMeta: {
    alignItems: 'flex-end',
  },
  criticalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC3545',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  criticalBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riskValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  riskScore: {
    fontSize: 10,
    color: '#64748B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
  },
  statusTextReviewed: {
    color: '#065F46',
  },
  statusTextPending: {
    color: '#92400E',
  },
  riskInfo: {
    marginBottom: 8,
  },
  recommendationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  recommendationText: {
    fontSize: 12,
    color: '#28A745',
    fontWeight: '500',
  },
  submissionDate: {
    fontSize: 12,
    color: '#64748B',
  },
  criticalActions: {
    marginTop: 8,
  },
  criticalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  criticalActionText: {
    color: '#DC3545',
    fontWeight: '500',
    fontSize: 14,
  },
  viewAllButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0066CC',
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 32,
  },
  viewAllButtonText: {
    color: '#0066CC',
    fontWeight: '600',
  },
});