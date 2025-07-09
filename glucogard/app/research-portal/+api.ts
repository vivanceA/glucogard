import { generatePublicHealthMetrics, exportDataForResearchers } from '@/lib/research';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'metrics':
        const metrics = await generatePublicHealthMetrics();
        return Response.json(metrics);

      case 'export':
        const exportMetrics = await generatePublicHealthMetrics();
        if (!exportMetrics) {
          return new Response('No data available for export', { status: 404 });
        }
        
        const csvData = exportDataForResearchers(exportMetrics);
        return new Response(csvData, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="health-research-data.csv"',
          },
        });

      default:
        return new Response('Invalid action', { status: 400 });
    }
  } catch (error) {
    console.error('Research portal API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { filters } = body;

    // Apply filters to metrics generation
    const metrics = await generatePublicHealthMetrics();
    
    // Filter data based on provided criteria
    // This would be expanded to handle various filter types
    
    return Response.json(metrics);
  } catch (error) {
    console.error('Research portal API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}