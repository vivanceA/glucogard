import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Heart, Droplets, Pill, Activity, Calendar, Plus, TrendingUp, Clock, Target, Zap, X, CircleCheck as CheckCircle, Bell, ChartBar as BarChart3 } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import {
  getDailyTasks,
  completeTask,
  addBloodSugarReading,
  getBloodSugarHistory,
  type DiabetesTask,
  type BloodSugarReading,
} from '@/lib/diabetes-management';

export function DiabetesQuickActions() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<DiabetesTask[]>([]);
  const [recentReadings, setRecentReadings] = useState<BloodSugarReading[]>([]);
  const [showBloodSugarModal, setShowBloodSugarModal] = useState(false);
  const [bloodSugarReading, setBloodSugarReading] = useState('');
  const [readingType, setReadingType] = useState<'fasting' | 'post_meal' | 'bedtime' | 'random'>('fasting');

  useEffect(() => {
    if (user) {
      loadQuickData();
    }
  }, [user]);

  const loadQuickData = async () => {
    if (!user) return;

    try {
      const [tasksData, readingsData] = await Promise.all([
        getDailyTasks(user.id),
        getBloodSugarHistory(user.id, 7), // Last 7 days
      ]);

      setTasks(tasksData);
      setRecentReadings(readingsData);
    } catch (error) {
      console.error('Error loading quick data:', error);
    }
  };

  const handleQuickTaskComplete = async (taskId: string) => {
    try {
      await completeTask(taskId);
      await loadQuickData();
      
      // Show success feedback
      if (Platform.OS !== 'web') {
        // Add haptic feedback for mobile
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to complete task');
    }
  };

  const handleQuickBloodSugarLog = async () => {
    if (!user || !bloodSugarReading) return;

    try {
      const reading = parseFloat(bloodSugarReading);
      if (isNaN(reading) || reading < 20 || reading > 600) {
        Alert.alert('Invalid Reading', 'Please enter a valid blood sugar reading between 20-600 mg/dL');
        return;
      }

      await addBloodSugarReading(user.id, reading, readingType);
      setShowBloodSugarModal(false);
      setBloodSugarReading('');
      await loadQuickData();
      
      Alert.alert('Success', 'Blood sugar reading logged successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to log blood sugar reading');
    }
  };

  const getCompletedTasksCount = () => {
    return tasks.filter(task => task.completed).length;
  };

  const getLatestReading = () => {
    return recentReadings.length > 0 ? recentReadings[0] : null;
  };

  const getReadingColor = (reading: number) => {
    if (reading < 70) return '#DC3545'; // Low
    if (reading > 180) return '#FFA500'; // High
    return '#28A745'; // Normal
  };

  const urgentTasks = tasks.filter(task => !task.completed && task.type === 'medication').slice(0, 2);
  const latestReading = getLatestReading();
  const completedCount = getCompletedTasksCount();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Heart size={20} color="#DC3545" />
        </View>
        <Text style={styles.headerTitle}>Diabetes Care</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => router.push('/(tabs)/diabetes-dashboard')}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.actionsScroll}
        contentContainerStyle={styles.actionsContent}
      >
        {/* Quick Blood Sugar Log */}
        <TouchableOpacity
          style={[styles.actionCard, styles.primaryCard]}
          onPress={() => setShowBloodSugarModal(true)}
        >
          <View style={styles.cardIcon}>
            <Droplets size={24} color="white" />
          </View>
          <Text style={styles.cardTitle}>Log Blood Sugar</Text>
          {latestReading && (
            <View style={styles.cardSubtitle}>
              <Text style={styles.lastReadingText}>
                Last: {latestReading.reading} mg/dL
              </Text>
              <Text style={styles.readingTime}>
                {new Date(latestReading.recorded_at).toLocaleDateString()}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Today's Progress */}
        <TouchableOpacity
          style={[styles.actionCard, styles.progressCard]}
          onPress={() => router.push('/(tabs)/diabetes-dashboard')}
        >
          <View style={styles.cardIcon}>
            <Target size={24} color="#0066CC" />
          </View>
          <Text style={[styles.cardTitle, { color: '#0066CC' }]}>Today's Progress</Text>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {completedCount}/{tasks.length} tasks
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%` }
                ]} 
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Medication Reminder */}
        {urgentTasks.length > 0 && (
          <TouchableOpacity
            style={[styles.actionCard, styles.medicationCard]}
            onPress={() => handleQuickTaskComplete(urgentTasks[0].id)}
          >
            <View style={styles.cardIcon}>
              <Pill size={24} color="#28A745" />
            </View>
            <Text style={[styles.cardTitle, { color: '#28A745' }]}>
              {urgentTasks[0].title}
            </Text>
            <Text style={styles.cardSubtitle}>
              {urgentTasks[0].time || 'Tap to complete'}
            </Text>
            <View style={styles.urgentBadge}>
              <Bell size={12} color="#FFA500" />
              <Text style={styles.urgentText}>Due</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Weekly Trends */}
        <TouchableOpacity
          style={[styles.actionCard, styles.trendsCard]}
          onPress={() => router.push('/(tabs)/diabetes-dashboard')}
        >
          <View style={styles.cardIcon}>
            <BarChart3 size={24} color="#9B59B6" />
          </View>
          <Text style={[styles.cardTitle, { color: '#9B59B6' }]}>Weekly Trends</Text>
          <View style={styles.trendsInfo}>
            <Text style={styles.trendsText}>
              {recentReadings.length} readings
            </Text>
            {recentReadings.length > 0 && (
              <Text style={styles.avgText}>
                Avg: {Math.round(recentReadings.reduce((sum, r) => sum + r.reading, 0) / recentReadings.length)} mg/dL
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Add Medication */}
        <TouchableOpacity
          style={[styles.actionCard, styles.addCard]}
          onPress={() => router.push('/(tabs)/diabetes-dashboard')}
        >
          <View style={styles.cardIcon}>
            <Plus size={24} color="#64748B" />
          </View>
          <Text style={[styles.cardTitle, { color: '#64748B' }]}>Add Medication</Text>
          <Text style={styles.cardSubtitle}>Set up reminders</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Quick Blood Sugar Modal */}
      <Modal
        visible={showBloodSugarModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBloodSugarModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Quick Blood Sugar Log</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowBloodSugarModal(false)}
            >
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reading (mg/dL)</Text>
              <TextInput
                style={styles.textInput}
                value={bloodSugarReading}
                onChangeText={setBloodSugarReading}
                placeholder="Enter reading"
                keyboardType="numeric"
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeButtons}>
                {(['fasting', 'post_meal', 'bedtime', 'random'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      readingType === type && styles.typeButtonActive
                    ]}
                    onPress={() => setReadingType(type)}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      readingType === type && styles.typeButtonTextActive
                    ]}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleQuickBloodSugarLog}
            >
              <Droplets size={20} color="white" />
              <Text style={styles.submitButtonText}>Log Reading</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0066CC',
  },
  actionsScroll: {
    paddingLeft: 24,
  },
  actionsContent: {
    paddingRight: 24,
    gap: 12,
  },
  actionCard: {
    width: 160,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  primaryCard: {
    backgroundColor: '#DC3545',
  },
  progressCard: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#0066CC',
  },
  medicationCard: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#28A745',
  },
  trendsCard: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#9B59B6',
  },
  addCard: {
    backgroundColor: '#F8FAFB',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  cardSubtitle: {
    marginTop: 4,
  },
  lastReadingText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  readingTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  progressInfo: {
    marginTop: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '500',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066CC',
    borderRadius: 2,
  },
  urgentBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  trendsInfo: {
    marginTop: 4,
  },
  trendsText: {
    fontSize: 12,
    color: '#9B59B6',
    fontWeight: '500',
  },
  avgText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 18,
    color: '#1F2937',
    textAlign: 'center',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeButtonActive: {
    backgroundColor: '#DC3545',
    borderColor: '#DC3545',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#DC3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});