import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Background from '../../components/Background';
import Header from '../../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../core/theme';

const HospitalDetails = ({ route, navigation }) => {
  const { hospitalId, hospitalName } = route.params;
  const [hospital, setHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchHospitalAndDoctors = async () => {
      try {
        // Fetch hospital details
        const hospitalRef = doc(db, 'hospitals', hospitalId);
        const hospitalSnap = await getDoc(hospitalRef);
        
        if (hospitalSnap.exists()) {
          setHospital({
            id: hospitalSnap.id,
            ...hospitalSnap.data()
          });
        } else {
          setError('Hospital not found');
          setLoading(false);
          return;
        }
        
        // Fetch doctors associated with this hospital
        const doctorsQuery = query(
          collection(db, 'medicalstaff'),
          where('hospital', '==', hospitalId),
          where('role', '==', 'doctor')
        );
        
        const doctorsSnapshot = await getDocs(doctorsQuery);
        const doctorsList = doctorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setDoctors(doctorsList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching hospital details or doctors:', err);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };

    fetchHospitalAndDoctors();
  }, [hospitalId]);

  const filteredDoctors = doctors.filter(doctor => 
    (doctor.firstName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (doctor.lastName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (doctor.specialization?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const renderDoctorItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.doctorCard}
     
    >
      <View style={styles.doctorCardContent}>
        <View style={styles.doctorIconContainer}>
          <Icon name="doctor" size={30} color={theme.colors.primary} />
        </View>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>
            Dr. {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.doctorSpecialization}>
            {item.speciality}
          </Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Icon name="phone" size={14} color={theme.colors.primary} />
              <Text style={styles.statText}>{item.contact}</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="email" size={14} color={theme.colors.primary} />
              <Text style={styles.statText}>{item.email || 'No email'}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Background>
        <View style={styles.headerContainer}>
          <Header>{hospitalName}</Header>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading hospital details...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={50} color="red" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.retryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            {/* Hospital Info Card */}
            <View style={styles.hospitalInfoCard}>
              <View style={styles.hospitalHeaderRow}>
                <Icon name="hospital-building" size={24} color={theme.colors.primary} />
                <Text style={styles.hospitalInfoTitle}>{hospital.name}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Icon name="map-marker" size={20} color="#666" />
                <Text style={styles.detailText}>
                {hospital.street}{hospital.city ? `, ${hospital.city}` : ''}{hospital.state ? `, ${hospital.state}` : ''}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Icon name="phone" size={20} color="#666" />
                <Text style={styles.detailText}>{hospital.contact || 'No phone number'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Icon name="email" size={20} color="#666" />
                <Text style={styles.detailText}>{hospital.email || 'No email address'}</Text>
              </View>
              
              <View style={styles.doctorStatRow}>
                <View style={styles.doctorStatBox}>
                  <Icon name="doctor" size={24} color={theme.colors.primary} />
                  <Text style={styles.doctorStatValue}>{doctors.length}</Text>
                  <Text style={styles.doctorStatLabel}>Doctors</Text>
                </View>
              </View>
            </View>
            
            {/* Doctors Section */}
            <View style={styles.doctorsSection}>
              <Text style={styles.sectionTitle}>Doctors</Text>
              
              <View style={styles.searchContainer}>
                <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search doctors..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Icon name="close" size={20} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
              
              {filteredDoctors.length === 0 ? (
                <View style={styles.emptyDoctorsContainer}>
                  <Icon name="doctor-off" size={40} color="#666" />
                  <Text style={styles.emptyText}>
                    {searchQuery.length > 0 
                      ? "No doctors match your search" 
                      : "No doctors registered for this hospital"}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredDoctors}
                  renderItem={renderDoctorItem}
                  keyExtractor={item => typeof item.id === 'string' ? item.id : String(item.id)}
                  contentContainerStyle={styles.doctorsList}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false} // Disable scrolling for this list as it's inside a ScrollView
                />
              )}
            </View>
          </ScrollView>
        )}
      </Background>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  hospitalInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  hospitalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hospitalInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  doctorStatRow: {
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  doctorStatBox: {
    alignItems: 'center',
  },
  doctorStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 4,
  },
  doctorStatLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  doctorsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#1F2937',
    fontSize: 16,
  },
  emptyDoctorsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  doctorsList: {
    paddingBottom: 10,
  },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 6,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  doctorCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorIconContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  doctorSpecialization: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 2,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
});

export default HospitalDetails;