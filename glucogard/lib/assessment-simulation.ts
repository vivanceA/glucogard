// Simulated assessment endpoint for when the real AI service is unavailable
export interface SimulatedRiskPrediction {
  risk_category: 'non-diabetic' | 'low' | 'moderate' | 'high' | 'critical';
  risk_level: number;
  probabilities: {
    'Non-diabetic': number;
    'Low Risk': number;
    'Moderate Risk': number;
    'High Risk': number;
    'Critical Risk': number;
  };
}

export function simulateRiskPrediction(answers: Record<string, any>): SimulatedRiskPrediction {
  // Calculate risk factors based on answers
  let riskScore = 0;
  const riskFactors: string[] = [];

  // Age factor (higher age = higher risk)
  const age = answers.age || 0;
  if (age > 45) {
    riskScore += 15;
    riskFactors.push('age');
  } else if (age > 35) {
    riskScore += 8;
  }

  // BMI calculation and factor
  const heightInMeters = (answers.height || 170) / 100;
  const weight = answers.weight || 70;
  const bmi = weight / (heightInMeters * heightInMeters);
  
  if (bmi > 30) {
    riskScore += 20;
    riskFactors.push('obesity');
  } else if (bmi > 25) {
    riskScore += 12;
    riskFactors.push('overweight');
  }

  // Blood pressure factor
  const systolicBp = answers.systolic_bp || 120;
  if (systolicBp > 140) {
    riskScore += 15;
    riskFactors.push('hypertension');
  } else if (systolicBp > 130) {
    riskScore += 8;
  }

  // Family history factor
  if (answers['family-history'] === 'yes') {
    riskScore += 18;
    riskFactors.push('family_history');
  }

  // Activity level factor
  const activityLevel = answers['activity-level'] || 'moderate';
  if (activityLevel === 'sedentary') {
    riskScore += 12;
    riskFactors.push('sedentary');
  } else if (activityLevel === 'light') {
    riskScore += 6;
  }

  // Diet quality factor
  const dietQuality = answers.diet_quality || 5;
  if (dietQuality <= 3) {
    riskScore += 10;
    riskFactors.push('poor_diet');
  } else if (dietQuality <= 5) {
    riskScore += 5;
  }

  // Diet habits factor
  const dietHabits = answers['diet-habits'] || 'good';
  if (dietHabits === 'poor') {
    riskScore += 12;
    riskFactors.push('poor_diet_habits');
  } else if (dietHabits === 'fair') {
    riskScore += 6;
  }

  // Smoking factor
  const smoking = answers.smoking || 'never';
  if (smoking === 'current') {
    riskScore += 10;
    riskFactors.push('smoking');
  } else if (smoking === 'former') {
    riskScore += 4;
  }

  // Symptoms factor
  const symptoms = answers.symptoms || [];
  const symptomCount = Array.isArray(symptoms) 
    ? symptoms.filter((s: string) => s !== 'none').length 
    : 0;
  
  if (symptomCount > 3) {
    riskScore += 20;
    riskFactors.push('multiple_symptoms');
  } else if (symptomCount > 1) {
    riskScore += 10;
    riskFactors.push('some_symptoms');
  }

  // Stress level factor
  const stressLevel = answers['stress-level'] || 5;
  if (stressLevel >= 8) {
    riskScore += 8;
    riskFactors.push('high_stress');
  }

  // Sleep quality factor
  const sleepQuality = answers['sleep-quality'] || 'good';
  if (sleepQuality === 'poor') {
    riskScore += 8;
    riskFactors.push('poor_sleep');
  }

  // Location factor (urban vs rural access to healthcare)
  const location = answers.location || 'urban';
  if (location === 'rural') {
    riskScore += 3; // Slight increase due to healthcare access
  }

  // Cap the risk score at 100
  riskScore = Math.min(riskScore, 100);

  // Determine risk category based on score
  let riskCategory: SimulatedRiskPrediction['risk_category'];
  let riskLevel: number;

  if (riskScore <= 20) {
    riskCategory = 'non-diabetic';
    riskLevel = 0;
  } else if (riskScore <= 35) {
    riskCategory = 'low';
    riskLevel = 1;
  } else if (riskScore <= 55) {
    riskCategory = 'moderate';
    riskLevel = 2;
  } else if (riskScore <= 75) {
    riskCategory = 'high';
    riskLevel = 3;
  } else {
    riskCategory = 'critical';
    riskLevel = 4;
  }

  // Generate realistic probabilities based on the risk score
  const probabilities = generateProbabilities(riskScore, riskCategory);

  return {
    risk_category: riskCategory,
    risk_level: riskLevel,
    probabilities
  };
}

