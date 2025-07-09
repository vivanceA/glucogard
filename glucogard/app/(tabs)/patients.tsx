import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Users, 
  Search, 
  Filter, 
  TriangleAlert as AlertTriangle, 
  Clock, 
  CircleCheck as CheckCircle, 
  Eye, 
  MessageSquare, 
  TrendingUp,
  Calendar,
  Heart,
  User,
  Send,
  X,
  FileText,
  Activity,
  Target
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');

interface PatientSubmission {
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
    risk_category: string;
  }[];
  recommendations?: {
    id: string;
    content: string;
    type: 'lifestyle' | 'clinical';
    created_at: string;
  }[];
}

export default function PatientsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<PatientSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<PatientSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'critical' | 'reviewed'>('all');
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<PatientSubmission | null>(null);
  const [recommendationContent, setRecommendationContent] = useState('');
  const [recommendationType, setRecommendationType] = useState<'lifestyle' | 'clinical'>('lifestyle');
  const [sendingRecommendation, setSendingRecommendation] = useState(false);

  useEffect(() => {
    if (user?.role === 'doctor') {
      fetchPatientSubmissions();
    }
  }, [user]);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchQuery, selectedFilter]);

  const fetchPatientSubmissions = async () => {
    try {
      const { data, error } = await supabase
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

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching patient submissions:', error);
      Alert.alert('Error', 'Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = submissions;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(submission =>
        submission.patients.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    switch (selectedFilter) {
      case 'pending':
        filtered = filtered.filter(s => s.status === 'pending');
        break;
      case 'critical':
        filtered = filtered.filter(s => 
          s.risk_predictions?.[0]?.risk_category === 'critical'
        );
        break;
      case 'reviewed':
        filtered = filtered.filter(s => s.status === 'reviewed');
        break;
    }

    setFilteredSubmissions(filtered);
  };

  const handleSendRecommendation = async () => {
    if (!selectedSubmission || !recommendationContent.trim()) {
      Alert.alert('Error', 'Please enter a recommendation');
      return;
    }

    setSendingRecommendation(true);
    try {
      // Get doctor ID
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!doctorData) {
        throw new Error('Doctor record not found');
      }

      // Insert recommendation
      const { error } = await supabase
        .from('recommendations')
        .insert({
          submission_id: selectedSubmission.id,
          doctor_id: doctorData.id,
          content: recommendationContent.trim(),
          type: recommendationType,
        });

      if (error) throw error;

      // Update submission status to reviewed
      await supabase
        .from('health_submissions')
        .update({ status: 'reviewed' })
        .eq('id', selectedSubmission.id);

      Alert.alert('Success', 'Recommendation sent successfully');
      setShowRecommendationModal(false);
      setRecommendationContent('');
      setSelectedSubmission(null);
      
      // Refresh data
      fetchPatientSubmissions();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send recommendation');
    } finally {
      setSendingRecommendation(false);
    }
  };

  const getRiskColor = (category: string) => {
    switch (category?.toLowerCase()) {
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
      case 'low':
        return CheckCircle;
      case 'moderate':
        return Clock;
      case 'high':
      case 'critical':
        return AlertTriangle;
      default:
        return Heart;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (user?.role !== 'doctor') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDenied}>
          <Users size={64} color="#64748B" />
          <Text style={styles.accessDeniedTitle}>Access Restricted</Text>
          <Text style={styles.accessDeniedText}>
            This section is only available to healthcare providers.
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
          <Text style={styles.loadingText}>Loading patient data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const criticalCount = submissions.filter(s => 
    s.risk_predictions?.[0]?.risk_category === 'critical'
  ).length;
  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Users size={24} color="#0066CC" />
          <Text style={styles.title}>Patient Management</Text>
        </View>
        <Text style={styles.subtitle}>
          {submissions.length} patients • {criticalCount} critical • {pendingCount} pending
        </Text>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {(['all', 'pending', 'critical', 'reviewed'] as const).map((filter) => (
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
        </ScrollView>
      </View>

      {/* Patient List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredSubmissions.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={48} color="#64748B" />
            <Text style={styles.emptyTitle}>No patients found</Text>
            <Text style={styles.emptyText}>
              {searchQuery || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Patient assessments will appear here'
              }
            </Text>
          </View>
        ) : (
          filteredSubmissions.map((submission) => {
            const riskPrediction = submission.risk_predictions?.[0];
            const RiskIcon = getRiskIcon(riskPrediction?.risk_category || '');
            
            return (
              <View key={submission.id} style={styles.patientCard}>
                <View style={styles.patientHeader}>
                  <View style={styles.patientInfo}>
                    <View style={styles.patientNameRow}>
                      <User size={20} color="#0066CC" />
                      <Text style={styles.patientName}>
                        {submission.patients.profiles.full_name}
                      </Text>
                    </View>
                    <Text style={styles.patientDetails}>
                      {submission.patients.age ? `${submission.patients.age} years` : 'Age not specified'} • {' '}
                      {submission.patients.gender || 'Gender not specified'}
                    </Text>
                    <Text style={styles.submissionDate}>
                      Submitted: {formatDate(submission.submitted_at)}
                    </Text>
                  </View>

                  <View style={styles.patientStatus}>
                    {riskPrediction && (
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
                          {riskPrediction.risk_category.toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.riskScore}>
                      Score: {riskPrediction?.risk_score || 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Recommendations Summary */}
                {submission.recommendations && submission.recommendations.length > 0 && (
                  <View style={styles.recommendationsPreview}>
                    <Text style={styles.recommendationsTitle}>
                      Recent Recommendations ({submission.recommendations.length})
                    </Text>
                    <Text style={styles.recommendationPreview} numberOfLines={2}>
                      {submission.recommendations[0].content}
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push(`/(tabs)/AssessmentDetailsScreen?id=${submission.id}`)}
                  >
                    <Eye size={16} color="#0066CC" />
                    <Text style={styles.actionButtonText}>View Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.recommendButton]}
                    onPress={() => {
                      setSelectedSubmission(submission);
                      setShowRecommendationModal(true);
                    }}
                  >
                    <MessageSquare size={16} color="#28A745" />
                    <Text style={[styles.actionButtonText, { color: '#28A745' }]}>
                      Send Recommendation
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Status Badge */}
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusBadge,
                    submission.status === 'reviewed' 
                      ? styles.statusReviewed 
                      : styles.statusPending
                  ]}>
                    {submission.status === 'reviewed' ? (
                      <CheckCircle size={12} color="#065F46" />
                    ) : (
                      <Clock size={12} color="#92400E" />
                    )}
                    <Text style={[
                      styles.statusText,
                      submission.status === 'reviewed'
                        ? styles.statusTextReviewed
                        : styles.statusTextPending
                    ]}>
                      {submission.status === 'reviewed' ? 'Reviewed' : 'Pending Review'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Recommendation Modal */}
      <Modal
        visible={showRecommendationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecommendationModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Send Recommendation</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowRecommendationModal(false)}
            >
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {selectedSubmission && (
            <View style={styles.modalContent}>
              <View style={styles.patientSummary}>
                <Text style={styles.patientSummaryTitle}>
                  {selectedSubmission.patients.profiles.full_name}
                </Text>
                <Text style={styles.patientSummaryDetails}>
                  Risk: {selectedSubmission.risk_predictions?.[0]?.risk_category || 'Unknown'} • 
                  Score: {selectedSubmission.risk_predictions?.[0]?.risk_score || 'N/A'}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Recommendation Type</Text>
                <View style={styles.typeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      recommendationType === 'lifestyle' && styles.typeButtonActive
                    ]}
                    onPress={() => setRecommendationType('lifestyle')}
                  >
                    <Activity size={16} color={recommendationType === 'lifestyle' ? 'white' : '#28A745'} />
                    <Text style={[
                      styles.typeButtonText,
                      recommendationType === 'lifestyle' && styles.typeButtonTextActive
                    ]}>
                      Lifestyle
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      recommendationType === 'clinical' && styles.typeButtonActive
                    ]}
                    onPress={() => setRecommendationType('clinical')}
                  >
                    <Target size={16} color={recommendationType === 'clinical' ? 'white' : '#DC3545'} />
                    <Text style={[
                      styles.typeButtonText,
                      recommendationType === 'clinical' && styles.typeButtonTextActive
                    ]}>
                      Clinical
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Recommendation</Text>
                <TextInput
                  style={styles.textArea}
                  value={recommendationContent}
                  onChangeText={setRecommendationContent}
                  placeholder="Enter your recommendation for the patient..."
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!recommendationContent.trim() || sendingRecommendation) && styles.sendButtonDisabled
                ]}
                onPress={handleSendRecommendation}
                disabled={!recommendationContent.trim() || sendingRecommendation}
              >
                {sendingRecommendation ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Send size={20} color="white" />
                    <Text style={styles.sendButtonText}>Send Recommendation</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>
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
    marginBottom: 8,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  filterContainer: {
    maxHeight: 50,
  },
  filterContent: {
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterButtonActive: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  filterButtonText: {
    fontSize: 14,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  patientCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  patientInfo: {
    flex: 1,
    marginRight: 16,
  },
  patientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  patientDetails: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  submissionDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  patientStatus: {
    alignItems: 'flex-end',
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
    gap: 4,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '600',
  },
  riskScore: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  recommendationsPreview: {
    backgroundColor: '#F8FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  recommendationPreview: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFB',
    gap: 6,
  },
  recommendButton: {
    backgroundColor: '#F0FDF4',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0066CC',
  },
  statusContainer: {
    alignItems: 'flex-start',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  patientSummary: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  patientSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  patientSummaryDetails: {
    fontSize: 14,
    color: '#64748B',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  textArea: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});