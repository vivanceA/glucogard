import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Heart, Shield, MapPin, Brain, ChevronRight, ChevronLeft, Sparkles, Activity, Users } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  runOnJS,
  withRepeat,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  gradient: string[];
  image: string;
  animation: 'bounce' | 'pulse' | 'rotate' | 'scale';
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Welcome to GlucoGard AI',
    subtitle: 'Your Smart Health Companion',
    description: 'Take control of your health with AI-powered diabetes risk assessment and personalized recommendations.',
    icon: Heart,
    color: '#FF6B6B',
    gradient: ['#FF6B6B', '#FF8E8E'],
    image: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800',
    animation: 'pulse'
  },
  {
    id: 2,
    title: 'Smart Health Assessment',
    subtitle: 'Adaptive & Personalized',
    description: 'Our AI questionnaire adapts to your responses, making health assessment quick, relevant, and engaging.',
    icon: Brain,
    color: '#4ECDC4',
    gradient: ['#4ECDC4', '#6EE7E0'],
    image: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=800',
    animation: 'bounce'
  },
  {
    id: 3,
    title: 'Location-Based Care',
    subtitle: 'Find Help Nearby',
    description: 'Discover nearby health centers, clinics, and resources tailored to your location and specific needs.',
    icon: MapPin,
    color: '#45B7D1',
    gradient: ['#45B7D1', '#6BC5E0'],
    image: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800',
    animation: 'rotate'
  },
  {
    id: 4,
    title: 'Community & Research',
    subtitle: 'Making a Difference Together',
    description: 'Join a community working to improve diabetes prevention in Rwanda and contribute to meaningful research.',
    icon: Users,
    color: '#9B59B6',
    gradient: ['#9B59B6', '#B574D1'],
    image: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800',
    animation: 'scale'
  },
  {
    id: 5,
    title: 'Privacy & Security',
    subtitle: 'Your Data is Safe',
    description: 'We protect your health data with industry-standard encryption and comply with Rwanda\'s privacy laws.',
    icon: Shield,
    color: '#96CEB4',
    gradient: ['#96CEB4', '#B5E7C7'],
    image: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800',
    animation: 'pulse'
  }
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  // Animation values for each slide element
  const titleOpacity = useSharedValue(1);
  const subtitleOpacity = useSharedValue(1);
  const descriptionOpacity = useSharedValue(1);
  const imageScale = useSharedValue(1);

  useEffect(() => {
    // Animate progress bar
    progressWidth.value = withSpring((currentIndex + 1) / slides.length);
    
    // Animate slide content entrance
    titleOpacity.value = withSequence(
      withTiming(0, { duration: 150 }),
      withDelay(100, withSpring(1))
    );
    subtitleOpacity.value = withSequence(
      withTiming(0, { duration: 150 }),
      withDelay(200, withSpring(1))
    );
    descriptionOpacity.value = withSequence(
      withTiming(0, { duration: 150 }),
      withDelay(300, withSpring(1))
    );
    imageScale.value = withSequence(
      withTiming(0.8, { duration: 150 }),
      withDelay(100, withSpring(1))
    );

    // Icon animations based on slide type
    const currentSlide = slides[currentIndex];
    switch (currentSlide.animation) {
      case 'bounce':
        iconScale.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: 800 }),
            withTiming(1, { duration: 800 })
          ),
          -1,
          true
        );
        break;
      case 'pulse':
        iconScale.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: 1000 }),
            withTiming(1, { duration: 1000 })
          ),
          -1,
          true
        );
        break;
      case 'rotate':
        iconRotation.value = withRepeat(
          withTiming(360, { duration: 3000 }),
          -1,
          false
        );
        break;
      case 'scale':
        iconScale.value = withRepeat(
          withSequence(
            withTiming(1.3, { duration: 600 }),
            withTiming(1, { duration: 600 })
          ),
          -1,
          true
        );
        break;
    }

    // Sparkle animation
    sparkleOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
      ),
      -1,
      true
    );
  }, [currentIndex]);

  const goToNext = async () => {
    if (currentIndex < slides.length - 1) {
      // Animate slide transition
      translateX.value = withSpring(-width, {}, () => {
        runOnJS(setCurrentIndex)(currentIndex + 1);
        translateX.value = withSpring(0);
      });
    } else {
      // Navigate to auth
      
      // Final animation before navigation
      scale.value = withSequence(
        withTiming(1.1, { duration: 200 }),
        withTiming(0.95, { duration: 200 }),
        withTiming(1, { duration: 200 }, () => {
          runOnJS(router.replace)('/auth');
        })
      );
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      translateX.value = withSpring(width, {}, () => {
        runOnJS(setCurrentIndex)(currentIndex - 1);
        translateX.value = withSpring(0);
      });
    }
  };

  const skip = async () => {
    
    scale.value = withTiming(0.9, { duration: 150 }, () => {
      runOnJS(router.replace)('/auth');
    });
  };

  // Gesture handling for swipe navigation
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const shouldGoNext = event.translationX < -width * 0.3 && event.velocityX < -500;
      const shouldGoPrevious = event.translationX > width * 0.3 && event.velocityX > 500;

      if (shouldGoNext && currentIndex < slides.length - 1) {
        translateX.value = withSpring(-width, {}, () => {
          runOnJS(setCurrentIndex)(currentIndex + 1);
          translateX.value = withSpring(0);
        });
      } else if (shouldGoPrevious && currentIndex > 0) {
        translateX.value = withSpring(width, {}, () => {
          runOnJS(setCurrentIndex)(currentIndex - 1);
          translateX.value = withSpring(0);
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value }
    ],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` }
    ],
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const animatedSparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }));

  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: interpolate(titleOpacity.value, [0, 1], [20, 0]) }],
  }));

  const animatedSubtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: interpolate(subtitleOpacity.value, [0, 1], [20, 0]) }],
  }));

  const animatedDescriptionStyle = useAnimatedStyle(() => ({
    opacity: descriptionOpacity.value,
    transform: [{ translateY: interpolate(descriptionOpacity.value, [0, 1], [20, 0]) }],
  }));

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  const currentSlide = slides[currentIndex];
  const IconComponent = currentSlide.icon;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentSlide.gradient[0] }]}>
      {/* Animated Background Gradient */}
      <Animated.View 
        style={[
          styles.gradientBackground,
          {
            backgroundColor: currentSlide.gradient[0],
          }
        ]}
      />

      {/* Header with Skip and Progress */}
      <View style={styles.header}>
        <TouchableOpacity onPress={skip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
          </View>
          <Text style={styles.progressText}>{currentIndex + 1}/{slides.length}</Text>
        </View>
      </View>

      {/* Sparkles decoration */}
      <Animated.View style={[styles.sparkleContainer, animatedSparkleStyle]}>
        <Sparkles size={16} color="rgba(255, 255, 255, 0.6)" />
        <Sparkles size={12} color="rgba(255, 255, 255, 0.4)" />
        <Sparkles size={20} color="rgba(255, 255, 255, 0.5)" />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.slideContainer, animatedContainerStyle]}>
          {/* Image Section */}
          <View style={styles.imageSection}>
            <Animated.View style={[styles.imageContainer, animatedImageStyle]}>
              <Image source={{ uri: currentSlide.image }} style={styles.slideImage} />
              
              {/* Animated Icon Overlay */}
              <Animated.View style={[styles.iconOverlay, animatedIconStyle]}>
                <View style={[styles.iconBackground, { backgroundColor: currentSlide.color }]}>
                  <IconComponent size={32} color="white" />
                </View>
              </Animated.View>
            </Animated.View>
          </View>
          
          {/* Content Section */}
          <View style={styles.contentSection}>
            <Animated.Text style={[styles.title, animatedTitleStyle]}>
              {currentSlide.title}
            </Animated.Text>
            
            <Animated.Text style={[styles.subtitle, animatedSubtitleStyle]}>
              {currentSlide.subtitle}
            </Animated.Text>
            
            <Animated.Text style={[styles.description, animatedDescriptionStyle]}>
              {currentSlide.description}
            </Animated.Text>
          </View>
        </Animated.View>
      </GestureDetector>

      {/* Navigation Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={goToPrevious}
          style={[styles.navButton, { opacity: currentIndex === 0 ? 0.3 : 1 }]}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={24} color="#666" />
        </TouchableOpacity>

        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentIndex ? currentSlide.color : 'rgba(255, 255, 255, 0.3)',
                  transform: [{ scale: index === currentIndex ? 1.2 : 1 }],
                }
              ]}
            />
          ))}
        </View>

        <AnimatedTouchableOpacity
          onPress={goToNext}
          style={[styles.nextButton, { backgroundColor: currentSlide.color }]}
        >
          {currentIndex === slides.length - 1 ? (
            <>
              <Text style={styles.nextButtonText}>Get Started</Text>
              <Activity size={20} color="white" />
            </>
          ) : (
            <>
              <Text style={styles.nextButtonText}>Next</Text>
              <ChevronRight size={20} color="white" />
            </>
          )}
        </AnimatedTouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 20,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    width: 100,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 120,
    right: 30,
    flexDirection: 'row',
    gap: 20,
  },
  slideContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  imageSection: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  slideImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  iconOverlay: {
    position: 'absolute',
    bottom: -20,
    right: -20,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: 'white',
  },
  contentSection: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 20,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
