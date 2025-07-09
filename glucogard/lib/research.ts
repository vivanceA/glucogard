import { supabase } from './supabase';

export interface ResearchPreferences {
  participateInResearch: boolean;
  allowAnonymousDataExport: boolean;
  allowTrendAnalysis: boolean;
  allowPublicHealthReporting: boolean;
}

export interface AnonymizedHealthData {
  id: string;
  age_group: string; // "18-25", "26-35", etc.
  gender: string;
  location_type: 'urban' | 'rural';
  risk_category: string;
  risk_score: number;
  activity_level: string;
  diet_habits: string;
  family_history: boolean;
  symptoms_count: number;
  submission_date: string;
  province?: string; // Optional for regional analysis
}

export interface PublicHealthMetrics {
  total_assessments: number;
  risk_distribution: {
    low: number;
    moderate: number;
    critical: number;
    high: number;
    non_diabetic: number;
  };
  demographic_breakdown: {
    age_groups: Record<string, number>;
    gender_distribution: Record<string, number>;
    urban_vs_rural: {
      urban: number;
      rural: number;
    };
  };
  trend_analysis: {
    monthly_assessments: Array<{
      month: string;
      count: number;
      average_risk_score: number;
    }>;
    risk_factors: {
      sedentary_lifestyle: number;
      poor_diet: number;
      family_history: number;
      symptoms_present: number;
    };
  };
}

function getAgeGroup(age: number): string {
  if (age < 18) return 'under-18';
  if (age < 26) return '18-25';
  if (age < 36) return '26-35';
  if (age < 46) return '36-45';
  if (age < 56) return '46-55';
  if (age < 66) return '56-65';
  return 'over-65';
}

