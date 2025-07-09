import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  Dimensions,
  Image,
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Activity, Sparkles, ArrowRight, User, Stethoscope, Zap, Star } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  interpolate,
  runOnJS,
  withDelay,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';


const { width, height } = Dimensions.get('window');

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function AuthWelcomeScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | null>(null);
  
  // Animation values
  const logoScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const roleCardsScale = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  const sparkleRotation = useSharedValue(0);
  const heartBeat = useSharedValue(1);
  const activityPulse = useSharedValue(1);
  const backgroundShift = useSharedValue(0);

  React.useEffect(() => {
    // Entrance animations sequence
    logoScale.value = withSpring(1, { damping: 15, stiffness: 150 });
    
    titleOpacity.value = withDelay(200, withSpring(1));
    roleCardsScale.value = withDelay(400, withSpring(1, { damping: 12, stiffness: 100 }));
    buttonsOpacity.value = withDelay(600, withSpring(1));

    // Continuous animations
    sparkleRotation.value = withRepeat(
      withTiming(360, { duration: 8000 }),
      -1,
      false
    );

    heartBeat.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );

    activityPulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1200 }),
        withTiming(1, { duration: 1200 })
      ),
      -1,
      true
    );

    backgroundShift.value = withRepeat(
      withTiming(1, { duration: 10000 }),
      -1,
      true
    );
  }, []);

  const handleRoleSelect = (role: 'patient' | 'doctor') => {
    setSelectedRole(role);
    
    // Haptic feedback simulation for web
    if (Platform.OS === 'web') {
      // Visual feedback for web
      const element = document.querySelector(`[data-role="${role}"]`) as HTMLElement;
      if (element) {
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
          element.style.transform = 'scale(1)';
        }, 100);
      }
    }
  };

  const navigateToAuth = (screen: 'login' | 'register') => {
    // Store selected role for later use
    if (selectedRole) {
      AsyncStorage.setItem('selectedRole', selectedRole);
    }
    
    router.push(`/auth/${screen}`);
  };

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: interpolate(titleOpacity.value, [0, 1], [20, 0]) }],
  }));

  const roleCardsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: roleCardsScale.value,
    transform: [{ scale: roleCardsScale.value }],
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: interpolate(buttonsOpacity.value, [0, 1], [30, 0]) }],
  }));

  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotation.value}deg` }],
  }));

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartBeat.value }],
  }));

  const activityAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: activityPulse.value }],
  }));

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { 
        translateX: interpolate(
          backgroundShift.value,
          [0, 1],
          [0, 20]
        )
      }
    ],
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Background */}
      <Animated.View style={[styles.backgroundContainer, backgroundAnimatedStyle]}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=1200' }}
          style={styles.backgroundImage}
        />
        <View style={styles.backgroundOverlay} />
      </Animated.View>

      {/* Floating Sparkles */}
      <Animated.View style={[styles.sparkleContainer, sparkleAnimatedStyle]}>
        <Sparkles size={16} color="rgba(255, 255, 255, 0.6)" />
        <Sparkles size={12} color="rgba(255, 255, 255, 0.4)" />
        <Sparkles size={20} color="rgba(255, 255, 255, 0.5)" />
      </Animated.View>

      <View style={styles.content}>
        {/* Logo Section - Simplified and more spacious */}
        <Animated.View style={[styles.logoSection, logoAnimatedStyle]}>
          <View style={styles.logoContainer}>
            <Animated.View style={[styles.heartContainer, heartAnimatedStyle]}>
              <Heart size={56} color="#FF6B6B" fill="#FF6B6B" />
            </Animated.View>
            <Animated.View style={[styles.activityContainer, activityAnimatedStyle]}>
              <Activity size={36} color="#4ECDC4" />
            </Animated.View>
          </View>
          
          
        </Animated.View>

        {/* Role Selection */}
        <Animated.View style={[styles.roleSection, roleCardsAnimatedStyle]}>
          <Text style={styles.roleTitle}>Choose your journey</Text>
          
          <View style={styles.roleCards}>
            <TouchableOpacity
              data-role="patient"
              style={[
                styles.roleCard,
                styles.patientCard,
                selectedRole === 'patient' && styles.selectedCard
              ]}
              onPress={() => handleRoleSelect('patient')}
              activeOpacity={0.8}
            >
              <View style={styles.roleIconContainer}>
                <Heart size={32} color="#FF6B6B" />
                {selectedRole === 'patient' && (
                  <View style={styles.selectedBadge}>
                    <Star size={16} color="#FFD700" fill="#FFD700" />
                  </View>
                )}
              </View>
              <Text style={styles.roleCardTitle}>I'm a Patient</Text>
              <Text style={styles.roleCardDescription}>
                Monitor my health, get personalized insights, and prevent diabetes
              </Text>
              <View style={styles.roleCardFeatures}>
                <Text style={styles.featureText}>• Health assessments</Text>
                <Text style={styles.featureText}>• Risk predictions</Text>
                <Text style={styles.featureText}>• Personalized tips</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              data-role="doctor"
              style={[
                styles.roleCard,
                styles.doctorCard,
                selectedRole === 'doctor' && styles.selectedCard
              ]}
              onPress={() => handleRoleSelect('doctor')}
              activeOpacity={0.8}
            >
              <View style={styles.roleIconContainer}>
                <Stethoscope size={32} color="#4ECDC4" />
                {selectedRole === 'doctor' && (
                  <View style={styles.selectedBadge}>
                    <Star size={16} color="#FFD700" fill="#FFD700" />
                  </View>
                )}
              </View>
              <Text style={styles.roleCardTitle}>I'm a Healthcare Provider</Text>
              <Text style={styles.roleCardDescription}>
                Manage patients, analyze health data, and provide better care
              </Text>
              <View style={styles.roleCardFeatures}>
                <Text style={styles.featureText}>• Patient dashboard</Text>
                <Text style={styles.featureText}>• Health analytics</Text>
                <Text style={styles.featureText}>• Research insights</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View style={[styles.buttonSection, buttonsAnimatedStyle]}>
          <AnimatedTouchableOpacity
            style={[
              styles.primaryButton,
              !selectedRole && styles.disabledButton
            ]}
            onPress={() => navigateToAuth('login')}
            disabled={!selectedRole}
          >
            <Text style={[
              styles.primaryButtonText,
              !selectedRole && styles.disabledButtonText
            ]}>
              Sign In
            </Text>
            <ArrowRight size={20} color={selectedRole ? "white" : "#94A3B8"} />
          </AnimatedTouchableOpacity>

          <AnimatedTouchableOpacity
            style={[
              styles.secondaryButton,
              !selectedRole && styles.disabledButton
            ]}
            onPress={() => navigateToAuth('register')}
            disabled={!selectedRole}
          >
            <Zap size={20} color={selectedRole ? "#0066CC" : "#94A3B8"} />
            <Text style={[
              styles.secondaryButtonText,
              !selectedRole && styles.disabledButtonText
            ]}>
              Get Started
            </Text>
          </AnimatedTouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🇷🇼 Designed for Rwanda and beyond
          </Text>
          
          <TouchableOpacity 
            style={styles.backToOnboardingButton}
            onPress={async () => {
              try {
                await AsyncStorage.removeItem('hasSeenOnboarding');
              } catch (e) {
                console.error('Failed to remove onboarding status', e);
              }
              router.push('/onboarding');
            }}
          >
            <Text style={styles.backToOnboardingText}>← See Introduction Again</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: 'rgba(0, 102, 204, 0.85)',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 80,
    right: 30,
    flexDirection: 'row',
    gap: 20,
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  heartContainer: {
    marginRight: 12,
  },
  activityContainer: {
    position: 'absolute',
    right: -24,
    top: -12,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  roleSection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
    minHeight: 400,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 32,
  },
  roleCards: {
    gap: 20,
  },
  roleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  patientCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#FF6B6B',
  },
  doctorCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#4ECDC4',
  },
  selectedCard: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    transform: [{ scale: 1.02 }],
  },
  roleIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  selectedBadge: {
    position: 'absolute',
    right: -8,
    top: -8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
  roleCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  roleCardDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  roleCardFeatures: {
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '500',
  },
  buttonSection: {
    paddingTop: 32,
    paddingBottom: 20,
    gap: 20,
  },
  primaryButton: {
    backgroundColor: '#28A745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 60,
  },
  secondaryButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 8,
    minHeight: 60,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#0066CC',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#94A3B8',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
    gap: 16,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  backToOnboardingButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  backToOnboardingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
});
