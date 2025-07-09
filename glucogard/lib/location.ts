import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface HealthFacility {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'pharmacy' | 'market' | 'gym';
  latitude: number;
  longitude: number;
  distance?: number;
  address: string;
  phone?: string;
  hours?: string;
}

// Mock data for Rwanda health facilities (in production, this would come from an API)
const RWANDA_HEALTH_FACILITIES: HealthFacility[] = [
  {
    id: '1',
    name: 'King Faisal Hospital',
    type: 'hospital',
    latitude: -1.9441,
    longitude: 30.0619,
    address: 'KG 544 St, Kigali',
    phone: '+250 788 123 456',
    hours: '24/7'
  },
  {
    id: '2',
    name: 'University Teaching Hospital of Kigali',
    type: 'hospital',
    latitude: -1.9706,
    longitude: 30.1044,
    address: 'KN 4 Ave, Kigali',
    phone: '+250 788 234 567',
    hours: '24/7'
  },
  {
    id: '3',
    name: 'Kimisagara Health Center',
    type: 'clinic',
    latitude: -1.9659,
    longitude: 30.0588,
    address: 'Nyarugenge, Kigali',
    phone: '+250 788 345 678',
    hours: '8:00 AM - 5:00 PM'
  },
  {
    id: '4',
    name: 'Pharmacy de la Paix',
    type: 'pharmacy',
    latitude: -1.9536,
    longitude: 30.0606,
    address: 'KN 3 Ave, Kigali',
    phone: '+250 788 456 789',
    hours: '8:00 AM - 8:00 PM'
  },
  {
    id: '5',
    name: 'Kimironko Market',
    type: 'market',
    latitude: -1.9378,
    longitude: 30.1264,
    address: 'Kimironko, Kigali',
    hours: '6:00 AM - 6:00 PM'
  },
  {
    id: '6',
    name: 'Kigali Fitness Center',
    type: 'gym',
    latitude: -1.9506,
    longitude: 30.0588,
    address: 'KG 11 Ave, Kigali',
    phone: '+250 788 567 890',
    hours: '6:00 AM - 10:00 PM'
  }
];

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    // For web, use browser geolocation API
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          resolve(result.state === 'granted' || result.state === 'prompt');
        }).catch(() => resolve(false));
      } else {
        resolve(false);
      }
    });
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation(): Promise<LocationData | null> {
  try {
    if (Platform.OS === 'web') {
      // For web, use browser geolocation API
      return new Promise((resolve, reject) => {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
              });
            },
            (error) => {
              if (error.code === 2) { // POSITION_UNAVAILABLE
                console.warn('Web geolocation error:', error);
              } else {
                console.error('Web geolocation error:', error);
              }
              resolve(null);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        } else {
          resolve(null);
        }
      });
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

export async function getNearbyHealthFacilities(
  userLocation: LocationData,
  type?: HealthFacility['type'],
  maxDistance: number = 10
): Promise<HealthFacility[]> {
  try {
    // Calculate distances and filter facilities
    let facilities = RWANDA_HEALTH_FACILITIES.map(facility => ({
      ...facility,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        facility.latitude,
        facility.longitude
      )
    }));

    // Filter by type if specified
    if (type) {
      facilities = facilities.filter(f => f.type === type);
    }

    // Filter by distance and sort
    facilities = facilities
      .filter(f => f.distance! <= maxDistance)
      .sort((a, b) => a.distance! - b.distance!);

    return facilities;
  } catch (error) {
    console.error('Error getting nearby facilities:', error);
    return [];
  }
}

export function getEnvironmentType(location: LocationData): 'urban' | 'rural' {
  // Simple heuristic: if within 5km of Kigali center, consider urban
  const kigaliCenter = { latitude: -1.9441, longitude: 30.0619 };
  const distanceFromKigali = calculateDistance(
    location.latitude,
    location.longitude,
    kigaliCenter.latitude,
    kigaliCenter.longitude
  );
  
  return distanceFromKigali <= 15 ? 'urban' : 'rural';
}

export function getLocationBasedRecommendations(
  location: LocationData,
  riskCategory: 'low' | 'moderate' | 'critical'
): string[] {
  const environment = getEnvironmentType(location);
  const recommendations: string[] = [];

  if (environment === 'urban') {
    recommendations.push(
      'Visit nearby Kimironko Market for fresh vegetables and fruits',
      'Consider walking or cycling instead of using motorcycle taxis for short distances',
      'Join a local fitness center for regular exercise'
    );

    if (riskCategory === 'critical') {
      recommendations.push(
        'Schedule an appointment at King Faisal Hospital for comprehensive diabetes screening',
        'Visit a nearby pharmacy to discuss diabetes monitoring supplies'
      );
    }
  } else {
    recommendations.push(
      'Grow your own vegetables if possible - tomatoes, onions, and leafy greens are excellent choices',
      'Take advantage of rural walking paths for daily exercise',
      'Connect with your local health center for regular check-ups'
    );

    if (riskCategory === 'critical') {
      recommendations.push(
        'Contact your nearest health center immediately for diabetes screening',
        'Consider traveling to Kigali for specialized diabetes care if recommended by your local health provider'
      );
    }
  }

  return recommendations;
}