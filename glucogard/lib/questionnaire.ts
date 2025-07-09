export interface QuestionOption {
  id: string;
  text: string;
  value: any;
  nextQuestionId?: string;
  skipToQuestionId?: string;
}

export interface Question {
  id: string;
  type: 'single-choice' | 'multiple-choice' | 'number' | 'text' | 'slider';
  text: string;
  description?: string;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  required: boolean;
  condition?: (answers: Record<string, any>) => boolean;
  validation?: (value: any) => string | null;
}

export interface QuestionnaireFlow {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  startQuestionId: string;
}

export const ADAPTIVE_QUESTIONNAIRE: QuestionnaireFlow = {
  id: 'diabetes-risk-assessment',
  title: 'Smart Health Assessment',
  description: 'A personalized questionnaire that adapts to your responses',
  startQuestionId: 'welcome',
  questions: [
    {
      id: 'welcome',
      type: 'single-choice',
      text: 'Welcome to your health assessment! 🌟',
      description: 'This smart questionnaire will adapt based on your answers to give you the most relevant experience.',
      options: [
        { id: 'start', text: 'Let\'s begin!', value: true, nextQuestionId: 'age' }
      ],
      required: true
    },
    {
      id: 'age',
      type: 'number',
      text: 'What is your age?',
      description: 'This helps us understand your risk factors',
      min: 1,
      max: 120,
      required: true,
      validation: (value) => {
        if (value < 1 || value > 120) return 'Please enter a valid age';
        return null;
      }
    },
    {
      id: 'gender',
      type: 'single-choice',
      text: 'What is your gender?',
      options: [
        { id: 'male', text: 'Male', value: 'male' },
        { id: 'female', text: 'Female', value: 'female' },
        { id: 'other', text: 'Other', value: 'other' },
        { id: 'prefer-not-to-say', text: 'Prefer not to say', value: 'prefer-not-to-say' }
      ],
      required: true
    },
    {
      id: 'weight',
      type: 'number',
      text: 'What is your weight?',
      description: 'Enter your weight in kilograms',
      min: 20,
      max: 300,
      unit: 'kg',
      required: true
    },
    {
      id: 'height',
      type: 'number',
      text: 'What is your height?',
      description: 'Enter your height in centimeters',
      min: 100,
      max: 250,
      unit: 'cm',
      required: true
    },
    {
      id: 'systolic_bp',
      type: 'number',
      text: 'What is your systolic blood pressure?',
      description: 'Enter the top number from your blood pressure reading',
      min: 70,
      max: 200,
      unit: 'mmHg',
      required: true
    },
    {
      id: 'diet_quality',
      type: 'slider',
      text: 'How would you rate the quality of your diet?',
      description: '1 is poor, 10 is excellent',
      min: 1,
      max: 10,
      step: 1,
      required: true
    },
    {
      id: 'location',
      type: 'single-choice',
      text: 'Do you live in an urban or rural area?',
      options: [
        { id: 'urban', text: 'Urban', value: 'urban' },
        { id: 'rural', text: 'Rural', value: 'rural' }
      ],
      required: true
    },
    {
      id: 'family-history',
      type: 'single-choice',
      text: 'Do you have a family history of diabetes?',
      description: 'This includes parents, siblings, or grandparents',
      options: [
        { id: 'yes', text: 'Yes', value: 'yes', nextQuestionId: 'family-details' },
        { id: 'no', text: 'No', value: 'no', nextQuestionId: 'activity-level' },
        { id: 'unknown', text: 'I don\'t know', value: 'unknown', nextQuestionId: 'activity-level' }
      ],
      required: true
    },
    {
      id: 'family-details',
      type: 'multiple-choice',
      text: 'Which family members have diabetes?',
      description: 'Select all that apply',
      options: [
        { id: 'parent', text: 'Parent(s)', value: 'parent' },
        { id: 'sibling', text: 'Sibling(s)', value: 'sibling' },
        { id: 'grandparent', text: 'Grandparent(s)', value: 'grandparent' },
        { id: 'other', text: 'Other relative', value: 'other' }
      ],
      required: true,
      condition: (answers) => answers['family-history'] === 'yes'
    },
    {
      id: 'activity-level',
      type: 'single-choice',
      text: 'How would you describe your physical activity level?',
      description: 'Think about your typical week',
      options: [
        { 
          id: 'sedentary', 
          text: '🪑 Sedentary - Mostly sitting', 
          value: 'sedentary',
          nextQuestionId: 'sedentary-details'
        },
        { 
          id: 'light', 
          text: '🚶 Light - Some walking', 
          value: 'light',
          nextQuestionId: 'diet-habits'
        },
        { 
          id: 'moderate', 
          text: '🏃 Moderate - Regular exercise', 
          value: 'moderate',
          nextQuestionId: 'diet-habits'
        },
        { 
          id: 'active', 
          text: '💪 Very Active - Intense exercise', 
          value: 'active',
          nextQuestionId: 'diet-habits'
        }
      ],
      required: true
    },
    {
      id: 'sedentary-details',
      type: 'multiple-choice',
      text: 'What keeps you from being more active?',
      description: 'Understanding barriers helps us provide better recommendations',
      options: [
        { id: 'time', text: 'Lack of time', value: 'time' },
        { id: 'motivation', text: 'Lack of motivation', value: 'motivation' },
        { id: 'health', text: 'Health issues', value: 'health' },
        { id: 'facilities', text: 'No access to facilities', value: 'facilities' },
        { id: 'knowledge', text: 'Don\'t know how to start', value: 'knowledge' },
        { id: 'other', text: 'Other reasons', value: 'other' }
      ],
      required: true,
      condition: (answers) => answers['activity-level'] === 'sedentary'
    },
    {
      id: 'diet-habits',
      type: 'single-choice',
      text: 'How would you rate your eating habits?',
      description: 'Be honest - this helps us help you better!',
      options: [
        { 
          id: 'poor', 
          text: '🍟 Poor - Mostly processed foods', 
          value: 'poor',
          nextQuestionId: 'diet-challenges'
        },
        { 
          id: 'fair', 
          text: '🥪 Fair - Mix of healthy and unhealthy', 
          value: 'fair',
          nextQuestionId: 'symptoms'
        },
        { 
          id: 'good', 
          text: '🥗 Good - Mostly healthy foods', 
          value: 'good',
          nextQuestionId: 'symptoms'
        },
        { 
          id: 'excellent', 
          text: '🌱 Excellent - Very healthy diet', 
          value: 'excellent',
          nextQuestionId: 'symptoms'
        }
      ],
      required: true
    },
    {
      id: 'diet-challenges',
      type: 'multiple-choice',
      text: 'What makes healthy eating challenging for you?',
      description: 'Select all that apply',
      options: [
        { id: 'cost', text: 'Cost of healthy foods', value: 'cost' },
        { id: 'time', text: 'Time to prepare meals', value: 'time' },
        { id: 'availability', text: 'Limited healthy options nearby', value: 'availability' },
        { id: 'taste', text: 'Preference for certain foods', value: 'taste' },
        { id: 'knowledge', text: 'Don\'t know what\'s healthy', value: 'knowledge' },
        { id: 'family', text: 'Family food preferences', value: 'family' }
      ],
      required: true,
      condition: (answers) => answers['diet-habits'] === 'poor'
    },
    {
      id: 'symptoms',
      type: 'multiple-choice',
      text: 'Have you experienced any of these symptoms recently?',
      description: 'Select all that apply (or none if you haven\'t)',
      options: [
        { id: 'frequent-urination', text: '🚽 Frequent urination', value: 'frequent-urination' },
        { id: 'excessive-thirst', text: '💧 Excessive thirst', value: 'excessive-thirst' },
        { id: 'weight-loss', text: '⚖️ Unexplained weight loss', value: 'weight-loss' },
        { id: 'fatigue', text: '😴 Unusual fatigue', value: 'fatigue' },
        { id: 'blurred-vision', text: '👁️ Blurred vision', value: 'blurred-vision' },
        { id: 'slow-healing', text: '🩹 Slow healing wounds', value: 'slow-healing' },
        { id: 'infections', text: '🦠 Frequent infections', value: 'infections' },
        { id: 'none', text: '✅ None of the above', value: 'none' }
      ],
      required: false
    },
    {
      id: 'smoking',
      type: 'single-choice',
      text: 'What is your smoking status?',
      options: [
        { id: 'never', text: '🚭 Never smoked', value: 'never' },
        { id: 'former', text: '🚫 Former smoker', value: 'former' },
        { id: 'current', text: '🚬 Current smoker', value: 'current' }
      ],
      required: true
    },
    {
      id: 'alcohol',
      type: 'single-choice',
      text: 'How often do you consume alcohol?',
      options: [
        { id: 'never', text: 'Never', value: 'never' },
        { id: 'rarely', text: 'Rarely (few times a year)', value: 'rarely' },
        { id: 'occasionally', text: 'Occasionally (few times a month)', value: 'occasionally' },
        { id: 'regularly', text: 'Regularly (weekly)', value: 'regularly' },
        { id: 'daily', text: 'Daily', value: 'daily' }
      ],
      required: true
    },
    {
      id: 'stress-level',
      type: 'slider',
      text: 'How would you rate your stress level?',
      description: 'Stress can affect blood sugar levels',
      min: 1,
      max: 10,
      step: 1,
      required: true
    },
    {
      id: 'sleep-quality',
      type: 'single-choice',
      text: 'How is your sleep quality?',
      description: 'Poor sleep can increase diabetes risk',
      options: [
        { id: 'excellent', text: '😴 Excellent (7-9 hours, restful)', value: 'excellent' },
        { id: 'good', text: '😊 Good (6-8 hours, mostly restful)', value: 'good' },
        { id: 'fair', text: '😐 Fair (5-7 hours, sometimes restful)', value: 'fair' },
        { id: 'poor', text: '😵 Poor (less than 5 hours or restless)', value: 'poor' }
      ],
      required: true
    },
    {
      id: 'completion',
      type: 'single-choice',
      text: 'Great job completing the assessment! 🎉',
      description: 'Your personalized risk assessment and recommendations are being generated.',
      options: [
        { id: 'finish', text: 'View My Results', value: true }
      ],
      required: true
    }
  ]
};