function getLocationTypeFromCoordinates(latitude: number, longitude: number): 'urban' | 'rural' {
  // Simple heuristic for Rwanda: if within 15km of major cities, consider urban
  const majorCities = [
    { name: 'Kigali', lat: -1.9441, lng: 30.0619 },
    { name: 'Butare', lat: -2.5967, lng: 29.7397 },
    { name: 'Gitarama', lat: -2.0742, lng: 29.7564 },
    { name: 'Ruhengeri', lat: -1.4983, lng: 29.6339 }
  ];

  for (const city of majorCities) {
    const distance = calculateDistance(latitude, longitude, city.lat, city.lng);
    if (distance <= 15) return 'urban';
  }
  
  return 'rural';
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function saveResearchPreferences(
  userId: string,
  preferences: ResearchPreferences
): Promise<void> {
  try {
    const { error } = await supabase
      .from('research_preferences')
      .upsert({
        user_id: userId,
        participate_in_research: preferences.participateInResearch,
        allow_anonymous_data_export: preferences.allowAnonymousDataExport,
        allow_trend_analysis: preferences.allowTrendAnalysis,
        allow_public_health_reporting: preferences.allowPublicHealthReporting,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving research preferences:', error);
    throw error;
  }
}

export async function getResearchPreferences(userId: string): Promise<ResearchPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('research_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) return null;

    return {
      participateInResearch: data.participate_in_research,
      allowAnonymousDataExport: data.allow_anonymous_data_export,
      allowTrendAnalysis: data.allow_trend_analysis,
      allowPublicHealthReporting: data.allow_public_health_reporting
    };
  } catch (error) {
    console.error('Error getting research preferences:', error);
    return null;
  }
}

export async function anonymizeAndExportHealthData(
  submissionId: string,
  userLocation?: { latitude: number; longitude: number }
): Promise<AnonymizedHealthData | null> {
  try {
    // Get submission with related data
    const { data: submission, error } = await supabase
      .from('health_submissions')
      .select(`
        *,
        patients!inner (
          age,
          gender,
          profiles!inner (
            user_id
          )
        ),
        risk_predictions (
          risk_score,
          risk_category
        )
      `)
      .eq('id', submissionId)
      .single();

    if (error) throw error;

    // Check if user has consented to research
    const preferences = await getResearchPreferences(submission.patients.profiles.user_id);
    if (!preferences?.allowAnonymousDataExport) {
      return null;
    }

    const answers = submission.answers as any;
    const riskPrediction = submission.risk_predictions?.[0];

    // Count symptoms
    const symptoms = answers.symptoms || [];
    const symptomsCount = Array.isArray(symptoms) 
      ? symptoms.filter((s: string) => s !== 'none').length 
      : 0;

    // Determine location type
    let locationType: 'urban' | 'rural' = 'urban';
    if (userLocation) {
      locationType = getLocationTypeFromCoordinates(
        userLocation.latitude, 
        userLocation.longitude
      );
    }

    const anonymizedData: AnonymizedHealthData = {
      id: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      age_group: getAgeGroup(submission.patients.age || 0),
      gender: submission.patients.gender || 'unknown',
      location_type: locationType,
      risk_category: riskPrediction?.risk_category.replace('_', '-') || 'unknown',
      risk_score: riskPrediction?.risk_score || 0,
      activity_level: answers['activity-level'] || 'unknown',
      diet_habits: answers['diet-habits'] || 'unknown',
      family_history: answers['family-history'] === 'yes',
      symptoms_count: symptomsCount,
      submission_date: submission.submitted_at,
      province: 'Kigali' // Could be determined from location
    };

    // Store anonymized data for research
    const { error: insertError } = await supabase
      .from('anonymized_health_data')
      .insert(anonymizedData);

    if (insertError) {
      console.error('Error storing anonymized data:', insertError);
    }

    return anonymizedData;
  } catch (error) {
    console.error('Error anonymizing health data:', error);
    return null;
  }
}

export async function generatePublicHealthMetrics(): Promise<PublicHealthMetrics | null> {
  try {
    // Get all anonymized data
    const { data: anonymizedData, error } = await supabase
      .from('anonymized_health_data')
      .select('*')
      .order('submission_date', { ascending: false });

    if (error) throw error;
    if (!anonymizedData || anonymizedData.length === 0) {
      return null;
    }

    // Calculate risk distribution
    const riskDistribution = anonymizedData.reduce(
      (acc, record) => {
        acc[record.risk_category as keyof typeof acc] = (acc[record.risk_category as keyof typeof acc] || 0) + 1;
        return acc;
      },
      { low: 0, moderate: 0, critical: 0, high: 0, 'non-diabetic': 0 }
    );

    // Calculate demographic breakdown
    const ageGroups = anonymizedData.reduce((acc, record) => {
      acc[record.age_group] = (acc[record.age_group] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const genderDistribution = anonymizedData.reduce((acc, record) => {
      acc[record.gender] = (acc[record.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const urbanVsRural = anonymizedData.reduce(
      (acc, record) => {
        acc[record.location_type]++;
        return acc;
      },
      { urban: 0, rural: 0 }
    );

    // Calculate monthly trends (last 12 months)
    const monthlyData = new Map<string, { count: number; totalRiskScore: number }>();
    
    anonymizedData.forEach(record => {
      const date = new Date(record.submission_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { count: 0, totalRiskScore: 0 });
      }
      
      const monthData = monthlyData.get(monthKey)!;
      monthData.count++;
      monthData.totalRiskScore += record.risk_score;
    });

    const monthlyAssessments = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        count: data.count,
        average_risk_score: Math.round(data.totalRiskScore / data.count)
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months

    // Calculate risk factors
    const riskFactors = {
      sedentary_lifestyle: anonymizedData.filter(r => r.activity_level === 'sedentary').length,
      poor_diet: anonymizedData.filter(r => r.diet_habits === 'poor').length,
      family_history: anonymizedData.filter(r => r.family_history).length,
      symptoms_present: anonymizedData.filter(r => r.symptoms_count > 0).length
    };

    const metrics: PublicHealthMetrics = {
      total_assessments: anonymizedData.length,
      risk_distribution: riskDistribution,
      demographic_breakdown: {
        age_groups: ageGroups,
        gender_distribution: genderDistribution,
        urban_vs_rural: urbanVsRural
      },
      trend_analysis: {
        monthly_assessments: monthlyAssessments,
        risk_factors: riskFactors
      }
    };

    return metrics;
  } catch (error) {
    console.error('Error generating public health metrics:', error);
    return null;
  }
}

export function exportDataForResearchers(metrics: PublicHealthMetrics): string {
  // Export as CSV format for researchers
  const csvData = [
    'Metric,Value',
    `Total Assessments,${metrics.total_assessments}`,
    `Low Risk,${metrics.risk_distribution.low}`,
    `Moderate Risk,${metrics.risk_distribution.moderate}`,
    `Critical Risk,${metrics.risk_distribution.critical}`,
    `Urban Population,${metrics.demographic_breakdown.urban_vs_rural.urban}`,
    `Rural Population,${metrics.demographic_breakdown.urban_vs_rural.rural}`,
    `Sedentary Lifestyle,${metrics.trend_analysis.risk_factors.sedentary_lifestyle}`,
    `Poor Diet,${metrics.trend_analysis.risk_factors.poor_diet}`,
    `Family History,${metrics.trend_analysis.risk_factors.family_history}`,
    `Symptoms Present,${metrics.trend_analysis.risk_factors.symptoms_present}`
  ].join('\n');

  return csvData;
}