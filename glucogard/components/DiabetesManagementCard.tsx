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
  ActivityIndicator,
} from 'react-native';
import { Heart, Plus, Clock, TrendingUp, Droplets, Pill, Activity, Target, Calendar, X, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Zap, Award } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import {
  getDailyTasks,
  completeTask,
  addBloodSugarReading,
  getBloodSugarHistory,
  addMedicationReminder,
  getMedicationReminders,
  getHealthTips,
  calculateA1CEstimate,
  initializeDiabetesTasks,
  type DiabetesTask,
  type BloodSugarReading,
  type MedicationReminder,
} from '@/lib/diabetes-management';

interface DiabetesManagementCardProps {
  riskCategory?: string;
}

export function DiabetesManagementCard({ riskCategory }: DiabetesManagementCardProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DiabetesTask[]>([]);
  const [bloodSugarHistory, setBloodSugarHistory] = useState<BloodSugarReading[]>([]);
  const [medications, setMedications] = useState<MedicationReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBloodSugarModal, setShowBloodSugarModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [bloodSugarReading, setBloodSugarReading] = useState('');
  const [readingType, setReadingType] = useState<'fasting' | 'post_meal' | 'bedtime' | 'random'>('fasting');
  const [notes, setNotes] = useState('');

  // Medication form state
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [medicationTimes, setMedicationTimes] = useState(['08:00']);

  useEffect(() => {
    if (user) {
      loadDiabetesData();
    }
  }, [user]);

  const loadDiabetesData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Initialize tasks if needed
      await initializeDiabetesTasks(user.id);
      
      // Load all data
      const [tasksData, historyData, medicationsData] = await Promise.all([
        getDailyTasks(user.id),
        getBloodSugarHistory(user.id, 30),
        getMedicationReminders(user.id),
      ]);

      setTasks(tasksData);
      setBloodSugarHistory(historyData);
      setMedications(medicationsData);
    } catch (error) {
      console.error('Error loading diabetes data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
      await loadDiabetesData(); // Refresh data
    } catch (error) {
      Alert.alert('Error', 'Failed to complete task');
    }
  };

  const handleAddBloodSugar = async () => {
    if (!user || !bloodSugarReading) return;

    try {
      const reading = parseFloat(bloodSugarReading);
      if (isNaN(reading) || reading < 20 || reading > 600) {
        Alert.alert('Invalid Reading', 'Please enter a valid blood sugar reading between 20-600 mg/dL');
        return;
      }

      await addBloodSugarReading(user.id, reading, readingType, notes);
      setShowBloodSugarModal(false);
      setBloodSugarReading('');
      setNotes('');
      await loadDiabetesData();
      
      Alert.alert('Success', 'Blood sugar reading recorded successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to record blood sugar reading');
    }
  };

  const handleAddMedication = async () => {
    if (!user || !medicationName || !dosage) return;

    try {
      await addMedicationReminder(user.id, medicationName, dosage, frequency, medicationTimes);
      setShowMedicationModal(false);
      setMedicationName('');
      setDosage('');
      setFrequency('');
      setMedicationTimes(['08:00']);
      await loadDiabetesData();
      
      Alert.alert('Success', 'Medication reminder added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add medication reminder');
    }
  };

  const getLatestReading = () => {
    return bloodSugarHistory.length > 0 ? bloodSugarHistory[0] : null;
  };

  const getCompletedTasksToday = () => {
    return tasks.filter(task => task.completed).length;
  };

  const getAverageBloodSugar = () => {
    if (bloodSugarHistory.length === 0) return 0;
    const total = bloodSugarHistory.reduce((sum, reading) => sum + reading.reading, 0);
    return Math.round(total / bloodSugarHistory.length);
  };

  const estimatedA1C = calculateA1CEstimate(bloodSugarHistory);
  const latestReading = getLatestReading();
  const completedTasks = getCompletedTasksToday();
  const totalTasks = tasks.length;
  const healthTips = getHealthTips(riskCategory);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading diabetes management...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Heart size={24} color="#DC3545" />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Diabetes Management</Text>
          <Text style={styles.headerSubtitle}>Your daily health companion</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <CheckCircle size={20} color="#28A745" />
          <Text style={styles.statNumber}>{completedTasks}/{totalTasks}</Text>
          <Text style={styles.statLabel}>Tasks Today</Text>
        </View>

        <View style={styles.statCard}>
          <Droplets size={20} color="#DC3545" />
          <Text style={styles.statNumber}>
            {latestReading ? latestReading.reading : '--'}
          </Text>
          <Text style={styles.statLabel}>Latest Reading</Text>
        </View>

        <View style={styles.statCard}>
          <TrendingUp size={20} color="#0066CC" />
          <Text style={styles.statNumber}>
            {estimatedA1C > 0 ? estimatedA1C.toFixed(1) : '--'}
          </Text>
          <Text style={styles.statLabel}>Est. A1C</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryAction]}
          onPress={() => setShowBloodSugarModal(true)}
        >
          <Droplets size={20} color="white" />
          <Text style={styles.actionButtonText}>Log Blood Sugar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryAction]}
          onPress={() => setShowMedicationModal(true)}
        >
          <Pill size={20} color="#0066CC" />
          <Text style={[styles.actionButtonText, { color: '#0066CC' }]}>Add Medication</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Tasks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Today's Tasks</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tasksScroll}
        >
          {tasks.slice(0, 6).map((task) => (
            <TouchableOpacity
              key={task.id}
              style={[
                styles.taskCard,
                task.completed && styles.taskCompleted
              ]}
              onPress={() => !task.completed && handleCompleteTask(task.id)}
              disabled={task.completed}
            >
              <View style={styles.taskHeader}>
                <Text style={styles.taskIcon}>{task.icon}</Text>
                {task.completed && (
                  <CheckCircle size={16} color="#28A745" />
                )}
              </View>
              <Text style={[
                styles.taskTitle,
                task.completed && styles.taskTitleCompleted
              ]}>
                {task.title}
              </Text>
              {task.streak > 0 && (
                <View style={styles.streakBadge}>
                  <Award size={12} color="#FFD700" />
                  <Text style={styles.streakText}>{task.streak}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Health Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Health Tips</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tipsScroll}
        >
          {healthTips.map((tip, index) => (
            <View key={index} style={styles.tipCard}>
              <Zap size={16} color="#0066CC" />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Blood Sugar Modal */}
      <Modal
        visible={showBloodSugarModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBloodSugarModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Blood Sugar</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowBloodSugarModal(false)}
            >
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Blood Sugar Reading (mg/dL)</Text>
              <TextInput
                style={styles.textInput}
                value={bloodSugarReading}
                onChangeText={setBloodSugarReading}
                placeholder="Enter reading"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reading Type</Text>
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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any notes about this reading..."
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddBloodSugar}
            >
              <Text style={styles.submitButtonText}>Save Reading</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Medication Modal */}
      <Modal
        visible={showMedicationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMedicationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Medication Reminder</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowMedicationModal(false)}
            >
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Medication Name</Text>
              <TextInput
                style={styles.textInput}
                value={medicationName}
                onChangeText={setMedicationName}
                placeholder="e.g., Metformin"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dosage</Text>
              <TextInput
                style={styles.textInput}
                value={dosage}
                onChangeText={setDosage}
                placeholder="e.g., 500mg"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Frequency</Text>
              <TextInput
                style={styles.textInput}
                value={frequency}
                onChangeText={setFrequency}
                placeholder="e.g., Twice daily"
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddMedication}
            >
              <Text style={styles.submitButtonText}>Add Reminder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryAction: {
    backgroundColor: '#DC3545',
  },
  secondaryAction: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#0066CC',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  tasksScroll: {
    flexDirection: 'row',
  },
  taskCard: {
    width: 120,
    backgroundColor: '#F8FAFB',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  taskCompleted: {
    backgroundColor: '#D1FAE5',
    borderColor: '#28A745',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskIcon: {
    fontSize: 20,
  },
  taskTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E293B',
    lineHeight: 16,
  },
  taskTitleCompleted: {
    color: '#065F46',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  streakText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  tipsScroll: {
    flexDirection: 'row',
  },
  tipCard: {
    width: 200,
    backgroundColor: '#EBF4FF',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#1E293B',
    lineHeight: 16,
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
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
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
    backgroundColor: '#0066CC',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});