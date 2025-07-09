import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, ArrowRight, ArrowLeft, CircleCheck as CheckCircle, Star, Trophy, Target, Zap, Brain, Activity } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { simulateRiskPrediction, generateSimulatedRecommendations } from '@/lib/assessment-simulation';
import { 
  ADAPTIVE_QUESTIONNAIRE, 
  getNextQuestion, 
  calculateProgress,
  validateAnswer,
  type Question,
  type QuestionOption 
} from '@/lib/questionnaire';

const { width, height } = Dimensions.get('window');

interface GameState {
  currentQuestion: Question | null;
  answers: Record<string, any>;
  progress: number;
  score: number;
  streak: number;
  badges: string[];
}

export default function AssessmentScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    currentQuestion: null,
    answers: {},
    progress: 0,
    score: 0,
    streak: 0,
    badges: []
  });
  
  // Animation values
  const [slideAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [progressAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    initializeAssessment();
  }, []);

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: gameState.progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [gameState.progress]);

  const initializeAssessment = () => {
    const firstQuestion = ADAPTIVE_QUESTIONNAIRE.questions.find(
      q => q.id === ADAPTIVE_QUESTIONNAIRE.startQuestionId
    );
    
    setGameState(prev => ({
      ...prev,
      currentQuestion: firstQuestion || null
    }));
    
    animateQuestionEntry();
  };

  const animateQuestionEntry = () => {
    slideAnim.setValue(width);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const animateQuestionExit = (callback: () => void) => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(callback);
  };

  const celebrateAnswer = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleAnswer = (value: any, option?: QuestionOption) => {
    if (!gameState.currentQuestion) return;

    celebrateAnswer();

    const newAnswers = {
      ...gameState.answers,
      [gameState.currentQuestion.id]: value
    };

    // Calculate new score and streak
    const newScore = gameState.score + 10;
    const newStreak = gameState.streak + 1;
    const newBadges = [...gameState.badges];

    // Award badges based on progress
    if (newStreak === 5 && !newBadges.includes('streak-5')) {
      newBadges.push('streak-5');
    }
    if (newStreak === 10 && !newBadges.includes('streak-10')) {
      newBadges.push('streak-10');
    }

    const newProgress = calculateProgress(
      gameState.currentQuestion.id,
      newAnswers,
      ADAPTIVE_QUESTIONNAIRE
    );

    setTimeout(() => {
      animateQuestionExit(() => {
        const nextQuestion = getNextQuestion(
          gameState.currentQuestion!.id,
          option || null,
          newAnswers,
          ADAPTIVE_QUESTIONNAIRE
        );

        if (nextQuestion) {
          setGameState({
            currentQuestion: nextQuestion,
            answers: newAnswers,
            progress: newProgress,
            score: newScore,
            streak: newStreak,
            badges: newBadges
          });
          animateQuestionEntry();
        } else {
          // Assessment complete
          completeAssessment(newAnswers);
        }
      });
    }, 500);
  };

  const completeAssessment = async (finalAnswers: Record<string, any>) => {
    setLoading(true);
    try {
      // Get patient ID
      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!patientData) {
        throw new Error('Patient record not found');
      }

      // Create health submission
      const { data: submission, error: submissionError } = await supabase
        .from('health_submissions')
        .insert({
          patient_id: patientData.id,
          answers: finalAnswers,
          status: 'pending',
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

      // Generate risk prediction
      const predictionResult = await getApiRiskPrediction(finalAnswers);

      // Create risk prediction
      const { error: predictionError } = await supabase
        .from('risk_predictions')
        .insert({
          submission_id: submission.id,
          risk_score: predictionResult.risk_level,
          risk_category: predictionResult.risk_category,
          raw_prediction: predictionResult
        });

      if (predictionError) throw predictionError;

      // Create recommendations
      const recommendations = generateRecommendations(finalAnswers, predictionResult.risk_category);
      if (recommendations.length > 0) {
        const { error: recommendationError } = await supabase
          .from('recommendations')
          .insert(
            recommendations.map(rec => ({
              submission_id: submission.id,
              content: rec.content,
              type: rec.type,
            }))
          );

        if (recommendationError) throw recommendationError;
      }

      // Show completion celebration
      showCompletionCelebration();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      router.replace('/(tabs)/ResultsScreen');
    }
  };

  const showCompletionCelebration = () => {
  };

  const getApiRiskPrediction = async (answers: Record<string, any>) => {
    const heightInMeters = (answers.height || 0) / 100;
    const bmi = heightInMeters > 0 ? (answers.weight || 0) / (heightInMeters * heightInMeters) : 0;

    const apiPayload = {
      age: answers.age || 0,
      bmi: bmi,
      weight: answers.weight || 0,
      height: answers.height || 0,
      systolic_bp: answers.systolic_bp || 0,
      family_history: answers['family-history'] === 'yes' ? 1 : 0,
      physical_activity: ['sedentary', 'light', 'moderate', 'active'].indexOf(answers['activity-level'] || 'sedentary'),
      diet_quality: answers.diet_quality || 5,
      location: answers.location === 'urban' ? 1 : 0,
      smoking: ['never', 'former', 'current'].indexOf(answers.smoking || 'never'),
    };

    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${apiUrl}/predict-risk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Real AI API response received:', result);
      return result;
    } catch (error) {
      console.warn('⚠️ Real AI API unavailable, using simulation:', error);
      
      // Use simulated prediction when real API fails
      const simulatedResult = simulateRiskPrediction(answers);
      console.log('🤖 Using simulated prediction:', simulatedResult);
      
      return simulatedResult;
    }
  };

  const generateRecommendations = (answers: Record<string, any>, category: string) => {
    // Use the comprehensive simulated recommendations
    return generateSimulatedRecommendations(answers, category);
  };

  const renderProgressHeader = () => (
    <View style={styles.progressHeader}>
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View 
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                })
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{Math.round(gameState.progress)}%</Text>
      </View>
      
      <View style={styles.gameStats}>
        <View style={styles.statItem}>
          <Star size={16} color="#FFD700" />
          <Text style={styles.statText}>{gameState.score}</Text>
        </View>
        <View style={styles.statItem}>
          <Zap size={16} color="#FF6B35" />
          <Text style={styles.statText}>{gameState.streak}</Text>
        </View>
        <View style={styles.statItem}>
          <Trophy size={16} color="#4ECDC4" />
          <Text style={styles.statText}>{gameState.badges.length}</Text>
        </View>
      </View>
    </View>
  );

  const renderQuestion = () => {
    if (!gameState.currentQuestion) return null;

    const question = gameState.currentQuestion;
    
    return (
      <Animated.View 
        style={[
          styles.questionContainer,
          {
            transform: [
              { translateX: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <View style={styles.questionHeader}>
          <View style={styles.questionIcon}>
            <Brain size={32} color="#0066CC" />
          </View>
          <Text style={styles.questionTitle}>{question.text}</Text>
          {question.description && (
            <Text style={styles.questionDescription}>{question.description}</Text>
          )}
        </View>

        <View style={styles.optionsContainer}>
          {question.type === 'single-choice' && question.options?.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                { 
                  backgroundColor: getOptionColor(index),
                  transform: [{ scale: scaleAnim }]
                }
              ]}
              onPress={() => handleAnswer(option.value, option)}
              activeOpacity={0.8}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionText}>{option.text}</Text>
                <ArrowRight size={20} color="white" />
              </View>
            </TouchableOpacity>
          ))}

          {question.type === 'multiple-choice' && (
            <MultipleChoiceQuestion 
              question={question}
              onAnswer={handleAnswer}
            />
          )}

          {question.type === 'number' && (
            <NumberInputQuestion 
              question={question}
              onAnswer={handleAnswer}
            />
          )}

          {question.type === 'slider' && (
            <SliderQuestion 
              question={question}
              onAnswer={handleAnswer}
            />
          )}
        </View>
      </Animated.View>
    );
  };

  const getOptionColor = (index: number) => {
    const colors = ['#0066CC', '#28A745', '#FF6B35', '#9B59B6', '#E74C3C', '#F39C12'];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Processing your health journey...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Image 
        source={{ uri: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800' }}
        style={styles.backgroundImage}
      />
      <View style={styles.overlay} />
      
      {renderProgressHeader()}
      
      <View style={styles.content}>
        {renderQuestion()}
      </View>

      {gameState.badges.length > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeTitle}>Achievements Unlocked!</Text>
          <View style={styles.badgeList}>
            {gameState.badges.map((badge, index) => (
              <View key={badge} style={styles.badge}>
                <Trophy size={16} color="#FFD700" />
              </View>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Additional question components
const MultipleChoiceQuestion = ({ question, onAnswer }: { question: Question, onAnswer: (value: any) => void }) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const toggleOption = (optionId: string) => {
    const newSelection = selectedOptions.includes(optionId)
      ? selectedOptions.filter(id => id !== optionId)
      : [...selectedOptions, optionId];
    setSelectedOptions(newSelection);
  };

  const handleContinue = () => {
    onAnswer(selectedOptions);
  };

  return (
    <View style={styles.multiChoiceContainer}>
      <ScrollView 
        style={styles.optionsScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {question.options?.map((option, index) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.multiOptionCard,
              selectedOptions.includes(option.id) && styles.selectedOption
            ]}
            onPress={() => toggleOption(option.id)}
          >
            <View style={styles.checkboxContainer}>
              {selectedOptions.includes(option.id) && (
                <CheckCircle size={20} color="#0066CC" />
              )}
            </View>
            <Text style={styles.multiOptionText}>{option.text}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.continueButtonContainer}>
        {selectedOptions.length > 0 && (
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue</Text>
            <ArrowRight size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const NumberInputQuestion = ({ question, onAnswer }: { question: Question, onAnswer: (value: any) => void }) => {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onAnswer(numValue);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.numberInputContainer}>
      <View style={styles.numberInput}>
        <Text style={styles.numberValue}>{value || '0'}</Text>
        <Text style={styles.numberUnit}>{question.unit}</Text>
      </View>
      
      <View style={styles.numberPad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '⌫'].map((num, index) => (
          <TouchableOpacity
            key={index}
            style={styles.numberKey}
            onPress={() => {
              if (num === '⌫') {
                setValue(prev => prev.slice(0, -1));
              } else {
                setValue(prev => prev + num.toString());
              }
            }}
          >
            <Text style={styles.numberKeyText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <TouchableOpacity style={styles.continueButton} onPress={handleSubmit}>
        <Text style={styles.continueButtonText}>Continue</Text>
        <ArrowRight size={20} color="white" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const SliderQuestion = ({ question, onAnswer }: { question: Question, onAnswer: (value: any) => void }) => {
  const [value, setValue] = useState(question.min || 1);

  const handleSubmit = () => {
    onAnswer(value);
  };

  return (
    <ScrollView contentContainerStyle={styles.sliderContainer}>
      <View style={styles.sliderValue}>
        <Text style={styles.sliderNumber}>{value}</Text>
        <Text style={styles.sliderLabel}>out of {question.max}</Text>
      </View>
      
      <View style={styles.sliderTrack}>
        <View style={styles.sliderFill} />
        <TouchableOpacity style={styles.sliderThumb} />
      </View>
      
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabelText}>Low</Text>
        <Text style={styles.sliderLabelText}>High</Text>
      </View>
      
      <TouchableOpacity style={styles.continueButton} onPress={handleSubmit}>
        <Text style={styles.continueButtonText}>Continue</Text>
        <ArrowRight size={20} color="white" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0066CC',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 102, 204, 0.8)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  progressHeader: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  progressText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 40,
  },
  gameStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  questionHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  questionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
  },
  questionDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    flex: 1,
  },
  optionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    flex: 1,
  },
  multiOptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: '#FFD700',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    marginRight: 16,
  },
  multiOptionText: {
    fontSize: 16,
    color: 'white',
    flex: 1,
  },
  multiChoiceContainer: {
    flex: 1,
    maxHeight: height * 0.6, // Limit height to 60% of screen
  },
  optionsScrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  continueButtonContainer: {
    paddingTop: 16,
    backgroundColor: 'rgba(0, 102, 204, 0.8)', // Match overlay color
  },
  continueButton: {
    backgroundColor: '#28A745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  numberInputContainer: {
    alignItems: 'center',
  },
  numberInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    minWidth: 200,
  },
  numberValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  numberUnit: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    maxWidth: 240,
  },
  numberKey: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberKeyText: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
  },
  sliderContainer: {
    alignItems: 'center',
  },
  sliderValue: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sliderNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: 'white',
  },
  sliderLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  sliderTrack: {
    width: '80%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 16,
    position: 'relative',
  },
  sliderFill: {
    width: '50%',
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    left: '50%',
    top: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 32,
  },
  sliderLabelText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  badgeContainer: {
    position: 'absolute',
    top: 100,
    right: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  badgeList: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
