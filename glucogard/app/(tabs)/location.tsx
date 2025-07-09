import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Modal,
  Dimensions,
} from 'react-native';
import {
  MapPin,
  Navigation,
  Hospital,
  Stethoscope,
  Pill,
  ShoppingCart,
  Dumbbell,
  Phone,
  Clock,
  ExternalLink,
  RefreshCw,
  X,
} from 'lucide-react-native';
import {
  requestLocationPermission,
  getCurrentLocation,
  getNearbyHealthFacilities,
  getLocationBasedRecommendations,
  getEnvironmentType,
  type LocationData,
  type HealthFacility,
} from '@/lib/location';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';

const { width, height } = Dimensions.get('window');

export default function LocationScreen() {
  const { user } = useAuth();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [facilities, setFacilities] = useState<HealthFacility[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [selectedType, setSelectedType] = useState<HealthFacility['type'] | 'all'>('all');
  const [environmentType, setEnvironmentType] = useState<'urban' | 'rural'>('urban');
  const [selectedFacility, setSelectedFacility] = useState<HealthFacility | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  useEffect(() => {
    if (location) {
      loadNearbyFacilities();
      loadRecommendations();
      setEnvironmentType(getEnvironmentType(location));
    }
  }, [location, selectedType]);

  const checkLocationPermission = async () => {
    const hasPermission = await requestLocationPermission();
    setPermissionGranted(hasPermission);
    if (hasPermission) {
      getCurrentLocationData();
    }
  };

  const getCurrentLocationData = async () => {
    setLoading(true);
    try {
      const locationData = await getCurrentLocation();
      if (locationData) {
        setLocation(locationData);
      } else {
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please check your location settings.'
        );
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location');
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyFacilities = async () => {
    if (!location) return;

    try {
      const nearbyFacilities = await getNearbyHealthFacilities(
        location,
        selectedType === 'all' ? undefined : selectedType,
        15 // 15km radius
      );
      setFacilities(nearbyFacilities);
    } catch (error) {
      console.error('Error loading facilities:', error);
    }
  };

  const loadRecommendations = async () => {
    if (!location || !user) return;

    try {
      // Get user's latest risk assessment
      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!patientData) return;

      const { data: submissions } = await supabase
        .from('health_submissions')
        .select(`
          risk_predictions (
            risk_category
          )
        `)
        .eq('patient_id', patientData.id)
        .order('submitted_at', { ascending: false })
        .limit(1);

      const riskCategory = submissions?.[0]?.risk_predictions?.[0]?.risk_category || 'low';
      const locationRecommendations = getLocationBasedRecommendations(location, riskCategory);
      setRecommendations(locationRecommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const openInMaps = (facility: HealthFacility) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`;
    Linking.openURL(url);
  };

  const showFacilityMap = (facility: HealthFacility) => {
    setSelectedFacility(facility);
    setShowMapModal(true);
  };

  const callFacility = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const getFacilityIcon = (type: HealthFacility['type']) => {
    switch (type) {
      case 'hospital':
        return Hospital;
      case 'clinic':
        return Stethoscope;
      case 'pharmacy':
        return Pill;
      case 'market':
        return ShoppingCart;
      case 'gym':
        return Dumbbell;
      default:
        return MapPin;
    }
  };

  const getFacilityColor = (type: HealthFacility['type']) => {
    switch (type) {
      case 'hospital':
        return '#DC3545';
      case 'clinic':
        return '#0066CC';
      case 'pharmacy':
        return '#28A745';
      case 'market':
        return '#FFA500';
      case 'gym':
        return '#6F42C1';
      default:
        return '#64748B';
    }
  };

  const facilityTypes = [
    { key: 'all' as const, label: 'All', icon: MapPin },
    { key: 'hospital' as const, label: 'Hospitals', icon: Hospital },
    { key: 'clinic' as const, label: 'Clinics', icon: Stethoscope },
    { key: 'pharmacy' as const, label: 'Pharmacies', icon: Pill },
    { key: 'market' as const, label: 'Markets', icon: ShoppingCart },
    { key: 'gym' as const, label: 'Gyms', icon: Dumbbell },
  ];

  if (!permissionGranted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <MapPin size={64} color="#64748B" />
          <Text style={styles.permissionTitle}>Location Access Needed</Text>
          <Text style={styles.permissionText}>
            To provide personalized health recommendations and find nearby facilities, 
            we need access to your location.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={checkLocationPermission}
          >
            <Navigation size={20} color="white" />
            <Text style={styles.permissionButtonText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <MapPin size={24} color="#0066CC" />
          <Text style={styles.title}>Health Map</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={getCurrentLocationData}
            disabled={loading}
          >
            <RefreshCw size={20} color="#0066CC" />
          </TouchableOpacity>
        </View>

        {location && (
          <View style={styles.locationInfo}>
            <View style={styles.environmentBadge}>
              <Text style={styles.environmentText}>
                {environmentType === 'urban' ? '🏙️ Urban Area' : '🌾 Rural Area'}
              </Text>
            </View>
            <Text style={styles.coordinatesText}>
              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {facilityTypes.map((type) => {
          const IconComponent = type.icon;
          return (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.filterButton,
                selectedType === type.key && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedType(type.key)}
            >
              <IconComponent 
                size={16} 
                color={selectedType === type.key ? 'white' : '#64748B'} 
              />
              <Text
                style={[
                  styles.filterButtonText,
                  selectedType === type.key && styles.filterButtonTextActive,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.loadingText}>Finding nearby facilities...</Text>
          </View>
        )}

        {recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Location-Based Recommendations</Text>
            <View style={styles.recommendationsContainer}>
              {recommendations.map((recommendation, index) => (
                <View key={index} style={styles.recommendationCard}>
                  <Text style={styles.recommendationText}>{recommendation}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🏥 Nearby Health Facilities ({facilities.length})
          </Text>
          
          {facilities.length === 0 && !loading && (
            <View style={styles.emptyContainer}>
              <MapPin size={48} color="#64748B" />
              <Text style={styles.emptyTitle}>No facilities found</Text>
              <Text style={styles.emptyText}>
                Try expanding your search radius or selecting a different facility type.
              </Text>
            </View>
          )}

          {facilities.map((facility) => {
            const IconComponent = getFacilityIcon(facility.type);
            const iconColor = getFacilityColor(facility.type);
            
            return (
              <View key={facility.id} style={styles.facilityCard}>
                <View style={styles.facilityHeader}>
                  <View style={styles.facilityInfo}>
                    <View style={[styles.facilityIcon, { backgroundColor: `${iconColor}20` }]}>
                      <IconComponent size={20} color={iconColor} />
                    </View>
                    <View style={styles.facilityDetails}>
                      <Text style={styles.facilityName}>{facility.name}</Text>
                      <Text style={styles.facilityType}>
                        {facility.type.charAt(0).toUpperCase() + facility.type.slice(1)}
                      </Text>
                      {facility.distance && (
                        <Text style={styles.facilityDistance}>
                          📍 {facility.distance.toFixed(1)} km away
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                <Text style={styles.facilityAddress}>{facility.address}</Text>

                {facility.hours && (
                  <View style={styles.facilityMeta}>
                    <Clock size={14} color="#64748B" />
                    <Text style={styles.facilityMetaText}>{facility.hours}</Text>
                  </View>
                )}

                <View style={styles.facilityActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => showFacilityMap(facility)}
                  >
                    <MapPin size={16} color="#0066CC" />
                    <Text style={styles.actionButtonText}>View Map</Text>
                  </TouchableOpacity>

                  {facility.phone && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => callFacility(facility.phone!)}
                    >
                      <Phone size={16} color="#28A745" />
                      <Text style={styles.actionButtonText}>Call</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openInMaps(facility)}
                  >
                    <Navigation size={16} color="#28A745" />
                    <Text style={styles.actionButtonText}>Directions</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => showFacilityMap(facility)}
                  >
                    <MapPin size={16} color="#0066CC" />
                    <Text style={styles.actionButtonText}>View Map</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMapModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedFacility?.name}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowMapModal(false)}
            >
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.mapContainer}>
            {/* Embedded Google Maps */}
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dO_BcqCGAOtEtE&q=${selectedFacility?.latitude},${selectedFacility?.longitude}&zoom=15`}
              allowFullScreen
            />
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalActionButton}
              onPress={() => {
                if (selectedFacility) {
                  openInMaps(selectedFacility);
                }
              }}
            >
              <Navigation size={20} color="white" />
              <Text style={styles.modalActionText}>Get Directions</Text>
            </TouchableOpacity>
            
            {selectedFacility?.phone && (
              <TouchableOpacity
                style={[styles.modalActionButton, { backgroundColor: '#28A745' }]}
                onPress={() => {
                  if (selectedFacility?.phone) {
                    callFacility(selectedFacility.phone);
                  }
                }}
              >
                <Phone size={20} color="white" />
                <Text style={styles.modalActionText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMapModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedFacility?.name}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowMapModal(false)}
            >
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.mapContainer}>
            {/* Embedded Google Maps */}
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dO_BcqCGAOtEtE&q=${selectedFacility?.latitude},${selectedFacility?.longitude}&zoom=15`}
              allowFullScreen
            />
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalActionButton}
              onPress={() => {
                if (selectedFacility) {
                  openInMaps(selectedFacility);
                }
              }}
            >
              <Navigation size={20} color="white" />
              <Text style={styles.modalActionText}>Get Directions</Text>
            </TouchableOpacity>
            
            {selectedFacility?.phone && (
              <TouchableOpacity
                style={[styles.modalActionButton, { backgroundColor: '#28A745' }]}
                onPress={() => {
                  if (selectedFacility?.phone) {
                    callFacility(selectedFacility.phone);
                  }
                }}
              >
                <Phone size={20} color="white" />
                <Text style={styles.modalActionText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginLeft: 12,
  },
  refreshButton: {
    padding: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  environmentBadge: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  environmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0066CC',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'monospace',
  },
  filtersContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    maxHeight: 80,
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    gap: 6,
    height: 32,
  },
  filterButtonActive: {
    backgroundColor: '#0066CC',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  recommendationsContainer: {
    gap: 12,
  },
  recommendationCard: {
    backgroundColor: '#EBF4FF',
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
    padding: 16,
    borderRadius: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  facilityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  facilityHeader: {
    marginBottom: 12,
  },
  facilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  facilityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  facilityDetails: {
    flex: 1,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  facilityType: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  facilityDistance: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '500',
  },
  facilityAddress: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 18,
  },
  facilityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  facilityMetaText: {
    fontSize: 12,
    color: '#64748B',
  },
  facilityActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F8FAFB',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  modalActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  modalActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});