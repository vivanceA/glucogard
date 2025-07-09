import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Clock, TrendingUp, Plus, Target, Award, Zap, Calendar, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import AssessmentList from './AssessmentList';
import { DiabetesQuickActions } from './DiabetesQuickActions.tsx';
import { DiabetesManagementCard } from './DiabetesManagementCard';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface HealthSubmission {
  id: string;
  status: 'pending' | 'reviewed';
  submitted_at: string;
  risk_predictions?: {
    risk_score: number;
    risk_category: string; // More flexible for all categories
  }[];
  recommendations?: {
    content: string;
    type: 'lifestyle' | 'clinical';
    created_at: string;
  }[];
}

export function PatientDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<HealthSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    fetchSubmissions();
    checkFirstTimeUser();
  }, []);

  const checkFirstTimeUser = async () => {
    try {
      const hasSeenDashboard = await AsyncStorage.getItem('hasSeenDashboard');
      if (!hasSeenDashboard) {
        setIsFirstTime(true);
        // Mark that user has now seen the dashboard
        await AsyncStorage.setItem('hasSeenDashboard', 'true');
      }
    } catch (error) {
      console.error('Error checking first time user:', error);
    }
  };
  const fetchSubmissions = async () => {
    if (!user) return;

    try {
      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!patientData) {
        // It's possible a new user has no patient record yet.
        // Don't throw an error, just return. The dashboard will show the "Get Started" card.
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('health_submissions')
        .select(`
          id,
          status,
          submitted_at,
          risk_predictions (
            risk_score,
            risk_category
          ),
          recommendations (
            content,
            type,
            created_at
          )
        `)
        .eq('patient_id', patientData.id)
        .order('submitted_at', { ascending: false });

      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLatestPrediction = () => {
    const latestSubmission = submissions[0];
    return latestSubmission?.risk_predictions?.[0];
  };

  const latestPrediction = getLatestPrediction();

  const getMotivationalMessage = () => {
    switch (latestPrediction?.risk_category.toLowerCase()) {
      case 'non-diabetic':
        return "Excellent results! You're doing great. ✅";
      case 'low':
        return "Great job! Keep up the healthy habits! 🌟";
      case 'moderate':
        return "You're on the right track! Small changes make big differences 💪";
      case 'high':
        return "It's time to focus on your health. We're here to help. 🤝";
      case 'critical':
        return "Let's work together to improve your health 🎯";
      default:
        return "Ready to start your health journey?";
    }
  };

  const getHealthScore = () => {
    if (!latestPrediction) return 0;
    // Convert risk_score (0-4 scale) to health score (0-100 scale)
    const riskScore = latestPrediction.risk_score || 0;
    if (riskScore === 0) return 95; // Non-diabetic
    if (riskScore === 1) return 80; // Low risk
    if (riskScore === 2) return 60; // Moderate risk
    if (riskScore === 3) return 40; // High risk
    return 20; // Critical risk
  };

  // Memoize derived values for performance
  const motivationalMessage = React.useMemo(getMotivationalMessage, [latestPrediction]);
  const healthScore = React.useMemo(getHealthScore, [latestPrediction]);

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
        return CheckCircle;
      case 'low':
        return CheckCircle;
      case 'moderate':
        return Clock;
      case 'high':
        return AlertTriangle;
      case 'critical':
        return AlertTriangle;
      default:
        return Heart;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  const totalRecommendations = submissions.reduce(
    (acc, sub) => acc + (sub.recommendations?.length || 0),
    0
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800' }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay}>
          <Text style={styles.heroGreeting}>Hello, {user?.full_name?.split(' ')[0]}! 👋</Text>
          <Text style={styles.heroMessage}>{motivationalMessage}</Text>
        </View>
      </View>

      {/* Quick Actions for Diabetes Management */}
      <DiabetesQuickActions />

      {/* Diabetes Management for existing diabetics */}
      {latestPrediction && (
        latestPrediction.risk_category === 'high' || 
        latestPrediction.risk_category === 'critical'
      ) && (
        <DiabetesManagementCard riskCategory={latestPrediction.risk_category} />
      )}
      
      {/* Health Score Card */}
      {latestPrediction ? (
        <View style={styles.healthScoreCard}>
          <View style={styles.scoreHeader}>
            <View>
              <Text style={styles.scoreTitle}>Health Score</Text>
              <Text style={styles.scoreSubtitle}>Based on your latest assessment</Text>
            </View>
            <Award size={24} color="#FFD700" />
          </View>
          
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{healthScore}</Text>
            <Text style={styles.scoreOutOf}>/100</Text>
          </View>
          
          <View style={styles.riskBadge}>
            <Text style={[styles.riskText, { color: getRiskColor(latestPrediction.risk_category) }]}>
              {latestPrediction.risk_category.replace('_', ' ').toUpperCase()} RISK
            </Text>
          </View>
        </View>
      ) : null}

      {/* Only show Get Started card for first-time users with no assessments */}
      {!latestPrediction && isFirstTime && (
        <View style={styles.getStartedCard}>
          <View style={styles.getStartedContent}>
            <Zap size={32} color="#0066CC" />
            <Text style={styles.getStartedTitle}>Ready to Begin?</Text>
            <Text style={styles.getStartedText}>
              Take your first health assessment to unlock personalized insights
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => router.push('/(tabs)/assessment')}
            >
              <Text style={styles.startButtonText}>Start Your Journey</Text>
              <ArrowRight size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Key Metrics */}
      {submissions.length > 0 && (
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Calendar size={24} color="#0066CC" />
            <Text style={styles.statNumber}>{submissions.length}</Text>
            <Text style={styles.statLabel}>Assessments</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={24} color="#FFA500" />
            <Text style={styles.statNumber}>
              {submissions.filter(s => s.status === 'pending').length}
            </Text>
            <Text style={styles.statLabel}>Pending Review</Text>
          </View>
          <View style={styles.statCard}>
            <Target size={24} color="#28A745" />
            <Text style={styles.statNumber}>{totalRecommendations}</Text>
            <Text style={styles.statLabel}>Recommendations</Text>
          </View>
        </View>
      )}

      {/* Latest Recommendations */}
      {submissions[0]?.recommendations && submissions[0].recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Latest Recommendations</Text>
          <View style={styles.recommendationsList}>
            {submissions[0].recommendations.slice(0, 3).map((rec, index) => (
              <View key={`${rec.content}-${index}`} style={styles.recommendationCard}>
                <View style={[styles.recommendationIcon, { backgroundColor: rec.type === 'lifestyle' ? '#D1FAE5' : '#FEE2E2' }]}>
                  {rec.type === 'lifestyle' ? (
                    <Zap size={20} color="#065F46" />
                  ) : (
                    <Heart size={20} color="#991B1B" />
                  )}
                </View>
                <Text style={styles.recommendationText}>{rec.content}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Assessment History */}
      {submissions.length > 0 && (
        <View style={styles.assessmentSection}>
          <AssessmentList />
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
  },
  heroSection: {
    height: 200,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    paddingHorizontal: 24,
    position: 'relative',
  },
  heroImage: {
    position: 'absolute',
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
    backgroundColor: 'rgba(0, 102, 204, 0.7)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  heroGreeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  heroMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
  healthScoreCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    marginTop: -60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    alignItems: 'center',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  scoreSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 40,
  },
  scoreOutOf: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  riskBadge: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  riskText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  getStartedCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    marginTop: -60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  getStartedContent: {
    alignItems: 'center',
    gap: 12,
  },
  getStartedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 8,
  },
  getStartedText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  startButton: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    width: '100%',
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    marginTop: 24,
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  recommendationsList: {
    gap: 12,
  },
  recommendationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  assessmentSection: {
    marginTop: 32,
    paddingHorizontal: 24,
    flex: 1,
    minHeight: 300,
  },
});
