import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, TextInput, StatusBar, Dimensions, Alert, Animated } from 'react-native';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import Background from '../../components/Background';
import Header from '../../components/Header';
import DashboardCard from '../../components/DashboardCard';
import { theme } from '../../core/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Get screen width for dynamic sizing
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const OVERVIEW_METRICS = [
  { icon: 'account-group', label: 'Patients', key: 'totalPatients' },
  { icon: 'doctor', label: 'Doctors', key: 'totalDoctors' },
  { icon: 'calendar', label: 'Appointments', key: 'totalAppointments' },
  { icon: 'file-document', label: 'Files Uploaded', key: 'totalFiles' },
];

const AdminDashboard = ({ navigation }) => {
  const insets = useSafeAreaInsets(); // Get safe area insets
  const [adminName, setAdminName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [analyticsData, setAnalyticsData] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalFiles: 0,
    activePatients: 0,
    activeDoctors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const metricsScrollViewRef = useRef(null);
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0);

  const dashboardItems = [
    { icon: 'account-group', title: 'Patients', subtitle: 'View all patients', screen: 'ViewPatients' },
    { icon: 'doctor', title: 'Add Doctor', subtitle: 'Register new doctors', screen: 'AddDoctor' },
    { icon: 'hospital-building', title: 'Add Hospital', subtitle: 'Register new hospitals', screen: 'AddHospital' },
    { icon: 'hospital-building', title: 'View Hospitals', subtitle: 'View all registered hospitals', screen: 'ViewHospitals' },
    { icon: 'account-plus', title: 'Add Admin', subtitle: 'Register new admins', screen: 'AddAdmin' },
  ];

  const metricsData = [
    { icon: 'account-group', number: analyticsData.totalPatients, label: 'Patients' },
    { icon: 'doctor', number: analyticsData.totalDoctors, label: 'Doctors' },
  ];

  const filteredItems = dashboardItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          console.log('Admin UID:', user.uid); // Debug
          const adminDocRef = doc(db, 'admins', user.uid);
          const adminDoc = await getDoc(adminDocRef);
          if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            const fullName = `${adminData.firstName || ''} ${adminData.lastName || ''}`.trim();
            setAdminName(fullName || adminData.email || 'Admin');
          } else {
            setAdminName('Profile Incomplete');
            Alert.alert('Profile Incomplete', 'Please complete your admin profile in the Profile tab.');
          }
        } else {
          setAdminName('Guest Admin');
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
        setAdminName('Error loading profile');
      }
    };

    const fetchAnalyticsData = async () => {
      try {
        // Count patients from 'users' (role: 'patient') and 'patients' collections
        let totalPatients = 0;
        let totalDoctors = 0;
        let totalAppointments = 0;
        let totalFiles = 0;

        // Users collection
        const usersSnapshot = await getDocs(collection(db, 'users'));
        totalPatients += usersSnapshot.docs.filter(doc => doc.data().role === 'patient').length;
        totalDoctors += usersSnapshot.docs.filter(doc => doc.data().role === 'doctor').length;

        // Patients collection
        try {
          const patientsSnapshot = await getDocs(collection(db, 'patients'));
          totalPatients += patientsSnapshot.size;
        } catch (e) {}

        // Medicalstaff collection
        try {
          const doctorsSnapshot = await getDocs(collection(db, 'medicalstaff'));
          totalDoctors += doctorsSnapshot.size;
        } catch (e) {}

        // Appointments collection
        try {
          totalAppointments = (await getDocs(collection(db, 'appointments'))).size;
        } catch (e) {}

        // Files collection
        try {
          totalFiles += (await getDocs(collection(db, 'files'))).size;
        } catch (e) {}
        // uploadedFiles collection (if exists)
        try {
          totalFiles += (await getDocs(collection(db, 'uploadedFiles'))).size;
        } catch (e) {}
        // uploads collection (if exists)
        try {
          totalFiles += (await getDocs(collection(db, 'uploads'))).size;
        } catch (e) {}

        setAnalyticsData({
          totalPatients,
          totalDoctors,
          totalAppointments,
          totalFiles,
        });
        setLoading(false);
      } catch (error) {
        setError('Failed to load analytics. Please try again later.');
        setLoading(false);
      }
    };

    fetchAdminData();
    fetchAnalyticsData();
  }, []);

  // Slideshow effect for overview metrics
  useEffect(() => {
    if (loading || !metricsScrollViewRef.current) return;
    const cardWidth = 110 + 12; // Card width + margin right
    const visibleItems = 2; // Number of items visible at once
    const totalItems = OVERVIEW_METRICS.length;
    const interval = setInterval(() => {
      let nextIndex = (currentScrollIndex + 1) % (totalItems - visibleItems + 1);
      if (nextIndex === 0 && currentScrollIndex === totalItems - visibleItems) {
        metricsScrollViewRef.current.scrollTo({ x: 0, animated: true });
      } else {
        metricsScrollViewRef.current.scrollTo({ x: nextIndex * cardWidth, animated: true });
      }
      setCurrentScrollIndex(nextIndex);
    }, 3000);
    return () => clearInterval(interval);
  }, [loading, currentScrollIndex]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.safeArea, { paddingTop: Math.max(insets.top, 0) }]} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.headerContainer}>
          <Header>Hi {adminName} 👋</Header>
        </View>
        <Background style={[styles.background, { width: '100%' }]}>
          <ScrollView
            contentContainerStyle={[styles.scrollViewContainer, { paddingBottom: insets.bottom + 80 }]}
            showsVerticalScrollIndicator={true}
            horizontal={false}
          >
            <View style={[styles.searchContainer, { width: '100%' }]}>
              <TextInput
                placeholder="Search dashboard..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { width: '100%' }]}
              />
            </View>
            <View style={styles.overviewSection}>
              <Text style={styles.sectionTitle}>Overview</Text>
              {loading ? (
                <Text style={styles.loadingText}>Loading...</Text>
              ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : (
                <View style={styles.slideshowContainer}>
                  <ScrollView
                    ref={metricsScrollViewRef}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.metricsScrollContainer}
                    scrollEventThrottle={16}
                    onScroll={(event) => {
                      const scrollPosition = event.nativeEvent.contentOffset.x;
                      const cardWidth = 110 + 12;
                      const newIndex = Math.round(scrollPosition / cardWidth);
                      if (newIndex !== currentScrollIndex) {
                        setCurrentScrollIndex(newIndex);
                      }
                    }}
                  >
                    {OVERVIEW_METRICS.map((metric, index) => (
                      <View key={index} style={styles.metricCard}>
                        <Icon name={metric.icon} size={28} color={theme.colors.primary} />
                        <Text style={styles.metricNumber}>{analyticsData[metric.key] || 0}</Text>
                        <Text style={styles.metricLabel}>{metric.label}</Text>
                      </View>
                    ))}
                  </ScrollView>
                  <View style={styles.indicatorContainer}>
                    {Array(OVERVIEW_METRICS.length - 1).fill(0).map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.indicator,
                          index === currentScrollIndex ? styles.activeIndicator : {},
                        ]}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.cardGrid}>
              {filteredItems.map(({ icon, title, subtitle, screen }, index) => (
                <DashboardCard
                  key={index}
                  icon={icon}
                  title={title}
                  subtitle={subtitle}
                  onPress={() => navigation.navigate(screen)}
                />
              ))}
            </View>
          </ScrollView>
        </Background>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    width: '100%', // Ensure full-screen width
  },
  background: {
    flex: 1,
    width: '100%', // Ensure Background spans full width
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 0,
    width: '100%',
  },
  scrollViewContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 80, // Base padding for bottom bar
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
    width: '100%', // Full width for search bar
  },
  searchInput: {
    flex: 1,
    color: '#1F2937',
    fontSize: 16,
    width: '100%', // Ensure input spans container
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 10,
  },
  overviewSection: {
    marginVertical: 10,
  },
  slideshowContainer: {
    alignItems: 'center',
  },
  metricsScrollContainer: {
    paddingRight: 16,
    paddingBottom: 5,
  },
  metricCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 110,
    height: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginVertical: 2,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  indicator: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: theme.colors.primary,
    width: 16,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%', // Full width for bottom bar
  },
  bottomBarItem: {
    alignItems: 'center',
  },
  bottomBarText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
    textAlign: 'center',
    padding: 10,
  },
  analyticsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  analyticsCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  analyticsNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginVertical: 2,
  },
  analyticsLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
});

export default AdminDashboard;