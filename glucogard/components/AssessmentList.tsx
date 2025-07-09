import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, FileText, ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { type Json } from '@/types/database';

interface Assessment {
  id: string;
  patient_id: string;
  answers: Json;
  status: string | null;
  submitted_at: string | null;
  risk_predictions?: {
    risk_score: number;
    risk_category: string;
  }[];
}

const AssessmentList = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      if (user?.id) {
        try {
          // Get patient ID first
          const { data: patientData } = await supabase
            .from('patients')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (!patientData) {
            setLoading(false);
            return;
          }

          const { data, error } = await supabase
            .from('health_submissions')
            .select(`
              *,
              risk_predictions (
                risk_score,
                risk_category
              )
            `)
            .eq('patient_id', patientData.id)
            .order('submitted_at', { ascending: false });

          if (error) {
            console.error('Error fetching assessments:', error);
          } else {
            setAssessments(data as Assessment[] || []);
          }
        } catch (error) {
          console.error('Unexpected error fetching assessments:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAssessments();
  }, [user]);

  const navigateToAssessmentDetails = (assessmentId: string) => {
    router.push(`/(tabs)/AssessmentDetailsScreen?id=${assessmentId}`);
  };

  const getRiskColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'non-diabetic':
        return '#10B981';
      case 'low':
        return '#28A745';
      case 'moderate':
        return '#FFA500';
      case 'high':
        return '#EF4444';
      case 'critical':
        return '#DC3545';
      default:
        return '#64748B';
    }
  };

  const getRiskIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'non-diabetic':
      case 'low':
        return CheckCircle;
      case 'moderate':
        return Clock;
      case 'high':
      case 'critical':
        return AlertTriangle;
      default:
        return FileText;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading your assessments...</Text>
      </View>
    );
  }

  if (assessments.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <FileText size={48} color="#64748B" />
        <Text style={styles.emptyTitle}>No Assessments Yet</Text>
        <Text style={styles.emptyText}>
          Take your first health assessment to start tracking your wellness journey.
        </Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push('/(tabs)/assessment')}
        >
          <Text style={styles.startButtonText}>Start Assessment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.assessmentTitle}>Your Health Assessments</Text>
        <Text style={styles.assessmentSubtitle}>
          {assessments.length} assessment{assessments.length !== 1 ? 's' : ''} completed
        </Text>
      </View>
      
      <ScrollView 
        style={styles.assessmentList}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {assessments.map((assessment, index) => {
          const riskPrediction = assessment.risk_predictions?.[0];
          const RiskIcon = getRiskIcon(riskPrediction?.risk_category || '');
          
          return (
            <TouchableOpacity
              key={assessment.id}
              style={styles.assessmentCard}
              onPress={() => navigateToAssessmentDetails(assessment.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <FileText size={20} color="#0066CC" />
                  <Text style={styles.cardTitle}>
                    Assessment #{assessments.length - index}
                  </Text>
                </View>
                <ChevronRight size={20} color="#64748B" />
              </View>

              <View style={styles.cardContent}>
                <View style={styles.dateContainer}>
                  <Calendar size={16} color="#64748B" />
                  <Text style={styles.dateText}>
                    {formatDate(assessment.submitted_at || '')}
                  </Text>
                </View>

                {riskPrediction && (
                  <View style={styles.riskContainer}>
                    <View style={[
                      styles.riskBadge,
                      { backgroundColor: `${getRiskColor(riskPrediction.risk_category)}20` }
                    ]}>
                      <RiskIcon 
                        size={16} 
                        color={getRiskColor(riskPrediction.risk_category)} 
                      />
                      <Text style={[
                        styles.riskText,
                        { color: getRiskColor(riskPrediction.risk_category) }
                      ]}>
                        {riskPrediction.risk_category.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.riskScore}>
                      Score: {riskPrediction.risk_score}
                    </Text>
                  </View>
                )}

                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusBadge,
                    assessment.status === 'reviewed' 
                      ? styles.statusReviewed 
                      : styles.statusPending
                  ]}>
                    {assessment.status === 'reviewed' ? (
                      <CheckCircle size={12} color="#065F46" />
                    ) : (
                      <Clock size={12} color="#92400E" />
                    )}
                    <Text style={[
                      styles.statusText,
                      assessment.status === 'reviewed'
                        ? styles.statusTextReviewed
                        : styles.statusTextPending
                    ]}>
                      {assessment.status === 'reviewed' ? 'Reviewed' : 'Pending Review'}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    marginBottom: 16,
  },
  assessmentTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  assessmentSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  assessmentList: {
    flex: 1,
    maxHeight: 400, // Prevent overflow
  },
  assessmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  cardContent: {
    gap: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#64748B',
  },
  riskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
  },
  riskScore: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'flex-start',
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
    fontSize: 12,
    fontWeight: '500',
  },
  statusTextReviewed: {
    color: '#065F46',
  },
  statusTextPending: {
    color: '#92400E',
  },
});

export default AssessmentList;