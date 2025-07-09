import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    // Check authentication
    const user = await getCurrentUser();
    if (!user || user.role !== 'doctor') {
      return new Response('Unauthorized', { status: 401 });
    }

    switch (action) {
      case 'dashboard-stats':
        return await getDashboardStats();
      case 'patient-list':
        return await getPatientList();
      case 'public-health-metrics':
        return await getPublicHealthMetrics();
      default:
        return new Response('Invalid action', { status: 400 });
    }
  } catch (error) {
    console.error('Web dashboard API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function getDashboardStats() {
  const { data: submissions } = await supabase
    .from('health_submissions')
    .select(`
      id,
      status,
      submitted_at,
      patients!inner (
        id,
        profiles!inner (
          full_name
        )
      ),
      risk_predictions (
        risk_score,
        risk_category
      )
    `)
    .order('submitted_at', { ascending: false });

  if (!submissions) {
    return Response.json({ error: 'No data found' }, { status: 404 });
  }

  const uniquePatients = new Set(submissions.map(s => s.patients.id));
  const pendingReviews = submissions.filter(s => s.status === 'pending').length;
  const criticalCases = submissions.filter(
    s => s.risk_predictions?.[0]?.risk_category === 'critical'
  ).length;
  
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const monthlyAssessments = submissions.filter(
    s => new Date(s.submitted_at) >= thisMonth
  ).length;

  const totalRiskScore = submissions.reduce(
    (sum, s) => sum + (s.risk_predictions?.[0]?.risk_score || 0),
    0
  );
  const averageRiskScore = submissions.length > 0 
    ? Math.round(totalRiskScore / submissions.length) 
    : 0;

  return Response.json({
    totalPatients: uniquePatients.size,
    pendingReviews,
    criticalCases,
    monthlyAssessments,
    averageRiskScore,
  });
}

async function getPatientList() {
  const { data: submissions } = await supabase
    .from('health_submissions')
    .select(`
      id,
      status,
      submitted_at,
      patients!inner (
        id,
        age,
        gender,
        profiles!inner (
          full_name
        )
      ),
      risk_predictions (
        risk_score,
        risk_category
      )
    `)
    .order('submitted_at', { ascending: false })
    .limit(50);

  if (!submissions) {
    return Response.json({ error: 'No data found' }, { status: 404 });
  }

  const patientSummaries = submissions.map(submission => ({
    id: submission.id,
    name: submission.patients.profiles.full_name,
    age: submission.patients.age || 0,
    gender: submission.patients.gender || 'Unknown',
    lastAssessment: submission.submitted_at,
    riskCategory: submission.risk_predictions?.[0]?.risk_category || 'low',
    riskScore: submission.risk_predictions?.[0]?.risk_score || 0,
    status: submission.status,
  }));

  return Response.json(patientSummaries);
}

async function getPublicHealthMetrics() {
  // Import the research function
  const { generatePublicHealthMetrics } = await import('@/lib/research');
  const metrics = await generatePublicHealthMetrics();
  return Response.json(metrics);
}