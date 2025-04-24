import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity, TextInput, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import Background from '../../components/Background';
import Header from '../../components/Header';
import DashboardCard from '../../components/DashboardCard';
import { theme } from '../../core/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Get screen width for dynamic sizing
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AdminDashboard = ({ navigation }) => {
  const insets = useSafeAreaInsets(); // Get safe area insets
  const [adminName, setAdminName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [analyticsData, setAnalyticsData] = useState({
    totalPatients: 0,
    activePatients: 0,
    totalDoctors: 0,
    activeDoctors: 0,
    totalNurses: 0,
    activeNurses: 0,
    totalHospitals: 0,
    totalBeds: 0,
    occupiedBeds: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    avgAppointmentsPerPatient: 0,
    totalUploads: 0,
    appointmentTrends: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const metricsScrollViewRef = useRef(null);
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0);

  const dashboardItems = [
    { icon: 'hospital', title: 'Hospitals', subtitle: 'View hospitals & doctors', screen: 'ViewHospitals' },
    { icon: 'account-group', title: 'Patients', subtitle: 'View all patients', screen: 'ViewPatients' },
    { icon: 'doctor', title: 'Add Doctor', subtitle: 'Register new doctors', screen: 'AddDoctor' },
    { icon: 'hospital-building', title: 'Add Hospital', subtitle: 'Register new hospitals', screen: 'AddHospital' },
    { icon: 'account-plus', title: 'Add Admin', subtitle: 'Register new admins', screen: 'AddAdmin' },
    { icon: 'account-edit', title: 'Manage Admins', subtitle: 'View & edit admins', screen: 'ManageAdmins' },
  ];

  const metricsData = [
    { icon: 'account-group', number: analyticsData.totalPatients, label: 'Patients' },
    { icon: 'doctor', number: analyticsData.totalDoctors, label: 'Doctors' },
    { icon: 'hospital', number: analyticsData.totalHospitals, label: 'Hospitals' },
    { icon: 'calendar', number: analyticsData.totalAppointments, label: 'Appts' },
    { icon: 'medical-bag', number: analyticsData.totalNurses, label: 'Nurses' },
    { icon: 'file-upload', number: analyticsData.totalUploads, label: 'Uploads' },
  ];

  const filteredItems = dashboardItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const adminDocRef = doc(db, 'admins', user.uid);
          const adminDoc = await getDoc(adminDocRef);
          if (adminDoc.exists()) {
            const adminData = adminDoc.data();
            const fullName = `${adminData.firstName || 'Unknown'} ${adminData.lastName || 'Admin'}`.trim();
            setAdminName(fullName);
          } else {
            setAdminName('Unknown Admin');
          }
        } else {
          setAdminName('Guest Admin');
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
        setAdminName('Guest Admin');
      }
    };

    const fetchAnalyticsData = () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError('No admin logged in. Please log in again.');
          setLoading(false);
          return;
        }

        // Patients
        const patientsUnsubscribe = onSnapshot(collection(db, 'patients'), (snapshot) => {
          const totalPatients = snapshot.size;
          const activePatients = snapshot.docs.filter(doc => doc.data().status === 'active').length;
          setAnalyticsData(prev => ({ ...prev, totalPatients, activePatients }));
        });

        // Medical Staff (Doctors and Nurses)
        const medicalStaffUnsubscribe = onSnapshot(collection(db, 'medicalstaff'), (snapshot) => {
          const totalDoctors = snapshot.docs.filter(doc => doc.data().role === 'doctor').length;
          const activeDoctors = snapshot.docs.filter(doc => doc.data().role === 'doctor' && doc.data().status === 'active').length;
          const totalNurses = snapshot.docs.filter(doc => doc.data().role === 'nurse').length;
          const activeNurses = snapshot.docs.filter(doc => doc.data().role === 'nurse' && doc.data().status === 'active').length;
          setAnalyticsData(prev => ({ ...prev, totalDoctors, activeDoctors, totalNurses, activeNurses }));
        });

        // Hospitals
        const hospitalsUnsubscribe = onSnapshot(collection(db, 'hospitals'), (snapshot) => {
          const totalHospitals = snapshot.size;
          const totalBeds = snapshot.docs.reduce((sum, doc) => sum + (doc.data().totalBeds || 0), 0);
          const occupiedBeds = snapshot.docs.reduce((sum, doc) => sum + (doc.data().occupiedBeds || 0), 0);
          setAnalyticsData(prev => ({ ...prev, totalHospitals, totalBeds, occupiedBeds }));
        });

        // Appointments
        const appointmentsUnsubscribe = onSnapshot(collection(db, 'appointments'), (snapshot) => {
          const totalAppointments = snapshot.size;
          const completedAppointments = snapshot.docs.filter(doc => doc.data().status === 'completed').length;
          const avgAppointmentsPerPatient = totalAppointments / Math.max(analyticsData.totalPatients || 1, 1);

          // Fetch appointments from last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const recentAppointments = snapshot.docs.filter(doc => {
            const appDate = doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date);
            return appDate >= thirtyDaysAgo;
          });
          const appointmentTrends = Array(30).fill(0).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return recentAppointments.filter(doc => {
              const appDate = doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date);
              return appDate.toDateString() === date.toDateString();
            }).length;
          });

          setAnalyticsData(prev => ({
            ...prev,
            totalAppointments,
            completedAppointments,
            avgAppointmentsPerPatient,
            appointmentTrends,
          }));
        });

        // Uploads
        const uploadsUnsubscribe = onSnapshot(collection(db, 'uploads'), (snapshot) => {
          const totalUploads = snapshot.size;
          setAnalyticsData(prev => ({ ...prev, totalUploads }));
        });

        setLoading(false);

        // Cleanup subscriptions
        return () => {
          patientsUnsubscribe();
          medicalStaffUnsubscribe();
          hospitalsUnsubscribe();
          appointmentsUnsubscribe();
          uploadsUnsubscribe();
        };
      } catch (error) {
        console.error('Error fetching analytics data:', error.message);
        setError(`Failed to fetch analytics data: ${error.message}`);
        setLoading(false);
      }
    };

    fetchAdminData();
    fetchAnalyticsData();
  }, []);

  // Slideshow effect
  useEffect(() => {
    if (loading || !metricsScrollViewRef.current) return;

    const cardWidth = 90 + 12; // Card width + margin right
    const visibleItems = 3; // Number of items visible at once
    const totalItems = metricsData.length;

    const interval = setInterval(() => {
      // Calculate next index
      let nextIndex = (currentScrollIndex + 1) % (totalItems - visibleItems + 1);

      // If we've reached the end, rapidly scroll back to the beginning
      if (nextIndex === 0 && currentScrollIndex === totalItems - visibleItems) {
        metricsScrollViewRef.current.scrollTo({ x: 0, animated: true });
      } else {
        // Smoothly scroll to the next card
        metricsScrollViewRef.current.scrollTo({
          x: nextIndex * cardWidth,
          animated: true,
        });
      }

      setCurrentScrollIndex(nextIndex);
    }, 3000); // Change card every 3 seconds

    return () => clearInterval(interval);
  }, [loading, currentScrollIndex, metricsData.length]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        <Background style={[styles.background, { width: '100%' }]}>
          <View style={[styles.headerContainer, { paddingTop: insets.top, width: '100%' }]}>
            <Header>Hi {adminName} 👋</Header>
          </View>

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

            {/* Slideshow Overview Section */}
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
                      const cardWidth = 90 + 12; // width + margin
                      const newIndex = Math.round(scrollPosition / cardWidth);
                      if (newIndex !== currentScrollIndex) {
                        setCurrentScrollIndex(newIndex);
                      }
                    }}
                  >
                    {metricsData.map((metric, index) => (
                      <View key={index} style={styles.metricCard}>
                        <Icon name={metric.icon} size={24} color={theme.colors.primary} />
                        <Text style={styles.metricNumber}>{metric.number}</Text>
                        <Text style={styles.metricLabel}>{metric.label}</Text>
                      </View>
                    ))}
                  </ScrollView>

                  {/* Indicator dots */}
                  <View style={styles.indicatorContainer}>
                    {Array(metricsData.length - 2).fill(0).map((_, index) => (
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

            {/* Dashboard Cards Section */}
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

          {/* Bottom Navigation */}
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom, width: '100%' }]}>
            <TouchableOpacity style={styles.bottomBarItem}>
              <Icon name="home" size={24} color={theme.colors.primary} />
              <Text style={[styles.bottomBarText, { color: theme.colors.primary }]}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bottomBarItem}
              onPress={() => navigation.navigate('ProfileScreen')}
            >
              <Icon name="account" size={24} color="#666" />
              <Text style={styles.bottomBarText}>Profile</Text>
            </TouchableOpacity>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: '100%', // Full width for header
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
    width: 90,
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
});

export default AdminDashboard;