import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { PatientDashboard } from '@/components/PatientDashboard';
import { DoctorDashboard } from '@/components/DoctorDashboard';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { type Json } from '@/types/database';

interface Assessment {
  id: string;
  patient_id: string;
  answers: Json;
  status: string | null;
  submitted_at: string | null;
}

export default function DashboardScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('health_submissions')
            .select('*')
            .eq('patient_id', user.id);

          if (error) {
            console.error('Error fetching assessments:', error);
          } else {
            setAssessments(data as Assessment[] || []);
          }
        } catch (error) {
          console.error('Unexpected error fetching assessments:', error);
        } finally {
          setFetchLoading(false);
        }
      }
    };

    fetchAssessments();
  }, [user]);

  if (loading || fetchLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  const navigateToAssessmentDetails = (assessmentId: string) => {
    router.push(`/(tabs)/AssessmentDetailsScreen?id=${assessmentId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Home</Text>
        <Text style={styles.subtitle}>Welcome back, {user.full_name}</Text>
      </View>

      {user.role === 'patient' ? (
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <PatientDashboard />
        </ScrollView>
      ) : (
        <DoctorDashboard />
      )}
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
    backgroundColor: '#F8FAFB',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  assessmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    paddingHorizontal: 24,
    marginTop: 20,
  },
  scrollContainer: {
    flex: 1,
  },
});
