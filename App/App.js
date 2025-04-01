import React, { useState } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { theme } from './src/core/theme';
import SplashScreen from './src/components/SplashScreen'; // You'll create this component
import {
  StartScreen,
  LoginScreen,
  RegisterScreen,
  ResetPasswordScreen,
  DoctorDashboard,
  PatientDashboard,
  NurseDashboard,
  AdminDashboard,
  UploadDocScreen,
  BookAppointments,
  MedicalHistory,
  ManageUsers,
  SystemSettings,
  ProfileScreen,
  QuickDiagnosis,
  UpcomingAppointments,
  AppPreferences,
  NotificationSettings
} from './src/screens';

const Stack = createStackNavigator();

const AppNavigator = () => (
  <Stack.Navigator
    initialRouteName="StartScreen"
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="StartScreen" component={StartScreen} />
    <Stack.Screen name="LoginScreen" component={LoginScreen} />
    <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
    <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />
    <Stack.Screen name="ChangePassword" component={ResetPasswordScreen} />
    <Stack.Screen name="DoctorDashboard" component={DoctorDashboard} />
    <Stack.Screen name="PatientDashboard" component={PatientDashboard} />
    <Stack.Screen name="NurseDashboard" component={NurseDashboard} />
    <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
    <Stack.Screen name="UploadDocScreen" component={UploadDocScreen} />
    <Stack.Screen name="BookAppointments" component={BookAppointments} />
    <Stack.Screen name="MedicalHistory" component={MedicalHistory} />
    <Stack.Screen name="ManageUsers" component={ManageUsers} />
    <Stack.Screen name="SystemSettings" component={SystemSettings} />
    <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
    <Stack.Screen name="QuickDiagnosis" component={QuickDiagnosis} />
    <Stack.Screen name="UpcomingAppointments" component={UpcomingAppointments} />
    <Stack.Screen name="AppPreferences" component={AppPreferences} />
    <Stack.Screen name='NotificationSettings' component={NotificationSettings} />
  </Stack.Navigator>
);

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  
  return (
    <PaperProvider theme={{...theme, colors: {...theme.colors, primary: '#670cce'}}}>
      <NavigationContainer>
        {isLoading ? (
          <SplashScreen onFinish={() => setIsLoading(false)} />
        ) : (
          <AppNavigator />
        )}
      </NavigationContainer>
    </PaperProvider>
  );
}