export function getNextQuestion(
  currentQuestionId: string,
  selectedOption: QuestionOption | null,
  answers: Record<string, any>,
  questionnaire: QuestionnaireFlow
): Question | null {
  // If there's a specific next question defined in the option
  if (selectedOption?.nextQuestionId) {
    const nextQuestion = questionnaire.questions.find(q => q.id === selectedOption.nextQuestionId);
    if (nextQuestion && (!nextQuestion.condition || nextQuestion.condition(answers))) {
      return nextQuestion;
    }
  }

  // If there's a skip condition
  if (selectedOption?.skipToQuestionId) {
    const skipToQuestion = questionnaire.questions.find(q => q.id === selectedOption.skipToQuestionId);
    if (skipToQuestion && (!skipToQuestion.condition || skipToQuestion.condition(answers))) {
      return skipToQuestion;
    }
  }

  // Find the current question index
  const currentIndex = questionnaire.questions.findIndex(q => q.id === currentQuestionId);
  if (currentIndex === -1) return null;

  // Look for the next valid question
  for (let i = currentIndex + 1; i < questionnaire.questions.length; i++) {
    const question = questionnaire.questions[i];
    if (!question.condition || question.condition(answers)) {
      return question;
    }
  }

  return null; // No more questions
}

export function calculateProgress(
  currentQuestionId: string,
  answers: Record<string, any>,
  questionnaire: QuestionnaireFlow
): number {
  const totalQuestions = questionnaire.questions.filter(q => 
    !q.condition || q.condition(answers)
  ).length;
  
  const currentIndex = questionnaire.questions.findIndex(q => q.id === currentQuestionId);
  const answeredQuestions = Object.keys(answers).length;
  
  return Math.min((answeredQuestions / totalQuestions) * 100, 100);
}

export function validateAnswer(question: Question, value: any): string | null {
  if (question.required && (value === null || value === undefined || value === '')) {
    return 'This question is required';
  }

  if (question.validation) {
    return question.validation(value);
  }

  if (question.type === 'number') {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return 'Please enter a valid number';
    }
    if (question.min !== undefined && numValue < question.min) {
      return `Value must be at least ${question.min}`;
    }
    if (question.max !== undefined && numValue > question.max) {
      return `Value must be at most ${question.max}`;
    }
  }

  return null;
}
