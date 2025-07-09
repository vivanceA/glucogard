import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, LogOut, CreditCard as Edit3, Save, X, Heart, Stethoscope, Mail, Calendar, Shield, Settings, Bell, Globe, Database, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  saveResearchPreferences,
  getResearchPreferences,
  type ResearchPreferences 
} from '@/lib/research';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [showSettings, setShowSettings] = useState(false);
  
  // Research preferences
  const [researchPrefs, setResearchPrefs] = useState<ResearchPreferences>({
    participateInResearch: false,
    allowAnonymousDataExport: false,
    allowTrendAnalysis: false,
    allowPublicHealthReporting: false,
  });

  React.useEffect(() => {
    loadResearchPreferences();
  }, []);

  const loadResearchPreferences = async () => {
    if (user) {
      const preferences = await getResearchPreferences(user.id);
      if (preferences) {
        setResearchPrefs(preferences);
      }
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await signOut(); // This function is from useAuth context
              // The router.replace is now handled inside the signOut function
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      setEditing(false);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('user_id', user!.id);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFullName(user?.full_name || '');
    setEditing(false);
  };

  const updateResearchPreferences = async (newPrefs: ResearchPreferences) => {
    if (!user) return;

    try {
      setResearchPrefs(newPrefs);
      await saveResearchPreferences(user.id, newPrefs);
      Alert.alert('Success', 'Research preferences updated successfully');
    } catch (error) {
      console.error('Error updating research preferences:', error);
      Alert.alert('Error', 'Failed to update research preferences');
    }
  };

  const showDataPrivacyInfo = () => {
    Alert.alert(
      'Data Privacy',
      'Your health data is protected according to Rwanda\'s Law No. 058/2021 on the protection of personal data and privacy. We use industry-standard encryption and never share identifiable information without your explicit consent.',
      [{ text: 'OK' }]
    );
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  const getRoleIcon = () => {
    return user.role === 'doctor' ? (
      <Stethoscope size={24} color="#0066CC" />
    ) : (
      <Heart size={24} color="#0066CC" />
    );
  };

  const getRoleLabel = () => {
    return user.role === 'doctor' ? 'Healthcare Provider' : 'Patient';
  };

  const getRoleBadgeColor = () => {
    return user.role === 'doctor' ? '#E8F4FD' : '#FFF0F6';
  };

  const getRoleTextColor = () => {
    return user.role === 'doctor' ? '#0066CC' : '#E91E63';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{showSettings ? 'Settings' : 'Profile'}</Text>
        {!showSettings && !editing && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditing(true)}
          >
            <Edit3 size={20} color="#0066CC" />
          </TouchableOpacity>
        )}
        {!editing && (
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowSettings(!showSettings)}
          >
            <Settings size={20} color="#0066CC" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!showSettings ? (
          <>
            {/* Profile Section */}
            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <User size={48} color="#0066CC" />
                </View>
                <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor() }]}>
                  {getRoleIcon()}
                </View>
              </View>

              <View style={styles.profileInfo}>
                {editing ? (
                  <View style={styles.editingContainer}>
                    <TextInput
                      style={styles.nameInput}
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Enter your full name"
                      autoFocus
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancelEdit}
                      >
                        <X size={16} color="#64748B" />
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                        onPress={handleSaveProfile}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <>
                            <Save size={16} color="white" />
                            <Text style={styles.saveButtonText}>Save</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={styles.userName}>{user.full_name}</Text>
                    <View style={styles.roleContainer}>
                      <Text style={[styles.roleText, { color: getRoleTextColor() }]}>
                        {getRoleLabel()}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Account Information */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Account Information</Text>
              
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Mail size={20} color="#64748B" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email Address</Text>
                    <Text style={styles.infoValue}>{user.email}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Shield size={20} color="#64748B" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Account Type</Text>
                    <Text style={styles.infoValue}>{getRoleLabel()}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Calendar size={20} color="#64748B" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Member Since</Text>
                    <Text style={styles.infoValue}>
                      {new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Sign Out */}
            <View style={styles.actionsSection}>
              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <LogOut size={20} color="#DC3545" />
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Settings Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Bell size={20} color="#0066CC" />
                <Text style={styles.sectionTitle}>Notifications</Text>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Health Reminders</Text>
                    <Text style={styles.settingDescription}>
                      Get notified about health check-ups and assessments
                    </Text>
                  </View>
                  <Switch
                    value={true}
                    trackColor={{ false: '#E2E8F0', true: '#0066CC' }}
                    thumbColor="white"
                  />
                </View>
              </View>
            </View>

            {/* Language Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Globe size={20} color="#0066CC" />
                <Text style={styles.sectionTitle}>Language / Ururimi</Text>
              </View>

              <TouchableOpacity style={styles.settingCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>English</Text>
                    <Text style={styles.settingDescription}>Current language</Text>
                  </View>
                  <ChevronRight size={20} color="#64748B" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Research & Public Health Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Database size={20} color="#0066CC" />
                <Text style={styles.sectionTitle}>Research & Public Health</Text>
              </View>

              <View style={styles.settingCard}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Participate in Research</Text>
                    <Text style={styles.settingDescription}>
                      Help improve diabetes prevention in Rwanda
                    </Text>
                  </View>
                  <Switch
                    value={researchPrefs.participateInResearch}
                    onValueChange={(value) =>
                      updateResearchPreferences({ ...researchPrefs, participateInResearch: value })
                    }
                    trackColor={{ false: '#E2E8F0', true: '#28A745' }}
                    thumbColor="white"
                  />
                </View>

                {researchPrefs.participateInResearch && (
                  <>
                    <View style={styles.divider} />

                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>Anonymous Data Export</Text>
                        <Text style={styles.settingDescription}>
                          Allow anonymized health data for research
                        </Text>
                      </View>
                      <Switch
                        value={researchPrefs.allowAnonymousDataExport}
                        onValueChange={(value) =>
                          updateResearchPreferences({ ...researchPrefs, allowAnonymousDataExport: value })
                        }
                        trackColor={{ false: '#E2E8F0', true: '#28A745' }}
                        thumbColor="white"
                      />
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Privacy & Security Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Shield size={20} color="#0066CC" />
                <Text style={styles.sectionTitle}>Privacy & Security</Text>
              </View>

              <TouchableOpacity style={styles.settingCard} onPress={showDataPrivacyInfo}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Data Privacy Policy</Text>
                    <Text style={styles.settingDescription}>
                      Learn how we protect your data
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#64748B" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Sign Out in Settings */}
            <View style={styles.actionsSection}>
              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <LogOut size={20} color="#DC3545" />
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>GlucoGard AI</Text>
          <Text style={styles.footerSubtext}>
            Empowering health decisions in Rwanda and beyond
          </Text>
          
          {/* Doctor Access Link in Footer */}
          {user.role === 'patient' && (
          <TouchableOpacity 
            style={styles.doctorAccessButton}
            onPress={() => router.push('/auth/register')}
          >
            <Stethoscope size={16} color="#64748B" />
            <Text style={styles.doctorAccessText}>Healthcare Provider Access</Text>
          </TouchableOpacity>
          )}
          
          {/* Research Portal Link for Doctors */}
          {user.role === 'doctor' && (
            <TouchableOpacity 
              style={styles.doctorAccessButton}
              onPress={() => router.push('/(tabs)/research')}
            >
              <Database size={16} color="#64748B" />
              <Text style={styles.doctorAccessText}>Research Portal</Text>
            </TouchableOpacity>
          )}
        </View>
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
    backgroundColor: '#F8FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  roleContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  editingContainer: {
    width: '100%',
    alignItems: 'center',
  },
  nameInput: {
    backgroundColor: '#F8FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    width: '100%',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  cancelButtonText: {
    color: '#64748B',
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0066CC',
    gap: 6,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIconContainer: {
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  actionsSection: {
    marginBottom: 32,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DC3545',
    gap: 8,
  },
  signOutButtonText: {
    color: '#DC3545',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066CC',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  doctorAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFB',
    gap: 6,
  },
  doctorAccessText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  settingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 18,
  },
});