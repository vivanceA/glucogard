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
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CircleCheck as CheckCircle, 
  TriangleAlert as AlertTriangle, 
  Heart,
  Activity,
  Target,
  TrendingUp,
  FileText,
  User,
  MapPin,
  Zap,
  Shield,
  Award,
  ChevronRight,
  Download,
  Share
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface AssessmentDetails {
  id: string;
  answers: any;
  status: string;
  submitted_at: string;
  risk_predictions?: {
    risk_score: number;
    risk_category: string;
    raw_prediction?: any;
  }[];
  recommendations?: {
    content: string;
    type: 'lifestyle' | 'clinical';
    created_at: string;
  }[];
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function AssessmentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'recommendations'>('overview');

  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.9);
  const tabIndicatorPosition = useSharedValue(0);

  useEffect(() => {
    fetchAssessmentDetails();
    
    // Entrance animations
    headerOpacity.value = withTiming(1, { duration: 600 });
    contentScale.value = withSpring(1, { damping: 15, stiffness: 150 });
  }, [id]);

  useEffect(() => {
    // Tab indicator animation
    const tabWidth = width / 3;
    const positions = { overview: 0, details: tabWidth, recommendations: tabWidth * 2 };
    tabIndicatorPosition.value = withSpring(positions[activeTab]);
  }, [activeTab]);

  const fetchAssessmentDetails = async () => {
    if (!id || !user) return;

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
            risk_category,
            raw_prediction
          ),
          recommendations (
            content,
            type,
            created_at
          )
        `)
        .eq('id', id)
        .eq('patient_id', patientData.id)
        .single();

      if (error) {
        console.error('Error fetching assessment details:', error);
      } else {
        setAssessment(data);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
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
        return Heart;
    }
  };

  const getHealthScore = () => {
    if (!assessment?.risk_predictions?.[0]) return 0;
    // Convert risk_score (0-4 scale) to health score (0-100 scale)
    const riskScore = assessment.risk_predictions[0].risk_score || 0;
    if (riskScore === 0) return 95; // Non-diabetic
    if (riskScore === 1) return 80; // Low risk
    if (riskScore === 2) return 60; // Moderate risk
    if (riskScore === 3) return 40; // High risk
    return 20; // Critical risk
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: interpolate(headerOpacity.value, [0, 1], [-20, 0]) }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
  }));

  const tabIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicatorPosition.value }],
  }));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Loading assessment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!assessment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <FileText size={64} color="#64748B" />
          <Text style={styles.errorTitle}>Assessment Not Found</Text>
          <Text style={styles.errorText}>
            The assessment you're looking for doesn't exist or you don't have permission to view it.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const riskPrediction = assessment.risk_predictions?.[0];
  const RiskIcon = getRiskIcon(riskPrediction?.risk_category || '');
  const healthScore = getHealthScore();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assessment Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionButton}>
            <Share size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionButton}>
            <Download size={20} color="white" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800' }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay}>
          <Animated.View style={[styles.heroContent, contentAnimatedStyle]}>
            <View style={styles.scoreContainer}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNumber}>{healthScore}</Text>
                <Text style={styles.scoreLabel}>Health Score</Text>
              </View>
              {riskPrediction && (
                <View style={[
                  styles.riskBadge,
                  { backgroundColor: getRiskColor(riskPrediction.risk_category) }
                ]}>
                  <RiskIcon size={20} color="white" />
                  <Text style={styles.riskText}>
                    {riskPrediction.risk_category.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBackground}>
          <Animated.View style={[styles.tabIndicator, tabIndicatorStyle]} />
        </View>
        {(['overview', 'details', 'recommendations'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.tabTextActive
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && (
          <Animated.View style={[styles.tabContent, contentAnimatedStyle]}>
            {/* Quick Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Calendar size={24} color="#0066CC" />
                <Text style={styles.statNumber}>
                  {formatDate(assessment.submitted_at).split(',')[0]}
                </Text>
                <Text style={styles.statLabel}>Assessment Date</Text>
              </View>

              <View style={styles.statCard}>
                <Target size={24} color="#28A745" />
                <Text style={styles.statNumber}>
                  {riskPrediction?.risk_score || 0}
                </Text>
                <Text style={styles.statLabel}>Risk Score</Text>
              </View>

              <View style={styles.statCard}>
                <Award size={24} color="#FFD700" />
                <Text style={styles.statNumber}>
                  {assessment.recommendations?.length || 0}
                </Text>
                <Text style={styles.statLabel}>Recommendations</Text>
              </View>
            </View>

            {/* Key Insights */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔍 Key Insights</Text>
              <View style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <TrendingUp size={24} color="#0066CC" />
                  <Text style={styles.insightTitle}>Health Assessment Summary</Text>
                </View>
                <Text style={styles.insightText}>
                  Based on your responses, your health profile shows{' '}
                  <Text style={[styles.riskHighlight, { color: getRiskColor(riskPrediction?.risk_category || '') }]}>
                    {riskPrediction?.risk_category.replace('_', ' ').toLowerCase()} risk
                  </Text>
                  {' '}for diabetes development. Your health score of {healthScore} indicates{' '}
                  {healthScore >= 80 ? 'excellent' : healthScore >= 60 ? 'good' : 'needs attention'} overall health status.
                </Text>
              </View>
            </View>

            {/* Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 Review Status</Text>
              <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                  {assessment.status === 'reviewed' ? (
                    <CheckCircle size={24} color="#28A745" />
                  ) : (
                    <Clock size={24} color="#FFA500" />
                  )}
                  <Text style={styles.statusTitle}>
                    {assessment.status === 'reviewed' ? 'Reviewed by Healthcare Provider' : 'Pending Review'}
                  </Text>
                </View>
                <Text style={styles.statusDescription}>
                  {assessment.status === 'reviewed' 
                    ? 'Your assessment has been reviewed by a healthcare professional. Check the recommendations tab for personalized advice.'
                    : 'Your assessment is currently being reviewed by our healthcare team. You will be notified once the review is complete.'
                  }
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {activeTab === 'details' && (
          <Animated.View style={[styles.tabContent, contentAnimatedStyle]}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📝 Assessment Responses</Text>
              {Object.entries(assessment.answers as Record<string, any>).map(([key, value], index) => (
                <View key={key} style={styles.responseCard}>
                  <Text style={styles.responseQuestion}>
                    {key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                  <Text style={styles.responseAnswer}>
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </Text>
                </View>
              ))}
            </View>

            {riskPrediction?.raw_prediction && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🤖 AI Analysis</Text>
                <View style={styles.aiAnalysisCard}>
                  <View style={styles.aiHeader}>
                    <Zap size={24} color="#9B59B6" />
                    <Text style={styles.aiTitle}>Machine Learning Insights</Text>
                  </View>
                  <Text style={styles.aiDescription}>
                    Our AI model analyzed your responses using advanced algorithms trained on thousands of health assessments.
                  </Text>
                  {riskPrediction.raw_prediction.probabilities && (
                    <View style={styles.probabilityContainer}>
                      <Text style={styles.probabilityTitle}>Risk Probabilities:</Text>
                      {Object.entries(riskPrediction.raw_prediction.probabilities).map(([risk, prob]) => (
                        <View key={risk} style={styles.probabilityRow}>
                          <Text style={styles.probabilityLabel}>{risk}</Text>
                          <View style={styles.probabilityBar}>
                            <View 
                              style={[
                                styles.probabilityFill,
                                { 
                                  width: `${(prob as number) * 100}%`,
                                  backgroundColor: getRiskColor(risk.toLowerCase().replace(' ', '_'))
                                }
                              ]} 
                            />
                          </View>
                          <Text style={styles.probabilityValue}>
                            {Math.round((prob as number) * 100)}%
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}
          </Animated.View>
        )}

        {activeTab === 'recommendations' && (
          <Animated.View style={[styles.tabContent, contentAnimatedStyle]}>
            {assessment.recommendations && assessment.recommendations.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💡 Personalized Recommendations</Text>
                {assessment.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationCard}>
                    <View style={styles.recommendationHeader}>
                      <View style={[
                        styles.recommendationIcon,
                        { backgroundColor: rec.type === 'lifestyle' ? '#D1FAE5' : '#FEE2E2' }
                      ]}>
                        {rec.type === 'lifestyle' ? (
                          <Activity size={20} color="#065F46" />
                        ) : (
                          <Heart size={20} color="#991B1B" />
                        )}
                      </View>
                      <View style={styles.recommendationMeta}>
                        <Text style={styles.recommendationType}>
                          {rec.type === 'lifestyle' ? 'Lifestyle' : 'Clinical'} Recommendation
                        </Text>
                        <Text style={styles.recommendationDate}>
                          {formatDate(rec.created_at)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.recommendationContent}>{rec.content}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyRecommendations}>
                <Heart size={64} color="#64748B" />
                <Text style={styles.emptyTitle}>No Recommendations Yet</Text>
                <Text style={styles.emptyText}>
                  Recommendations will appear here once your assessment has been reviewed by a healthcare professional.
                </Text>
              </View>
            )}
          </Animated.View>
        )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0066CC',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingTop: 50,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    height: 200,
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
  },
  scoreContainer: {
    alignItems: 'center',
    gap: 16,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  scoreLabel: {
    fontSize: 12,
    color: 'white',
    marginTop: 4,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  riskText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    position: 'relative',
    flexDirection: 'row',
  },
  tabBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#F1F5F9',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: width / 3,
    height: 3,
    backgroundColor: '#0066CC',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0066CC',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 18,
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  insightText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  riskHighlight: {
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  statusDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  responseCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  responseQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  responseAnswer: {
    fontSize: 14,
    color: '#64748B',
  },
  aiAnalysisCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  aiDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  probabilityContainer: {
    gap: 12,
  },
  probabilityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  probabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  probabilityLabel: {
    fontSize: 12,
    color: '#64748B',
    minWidth: 80,
  },
  probabilityBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  probabilityFill: {
    height: '100%',
    borderRadius: 3,
  },
  probabilityValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    minWidth: 40,
    textAlign: 'right',
  },
  recommendationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  recommendationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationMeta: {
    flex: 1,
  },
  recommendationType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  recommendationDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  recommendationContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  emptyRecommendations: {
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
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
});