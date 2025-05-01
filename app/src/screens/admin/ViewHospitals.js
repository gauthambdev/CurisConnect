import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Background from '../../components/Background';
import Header from '../../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../core/theme';

const ViewHospitals = ({ navigation }) => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchHospitalsAndDoctors = async () => {
      try {
        // Fetch hospitals
        const hospitalsQuery = query(collection(db, 'hospitals'), orderBy('name'));
        const hospitalsSnapshot = await getDocs(hospitalsQuery);
        
        const hospitalsData = await Promise.all(hospitalsSnapshot.docs.map(async (doc) => {
          const hospitalData = {
            id: doc.id,
            ...doc.data()
          };

          // Fetch doctors for this hospital
          const doctorsQuery = query(
            collection(db, 'medicalstaff'),
            where('hospital', '==', doc.id),
            where('role', '==', 'doctor')
          );
          const doctorsSnapshot = await getDocs(doctorsQuery);
          
          const doctors = doctorsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          return {
            ...hospitalData,
            doctors,
            doctorsCount: doctors.length
          };
        }));
        
        setHospitals(hospitalsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching hospitals and doctors:', err);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };

    fetchHospitalsAndDoctors();
  }, []);

  const filteredHospitals = hospitals.filter(hospital => 
    hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hospital.street?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hospital.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderHospitalItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.hospitalCard}
      onPress={() => navigation.navigate('HospitalDetails', { 
        hospitalId: item.id,
        hospitalName: item.name
      })}
    >
      <Text style={styles.hospitalNameHeader}>{item.name}</Text>
      
      <View style={styles.hospitalCardContent}>
        <View style={styles.hospitalIconContainer}>
          <Icon name="hospital-building" size={30} color={theme.colors.primary} />
        </View>
        <View style={styles.hospitalInfo}>
          <View style={styles.locationContainer}>
            <Icon name="map-marker" size={16} color={theme.colors.primary} />
            <Text style={styles.hospitalLocation}>
              {item.street}{item.city ? `, ${item.city}` : ''}{item.state ? `, ${item.state}` : ''}
            </Text>
          </View>
          <View style={styles.contactContainer}>
            <Icon name="phone" size={16} color={theme.colors.primary} />
            <Text style={styles.contactText}>{item.contact || 'No contact'}</Text>
          </View>
          <View style={styles.doctorsContainer}>
            <Icon name="doctor" size={16} color={theme.colors.primary} />
            <Text style={styles.doctorsText}>
              {item.doctorsCount} Doctors
            </Text>
          </View>
        </View>
        <Icon name="chevron-right" size={24} color="#666" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Background>
        <View style={styles.headerContainer}>
          <Header>Hospitals</Header>
        </View>

        <View style={styles.searchContainer}>
          <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hospitals..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading hospitals...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={50} color="red" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setLoading(true);
                setError(null);
                // Re-fetch hospitals
                fetchHospitalsAndDoctors();
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredHospitals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="hospital-off" size={50} color="#666" />
            <Text style={styles.emptyText}>
              {searchQuery.length > 0 
                ? "No hospitals match your search" 
                : "No hospitals registered yet"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredHospitals}
            renderItem={renderHospitalItem}
            keyExtractor={item => typeof item.id === 'string' ? item.id : String(item.id)}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Background>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 10,
    width: '100%',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#1F2937',
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    width: '100%',
  },
  hospitalCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
  },
  hospitalNameHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
  },
  hospitalCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  hospitalIconContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hospitalInfo: {
    flex: 1,
    width: '100%',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  hospitalLocation: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 6,
    flex: 1,
  },
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  contactText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
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
    width: '100%',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  doctorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  doctorsText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
});

export default ViewHospitals;