import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, ActivityIndicator, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Background from '../../components/Background';
import Header from '../../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../core/theme';

// Get screen width for dynamic sizing
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ViewPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPatients = async () => {
    try {
      const patientsQuery = query(collection(db, 'patients'), orderBy('firstName'));
      const querySnapshot = await getDocs(patientsQuery);
      
      const patientsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setPatients(patientsData);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching patients:', err.message, err.stack);
      setError('Failed to load patients. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(patient =>
    (patient.firstName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (patient.lastName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (patient.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (patient.contact?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const renderPatientItem = ({ item }) => (
    <View style={styles.patientCard}>
      <View style={styles.patientIconContainer}>
        <Icon name="account" size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.patientInfo}>
        <Text style={styles.patientName} numberOfLines={1} ellipsizeMode="tail">
          {(item.firstName || '') + ' ' + (item.lastName || '') || 'Unknown Patient'}
        </Text>
        <View style={styles.detailRow}>
          <Icon name="email" size={18} color={theme.colors.primary} style={styles.detailIcon} />
          <Text style={styles.patientDetail} numberOfLines={1} ellipsizeMode="tail">
            {item.email || 'N/A'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="phone" size={18} color={theme.colors.primary} style={styles.detailIcon} />
          <Text style={styles.patientDetail} numberOfLines={1} ellipsizeMode="tail">
            {item.contact || 'N/A'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Background>
        <View style={styles.headerContainer}>
          <Header>Patients</Header>
        </View>
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={24} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading patients...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={60} color="red" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setLoading(true);
                setError(null);
                fetchPatients();
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredPatients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="account-off" size={60} color="#666" />
            <Text style={styles.emptyText}>
              {searchQuery.length > 0 ? 'No patients match your search' : 'No patients registered yet'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredPatients}
            renderItem={renderPatientItem}
            keyExtractor={item => typeof item.id === 'string' ? item.id : String(item.id)}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            horizontal={false}
            style={styles.flatList}
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    width: '100%',
  },
  searchIcon: {
    marginRight: 12,
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
  flatList: {
    width: '100%',
  },
  patientCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 6,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
    width: '100%',
  },
  patientIconContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 6,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
    width: '100%',
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    width: '100%',
  },
  detailIcon: {
    marginRight: 10,
  },
  patientDetail: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
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
});

export default ViewPatients;