function generateProbabilities(
  riskScore: number, 
  primaryCategory: SimulatedRiskPrediction['risk_category']
): SimulatedRiskPrediction['probabilities'] {
  // Base probabilities
  const probs = {
    'Non-diabetic': 0.2,
    'Low Risk': 0.2,
    'Moderate Risk': 0.2,
    'High Risk': 0.2,
    'Critical Risk': 0.2
  };

  // Adjust probabilities based on risk score
  if (riskScore <= 20) {
    probs['Non-diabetic'] = 0.6 + Math.random() * 0.2;
    probs['Low Risk'] = 0.2 + Math.random() * 0.1;
    probs['Moderate Risk'] = 0.1 + Math.random() * 0.05;
    probs['High Risk'] = 0.05 + Math.random() * 0.03;
    probs['Critical Risk'] = 0.02 + Math.random() * 0.02;
  } else if (riskScore <= 35) {
    probs['Non-diabetic'] = 0.3 + Math.random() * 0.1;
    probs['Low Risk'] = 0.4 + Math.random() * 0.2;
    probs['Moderate Risk'] = 0.2 + Math.random() * 0.1;
    probs['High Risk'] = 0.08 + Math.random() * 0.05;
    probs['Critical Risk'] = 0.02 + Math.random() * 0.03;
  } else if (riskScore <= 55) {
    probs['Non-diabetic'] = 0.15 + Math.random() * 0.1;
    probs['Low Risk'] = 0.25 + Math.random() * 0.1;
    probs['Moderate Risk'] = 0.35 + Math.random() * 0.15;
    probs['High Risk'] = 0.2 + Math.random() * 0.1;
    probs['Critical Risk'] = 0.05 + Math.random() * 0.05;
  } else if (riskScore <= 75) {
    probs['Non-diabetic'] = 0.05 + Math.random() * 0.05;
    probs['Low Risk'] = 0.15 + Math.random() * 0.1;
    probs['Moderate Risk'] = 0.25 + Math.random() * 0.1;
    probs['High Risk'] = 0.4 + Math.random() * 0.15;
    probs['Critical Risk'] = 0.15 + Math.random() * 0.1;
  } else {
    probs['Non-diabetic'] = 0.02 + Math.random() * 0.03;
    probs['Low Risk'] = 0.08 + Math.random() * 0.05;
    probs['Moderate Risk'] = 0.15 + Math.random() * 0.1;
    probs['High Risk'] = 0.25 + Math.random() * 0.1;
    probs['Critical Risk'] = 0.5 + Math.random() * 0.2;
  }

  // Normalize probabilities to sum to 1
  const total = Object.values(probs).reduce((sum, prob) => sum + prob, 0);
  Object.keys(probs).forEach(key => {
    probs[key as keyof typeof probs] /= total;
  });

  return probs;
}

