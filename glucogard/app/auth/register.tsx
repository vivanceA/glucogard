import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Eye, EyeOff, User, Mail, Lock, Zap, Heart, Stethoscope, CircleCheck as CheckCircle, Sparkles, Star, Trophy } from 'lucide-react-native';
import { signUp, type UserRole } from '@/lib/auth';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  interpolate,
  withDelay,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [currentStep, setCurrentStep] = useState(0);

  // Focus states
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  // Animation values
  const headerScale = useSharedValue(0);
  const formOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0);
  const sparkleRotation = useSharedValue(0);
  const roleIconPulse = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  const stepIndicatorScale = useSharedValue(1);

  const steps = [
    { title: 'Personal Info', fields: ['fullName'] },
    { title: 'Account Details', fields: ['email'] },
    { title: 'Security', fields: ['password', 'confirmPassword'] },
  ];

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const role = (await AsyncStorage.getItem('selectedRole')) as UserRole | null;
        setSelectedRole(role || 'patient');
      } catch (e) {
        console.error('Failed to fetch role from storage', e);
        setSelectedRole('patient');
      }
    };

    fetchRole();

    // Entrance animations
    headerScale.value = withSpring(1, { damping: 15, stiffness: 150 });
    formOpacity.value = withDelay(200, withSpring(1));
    buttonScale.value = withDelay(400, withSpring(1));

    // Continuous animations
    sparkleRotation.value = withRepeat(
      withTiming(360, { duration: 6000 }),
      -1,
      false
    );

    roleIconPulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    // Update progress based on form completion
    const validations = {
      fullName: fullName.trim().length >= 2,
      email: email.includes('@') && email.includes('.'),
      password: password.length >= 6,
      confirmPassword: confirmPassword === password && password.length >= 6,
    };

    const completedFields = Object.values(validations).filter(Boolean).length;
    const progress = (completedFields / 4) * 100;
    
    progressWidth.value = withSpring(progress);

    // Auto-advance steps
    if (validations.fullName && currentStep === 0) {
      setTimeout(() => setCurrentStep(1), 500);
    } else if (validations.email && currentStep === 1) {
      setTimeout(() => setCurrentStep(2), 500);
    }
  }, [fullName, email, password, confirmPassword, currentStep]);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, fullName, selectedRole);
      
      // Success animation
      buttonScale.value = withSequence(
        withTiming(1.1, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
      
      Alert.alert('Success', 'Account created successfully!', [
        { text: 'Sign In', onPress: () => router.push('/auth/login') }
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create account');
      cancelAnimation(buttonScale);
      
      // Error shake animation
      buttonScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withTiming(1.05, { duration: 100 }),
        withTiming(0.95, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = () => {
    if (selectedRole === 'doctor') {
      return <Stethoscope size={24} color="#4ECDC4" />;
    }
    return <Heart size={24} color="#FF6B6B" />;
  };

  const getRoleColor = () => {
    return selectedRole === 'doctor' ? '#4ECDC4' : '#FF6B6B';
  };

  const getRoleLabel = () => {
    return selectedRole === 'doctor' ? 'Healthcare Provider' : 'Patient';
  };

  const isFormValid = () => {
    return fullName.trim().length >= 2 &&
           email.includes('@') &&
           password.length >= 6 &&
           confirmPassword === password;
  };

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
    opacity: headerScale.value,
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: interpolate(formOpacity.value, [0, 1], [30, 0]) }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotation.value}deg` }],
  }));

  const roleIconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: roleIconPulse.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const stepIndicatorAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: stepIndicatorScale.value }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Background */}
      <View style={styles.backgroundContainer}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=1200' }}
          style={styles.backgroundImage}
        />
        <View style={[styles.backgroundOverlay, { backgroundColor: `${getRoleColor()}E6` }]} />
      </View>

      {/* Floating Sparkles */}
      <Animated.View style={[styles.sparkleContainer, sparkleAnimatedStyle]}>
        <Sparkles size={16} color="rgba(255, 255, 255, 0.6)" />
        <Sparkles size={12} color="rgba(255, 255, 255, 0.4)" />
        <Sparkles size={20} color="rgba(255, 255, 255, 0.5)" />
      </Animated.View>

      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Animated.View style={[styles.roleIconContainer, roleIconAnimatedStyle]}>
            {getRoleIcon()}
          </Animated.View>
          <Text style={styles.headerTitle}>Join GlucoGard!</Text>
          <Text style={styles.headerSubtitle}>
            Create your {getRoleLabel()} account
          </Text>
        </View>
      </Animated.View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
        </Text>
      </View>

      {/* Step Indicators */}
      <Animated.View style={[styles.stepIndicators, stepIndicatorAnimatedStyle]}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepIndicator}>
            <View style={[
              styles.stepCircle,
              index <= currentStep && styles.stepCircleActive,
              index < currentStep && styles.stepCircleCompleted
            ]}>
              {index < currentStep ? (
                <CheckCircle size={16} color="white" />
              ) : (
                <Text style={[
                  styles.stepNumber,
                  index <= currentStep && styles.stepNumberActive
                ]}>
                  {index + 1}
                </Text>
              )}
            </View>
            <Text style={[
              styles.stepLabel,
              index <= currentStep && styles.stepLabelActive
            ]}>
              {step.title}
            </Text>
          </View>
        ))}
      </Animated.View>

      {/* Form */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
          <View style={styles.form}>
            {/* Step 1: Personal Info */}
            {currentStep >= 0 && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={[
                  styles.inputContainer,
                  nameFocused && styles.inputContainerFocused,
                  fullName.trim().length >= 2 && styles.inputContainerValid
                ]}>
                  <User size={20} color={nameFocused ? getRoleColor() : '#64748B'} />
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#94A3B8"
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                  />
                  {fullName.trim().length >= 2 && (
                    <CheckCircle size={20} color="#28A745" />
                  )}
                </View>
              </View>
            )}

            {/* Step 2: Account Details */}
            {currentStep >= 1 && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={[
                  styles.inputContainer,
                  emailFocused && styles.inputContainerFocused,
                  email.includes('@') && styles.inputContainerValid
                ]}>
                  <Mail size={20} color={emailFocused ? getRoleColor() : '#64748B'} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                  {email.includes('@') && (
                    <CheckCircle size={20} color="#28A745" />
                  )}
                </View>
              </View>
            )}

            {/* Step 3: Security */}
            {currentStep >= 2 && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={[
                    styles.inputContainer,
                    passwordFocused && styles.inputContainerFocused,
                    password.length >= 6 && styles.inputContainerValid
                  ]}>
                    <Lock size={20} color={passwordFocused ? getRoleColor() : '#64748B'} />
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Create a password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#64748B" />
                      ) : (
                        <Eye size={20} color="#64748B" />
                      )}
                    </TouchableOpacity>
                    {password.length >= 6 && (
                      <CheckCircle size={20} color="#28A745" />
                    )}
                  </View>
                  <Text style={styles.passwordHint}>
                    At least 6 characters
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={[
                    styles.inputContainer,
                    confirmPasswordFocused && styles.inputContainerFocused,
                    confirmPassword === password && password.length >= 6 && styles.inputContainerValid
                  ]}>
                    <Lock size={20} color={confirmPasswordFocused ? getRoleColor() : '#64748B'} />
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm your password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showConfirmPassword}
                      onFocus={() => setConfirmPasswordFocused(true)}
                      onBlur={() => setConfirmPasswordFocused(false)}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} color="#64748B" />
                      ) : (
                        <Eye size={20} color="#64748B" />
                      )}
                    </TouchableOpacity>
                    {confirmPassword === password && password.length >= 6 && (
                      <CheckCircle size={20} color="#28A745" />
                    )}
                  </View>
                </View>
              </>
            )}

            {/* Success Message */}
            {isFormValid() && (
              <View style={styles.successMessage}>
                <Trophy size={24} color="#FFD700" />
                <Text style={styles.successText}>
                  Great! You're ready to create your account
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <AnimatedTouchableOpacity
          style={[
            styles.registerButton,
            { backgroundColor: getRoleColor() },
            !isFormValid() && styles.disabledButton,
            buttonAnimatedStyle
          ]}
          onPress={handleRegister}
          disabled={loading || !isFormValid()}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Star size={20} color="white" />
              <Text style={styles.registerButtonText}>Create Account</Text>
            </>
          )}
        </AnimatedTouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.loginLinkText}>
            Already have an account? <Text style={[styles.loginLinkBold, { color: getRoleColor() }]}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🔒 By creating an account, you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0066CC',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkleContainer: {
    position: 'absolute',
    top: 100,
    right: 30,
    flexDirection: 'row',
    gap: 20,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 20,
    zIndex: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
    zIndex: 2,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 20,
    zIndex: 2,
  },
  stepIndicator: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  stepCircleCompleted: {
    backgroundColor: '#28A745',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  stepNumberActive: {
    color: 'white',
  },
  stepLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: 'white',
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
    zIndex: 2,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
  },
  inputContainerFocused: {
    borderColor: '#0066CC',
    backgroundColor: 'white',
  },
  inputContainerValid: {
    borderColor: '#28A745',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  eyeButton: {
    padding: 4,
  },
  passwordHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: '#15803D',
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 16,
    zIndex: 2,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.1,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  loginLinkText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  loginLinkBold: {
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: 24,
    zIndex: 2,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 16,
  },
});
