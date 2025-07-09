import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Heart, Droplets, Pill, Activity, Calendar, Plus, TrendingUp, Clock, Target, Zap, X, CircleCheck as CheckCircle, Bell, ChartBar as BarChart3, Award, Settings, Download, Share, TriangleAlert as AlertTriangle, Trash2 } from 'lucide-react-native';
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

const { width } = Dimensions.get('window');

export default function DiabetesDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<DiabetesTask[]>([]);
  const [bloodSugarHistory, setBloodSugarHistory] = useState<BloodSugarReading[]>([]);
  const [medications, setMedications] = useState<MedicationReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'readings' | 'medications'>('overview');
  
  // Modal states
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
      await loadDiabetesData();
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

  const getCompletedTasksToday = () => {
    return tasks.filter(task => task.completed).length;
  };

  const getAverageBloodSugar = () => {
    if (bloodSugarHistory.length === 0) return 0;
    const total = bloodSugarHistory.reduce((sum, reading) => sum + reading.reading, 0);
    return Math.round(total / bloodSugarHistory.length);
  };

  const getReadingColor = (reading: number) => {
    if (reading < 70) return '#DC3545'; // Low
    if (reading > 180) return '#FFA500'; // High
    return '#28A745'; // Normal
  };

  const estimatedA1C = calculateA1CEstimate(bloodSugarHistory);
  const completedTasks = getCompletedTasksToday();
  const totalTasks = tasks.length;
  const averageBloodSugar = getAverageBloodSugar();
  const healthTips = getHealthTips();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DC3545" />
          <Text style={styles.loadingText}>Loading your diabetes dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#DC3545" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Diabetes Dashboard</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {(['overview', 'tasks', 'readings', 'medications'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.tabActive
            ]}
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            {/* Key Metrics */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Target size={24} color="#DC3545" />
                <Text style={styles.metricNumber}>
                  {bloodSugarHistory.length > 0 ? bloodSugarHistory[0].reading : '--'}
                </Text>
                <Text style={styles.metricLabel}>Latest Reading</Text>
                <Text style={styles.metricUnit}>mg/dL</Text>
              </View>

              <View style={styles.metricCard}>
                <TrendingUp size={24} color="#0066CC" />
                <Text style={styles.metricNumber}>
                  {estimatedA1C > 0 ? estimatedA1C.toFixed(1) : '--'}
                </Text>
                <Text style={styles.metricLabel}>Est. A1C</Text>
                <Text style={styles.metricUnit}>%</Text>
              </View>

              <View style={styles.metricCard}>
                <CheckCircle size={24} color="#28A745" />
                <Text style={styles.metricNumber}>{completedTasks}/{totalTasks}</Text>
                <Text style={styles.metricLabel}>Tasks Today</Text>
                <Text style={styles.metricUnit}>completed</Text>
              </View>

              <View style={styles.metricCard}>
                <BarChart3 size={24} color="#9B59B6" />
                <Text style={styles.metricNumber}>{averageBloodSugar || '--'}</Text>
                <Text style={styles.metricLabel}>30-Day Avg</Text>
                <Text style={styles.metricUnit}>mg/dL</Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity
                  style={[styles.quickActionCard, styles.primaryAction]}
                  onPress={() => setShowBloodSugarModal(true)}
                >
                  <Droplets size={24} color="white" />
                  <Text style={styles.quickActionText}>Log Blood Sugar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickActionCard, styles.secondaryAction]}
                  onPress={() => setShowMedicationModal(true)}
                >
                  <Pill size={24} color="#28A745" />
                  <Text style={[styles.quickActionText, { color: '#28A745' }]}>Add Medication</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Recent Readings Chart */}
            {bloodSugarHistory.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📈 Recent Readings</Text>
                <View style={styles.chartCard}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chart}>
                      {bloodSugarHistory.slice(0, 14).reverse().map((reading, index) => (
                        <View key={reading.id} style={styles.chartBar}>
                          <View 
                            style={[
                              styles.bar,
                              { 
                                height: Math.max(20, (reading.reading / 300) * 100),
                                backgroundColor: getReadingColor(reading.reading)
                              }
                            ]} 
                          />
                          <Text style={styles.barValue}>{reading.reading}</Text>
                          <Text style={styles.barDate}>
                            {new Date(reading.recorded_at).getDate()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            )}

            {/* Health Tips */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 Health Tips</Text>
              {healthTips.slice(0, 3).map((tip, index) => (
                <View key={index} style={styles.tipCard}>
                  <Zap size={16} color="#0066CC" />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'tasks' && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 Today's Tasks</Text>
              {tasks.map((task) => (
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
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskIcon}>{task.icon}</Text>
                      <View style={styles.taskDetails}>
                        <Text style={[
                          styles.taskTitle,
                          task.completed && styles.taskTitleCompleted
                        ]}>
                          {task.title}
                        </Text>
                        <Text style={styles.taskDescription}>{task.description}</Text>
                        {task.time && (
                          <Text style={styles.taskTime}>⏰ {task.time}</Text>
                        )}
                      </View>
                    </View>
                    {task.completed ? (
                      <CheckCircle size={24} color="#28A745" />
                    ) : (
                      <View style={styles.taskCheckbox} />
                    )}
                  </View>
                  {task.streak > 0 && (
                    <View style={styles.streakBadge}>
                      <Award size={16} color="#FFD700" />
                      <Text style={styles.streakText}>{task.streak} day streak!</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'readings' && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🩸 Blood Sugar History</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowBloodSugarModal(true)}
                >
                  <Plus size={20} color="#DC3545" />
                </TouchableOpacity>
              </View>
              
              {bloodSugarHistory.length === 0 ? (
                <View style={styles.emptyState}>
                  <Droplets size={48} color="#64748B" />
                  <Text style={styles.emptyTitle}>No readings yet</Text>
                  <Text style={styles.emptyText}>Start logging your blood sugar readings to track your progress</Text>
                </View>
              ) : (
                bloodSugarHistory.map((reading) => (
                  <View key={reading.id} style={styles.readingCard}>
                    <View style={styles.readingHeader}>
                      <View style={[
                        styles.readingIndicator,
                        { backgroundColor: getReadingColor(reading.reading) }
                      ]} />
                      <View style={styles.readingInfo}>
                        <Text style={styles.readingValue}>{reading.reading} mg/dL</Text>
                        <Text style={styles.readingType}>
                          {reading.reading_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Text>
                      </View>
                      <Text style={styles.readingDate}>
                        {new Date(reading.recorded_at).toLocaleDateString()}
                      </Text>
                    </View>
                    {reading.notes && (
                      <Text style={styles.readingNotes}>{reading.notes}</Text>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {activeTab === 'medications' && (
          <View style={styles.tabContent}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>💊 Medications</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowMedicationModal(true)}
                >
                  <Plus size={20} color="#28A745" />
                </TouchableOpacity>
              </View>
              
              {medications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Pill size={48} color="#64748B" />
                  <Text style={styles.emptyTitle}>No medications added</Text>
                  <Text style={styles.emptyText}>Add your medications to set up reminders</Text>
                </View>
              ) : (
                medications.map((medication) => (
                  <View key={medication.id} style={styles.medicationCard}>
                    <View style={styles.medicationHeader}>
                      <View style={styles.medicationIcon}>
                        <Pill size={20} color="#28A745" />
                      </View>
                      <View style={styles.medicationInfo}>
                        <Text style={styles.medicationName}>{medication.medication_name}</Text>
                        <Text style={styles.medicationDosage}>{medication.dosage}</Text>
                        <Text style={styles.medicationFrequency}>{medication.frequency}</Text>
                      </View>
                    </View>
                    <View style={styles.medicationTimes}>
                      {medication.times.map((time, index) => (
                        <View key={index} style={styles.timeChip}>
                          <Clock size={12} color="#64748B" />
                          <Text style={styles.timeText}>{time}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#DC3545',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#DC3545',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  metricCard: {
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
  metricNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  metricUnit: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryAction: {
    backgroundColor: '#DC3545',
  },
  secondaryAction: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#28A745',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingVertical: 20,
  },
  chartBar: {
    alignItems: 'center',
    minWidth: 30,
  },
  bar: {
    width: 20,
    borderRadius: 2,
    marginBottom: 8,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  barDate: {
    fontSize: 10,
    color: '#64748B',
  },
  tipCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  taskCard: {
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
  taskCompleted: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    color: '#15803D',
  },
  taskDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  taskTime: {
    fontSize: 12,
    color: '#0066CC',
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  readingCard: {
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
  readingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  readingInfo: {
    flex: 1,
  },
  readingValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  readingType: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  readingDate: {
    fontSize: 12,
    color: '#64748B',
  },
  readingNotes: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
    fontStyle: 'italic',
  },
  medicationCard: {
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
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  medicationDosage: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  medicationFrequency: {
    fontSize: 12,
    color: '#64748B',
  },
  medicationTimes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
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