export function generateSimulatedRecommendations(
  answers: Record<string, any>, 
  riskCategory: string
): Array<{ content: string; type: 'lifestyle' | 'clinical' }> {
  const recommendations: Array<{ content: string; type: 'lifestyle' | 'clinical' }> = [];

  // Critical risk recommendations
  if (riskCategory === 'critical') {
    recommendations.push({
      content: 'Schedule an immediate consultation with a healthcare provider for comprehensive diabetes screening and blood glucose testing.',
      type: 'clinical'
    });
    recommendations.push({
      content: 'Monitor your blood sugar levels daily and keep a food diary to track glucose responses to different meals.',
      type: 'clinical'
    });
  }

  // High risk recommendations
  if (riskCategory === 'high' || riskCategory === 'critical') {
    recommendations.push({
      content: 'Consult with a registered dietitian to create a personalized meal plan focused on blood sugar management.',
      type: 'clinical'
    });
  }

  // Activity level recommendations
  const activityLevel = answers['activity-level'] || 'moderate';
  if (activityLevel === 'sedentary') {
    recommendations.push({
      content: 'Start with 10-minute walks after meals and gradually increase to 150 minutes of moderate exercise per week. Even small increases in activity can significantly reduce diabetes risk.',
      type: 'lifestyle'
    });
    recommendations.push({
      content: 'Consider joining a local walking group or fitness class to make exercise more enjoyable and sustainable.',
      type: 'lifestyle'
    });
  } else if (activityLevel === 'light') {
    recommendations.push({
      content: 'Increase your physical activity to include both cardio and strength training exercises. Aim for at least 150 minutes of moderate activity weekly.',
      type: 'lifestyle'
    });
  }

  // Diet recommendations
  const dietHabits = answers['diet-habits'] || 'good';
  if (dietHabits === 'poor') {
    recommendations.push({
      content: 'Focus on whole foods: vegetables, lean proteins, whole grains, and healthy fats. Limit processed foods, sugary drinks, and refined carbohydrates.',
      type: 'lifestyle'
    });
    recommendations.push({
      content: 'Practice portion control by using smaller plates and eating slowly. This helps with weight management and blood sugar control.',
      type: 'lifestyle'
    });
  }

  const dietQuality = answers.diet_quality || 5;
  if (dietQuality <= 4) {
    recommendations.push({
      content: 'Include more fiber-rich foods like beans, lentils, and vegetables in your diet. Fiber helps slow sugar absorption and improves blood glucose control.',
      type: 'lifestyle'
    });
  }

  // BMI-based recommendations
  const heightInMeters = (answers.height || 170) / 100;
  const weight = answers.weight || 70;
  const bmi = weight / (heightInMeters * heightInMeters);
  
  if (bmi > 25) {
    recommendations.push({
      content: 'Work towards achieving a healthy weight through a combination of balanced nutrition and regular physical activity. Even a 5-10% weight loss can significantly reduce diabetes risk.',
      type: 'lifestyle'
    });
  }

  // Stress management
  const stressLevel = answers['stress-level'] || 5;
  if (stressLevel >= 7) {
    recommendations.push({
      content: 'Practice stress management techniques such as meditation, deep breathing, or yoga. Chronic stress can affect blood sugar levels and increase diabetes risk.',
      type: 'lifestyle'
    });
  }

  // Sleep recommendations
  const sleepQuality = answers['sleep-quality'] || 'good';
  if (sleepQuality === 'poor' || sleepQuality === 'fair') {
    recommendations.push({
      content: 'Prioritize getting 7-9 hours of quality sleep each night. Poor sleep can affect insulin sensitivity and blood sugar regulation.',
      type: 'lifestyle'
    });
  }

  // Smoking cessation
  const smoking = answers.smoking || 'never';
  if (smoking === 'current') {
    recommendations.push({
      content: 'Consider quitting smoking as it significantly increases diabetes risk and complications. Speak with your healthcare provider about smoking cessation programs.',
      type: 'clinical'
    });
  }

  // Family history considerations
  if (answers['family-history'] === 'yes') {
    recommendations.push({
      content: 'Given your family history of diabetes, maintain regular health screenings including annual blood glucose tests and HbA1c monitoring.',
      type: 'clinical'
    });
  }

  // Symptoms-based recommendations
  const symptoms = answers.symptoms || [];
  const symptomCount = Array.isArray(symptoms) 
    ? symptoms.filter((s: string) => s !== 'none').length 
    : 0;
  
  if (symptomCount > 2) {
    recommendations.push({
      content: 'You reported several symptoms that may be related to blood sugar issues. Schedule an appointment with your healthcare provider for proper evaluation.',
      type: 'clinical'
    });
  }

  // Location-based recommendations
  const location = answers.location || 'urban';
  if (location === 'rural') {
    recommendations.push({
      content: 'Connect with your local health center for regular check-ups and consider telemedicine options for ongoing diabetes prevention support.',
      type: 'clinical'
    });
  } else {
    recommendations.push({
      content: 'Take advantage of local resources such as community health centers, fitness facilities, and farmers markets for fresh produce.',
      type: 'lifestyle'
    });
  }

  // General prevention recommendations for all risk levels
  if (riskCategory !== 'critical') {
    recommendations.push({
      content: 'Stay hydrated by drinking plenty of water throughout the day. Proper hydration supports healthy blood sugar levels and overall metabolic function.',
      type: 'lifestyle'
    });
  }

  // Limit to 6-8 most relevant recommendations
  return recommendations.slice(0, Math.min(8, recommendations.length));
}