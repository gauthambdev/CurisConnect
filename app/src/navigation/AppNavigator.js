import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import * as Notifications from 'expo-notifications';
import { setupNotifications } from '../utils/notifications';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import StartScreen from '../screens/StartScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AdminDashboard from '../screens/admin/AdminDashboard';
import PatientDashboard from '../screens/patient/PatientDashboard';
import DoctorDashboard from '../screens/doctor/DoctorDashboard';
import ViewHospitals from '../screens/admin/ViewHospitals';
import ViewPatients from '../screens/admin/ViewPatients';
import AddHospital from '../screens/admin/AddHospital';
import AddAdmin from '../screens/admin/AddAdmin';
import AddDoctor from '../screens/admin/AddDoctor';
import NotificationSettings from '../screens/NotificationSettings';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/patient/ProfileScreen';
import UpcomingAppointments from '../screens/patient/UpcomingAppointments';
import BookAppointments from '../screens/patient/BookAppointments';
import MedicalHistory from '../screens/patient/MedicalHistory';
import UploadDocScreen from '../screens/patient/UploadDocScreen';
import QuickDiagnosis from '../screens/patient/QuickDiagnosis';
import PastAppointments from '../screens/patient/PastAppointments';
import Feedback from '../screens/patient/Feedback';
import Pharmacies from '../screens/patient/Pharmacies';
import Hospitals from '../screens/patient/Hospitals';
import DocUpcomingAppointments from '../screens/doctor/DocUpcomingAppointments';
import DocPastAppointments from '../screens/doctor/DocPastAppointments';
import DocDiagnoses from '../screens/doctor/DocDiagnoses';
import DocFeedback from '../screens/doctor/DocFeedback';
import DocUploadDocScreen from '../screens/doctor/DocUploadDocScreen';
import DocProfileScreen from '../screens/doctor/DocProfileScreen';
import ViewDocPatients from '../screens/doctor/ViewDocPatients';
import PatientDocs from '../screens/doctor/PatientDocs';
import SummaryScreen from '../screens/patient/SummaryScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import DoctorNotificationsScreen from '../screens/doctor/NotificationsScreen';
import HospitalDetails from '../screens/admin/HospitalDetails';
import ViewHistory from '../screens/doctor/ViewHistory';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AdminTabs = () => {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={AdminDashboard} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={AdminProfileScreen} />
    </Tab.Navigator>
  );
};

const PatientTabs = () => {
  const { theme } = useTheme();
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'QuickDiagnosis') {
            iconName = focused ? 'flash' : 'flash-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={PatientDashboard} />
      <Tab.Screen name="QuickDiagnosis" component={QuickDiagnosis} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarBadge: unreadCount > 0 ? unreadCount : undefined }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const DoctorTabs = () => {
  const { theme } = useTheme();
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={DoctorDashboard} />
      <Tab.Screen
        name="Notifications"
        component={DoctorNotificationsScreen}
        options={{ tabBarBadge: unreadCount > 0 ? unreadCount : undefined }}
      />
      <Tab.Screen name="Profile" component={DocProfileScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, _setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const collections = ["patients", "medicalstaff", "admins"];
          let foundRole = null;
          for (const collectionName of collections) {
            const userDoc = await getDoc(doc(db, collectionName, user.uid));
            if (userDoc.exists()) {
              foundRole = userDoc.data().role;
              break;
            }
          }
          _setUserRole(foundRole);
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      } else {
        _setUserRole(null);
      }
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return unsubscribe;
  }, [initializing]);

  useEffect(() => {
    if (user && userRole === 'patient') {
      setupNotifications();
    }
  }, [user, userRole]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Start" component={StartScreen} />

      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          {userRole === 'admin' && <Stack.Screen name="AdminTabs" component={AdminTabs} />}
          {userRole === 'patient' && <Stack.Screen name="PatientTabs" component={PatientTabs} />}
          {userRole === 'doctor' && <Stack.Screen name="DoctorTabs" component={DoctorTabs} />}
        </>
      )}

      {/* Common screens */}
      {/* Doctor stack screens */}
      <Stack.Screen name="DocUpcomingAppointments" component={DocUpcomingAppointments} />
      <Stack.Screen name="DocPastAppointments" component={DocPastAppointments} />
      <Stack.Screen name="DocDiagnoses" component={DocDiagnoses} />
      <Stack.Screen name="DocFeedback" component={DocFeedback} />
      <Stack.Screen name="DocUploadDocScreen" component={DocUploadDocScreen} />
      <Stack.Screen name="ViewDocPatients" component={ViewDocPatients} />
      <Stack.Screen name="ViewHistory" component={ViewHistory} />
      {/* Patient stack screens */}
      <Stack.Screen name="UpcomingAppointments" component={UpcomingAppointments} />
      <Stack.Screen name="BookAppointments" component={BookAppointments} />
      <Stack.Screen name="MedicalHistory" component={MedicalHistory} />
      <Stack.Screen name="UploadDocScreen" component={UploadDocScreen} />
      <Stack.Screen name="PastAppointments" component={PastAppointments} />
      <Stack.Screen name="Feedback" component={Feedback} />
      <Stack.Screen name="Pharmacies" component={Pharmacies} />
      <Stack.Screen name="Hospitals" component={Hospitals} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="PatientDocs" component={PatientDocs} />
      <Stack.Screen name="SummaryScreen" component={SummaryScreen} />
      {/* Admin stack screens */}
      <Stack.Screen name="ViewHospitals" component={ViewHospitals} />
      <Stack.Screen name="HospitalDetails" component={HospitalDetails} />
      <Stack.Screen name="ViewPatients" component={ViewPatients} />
      <Stack.Screen name="AddHospital" component={AddHospital} />
      <Stack.Screen name="AddAdmin" component={AddAdmin} />
      <Stack.Screen name="AddDoctor" component={AddDoctor} />
      <Stack.Screen name="AdminProfileScreen" component={AdminProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettings} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;