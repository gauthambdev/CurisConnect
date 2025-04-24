import React, { useState } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { theme } from './src/core/theme';
import SplashScreen from './src/components/SplashScreen'; // You'll create this component
import * as screens from './src/screens/index';

const Stack = createStackNavigator();

const AppNavigator = () => (
  <Stack.Navigator
    initialRouteName="StartScreen"
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="StartScreen" component={screens.StartScreen} />
    <Stack.Screen name="LoginScreen" component={screens.LoginScreen} />
    <Stack.Screen name="RegisterScreen" component={screens.RegisterScreen} />
    <Stack.Screen name="ResetPasswordScreen" component={screens.ResetPasswordScreen} />
    <Stack.Screen name="ChangePassword" component={screens.ResetPasswordScreen} />
    <Stack.Screen name="DoctorDashboard" component={screens.DoctorDashboard} />
    <Stack.Screen name="PatientDashboard" component={screens.PatientDashboard} />
    <Stack.Screen name="AdminDashboard" component={screens.AdminDashboard} />
    
    <Stack.Screen name="UploadDocScreen" component={screens.UploadDocScreen} />
    <Stack.Screen name="BookAppointments" component={screens.BookAppointments} />
    <Stack.Screen name="MedicalHistory" component={screens.MedicalHistory} />
    <Stack.Screen name="ProfileScreen" component={screens.ProfileScreen} />
    <Stack.Screen name="QuickDiagnosis" component={screens.QuickDiagnosis} />
    <Stack.Screen name="UpcomingAppointments" component={screens.UpcomingAppointments} />
    <Stack.Screen name="PastAppointments" component={screens.PastAppointments} />
    <Stack.Screen name="Feedback" component={screens.Feedback} />
    <Stack.Screen name="Pharmacies" component={screens.Pharmacies} />
    <Stack.Screen name="Hospitals" component={screens.Hospitals} />

    <Stack.Screen name="ViewPatients" component={screens.ViewPatients} />
    <Stack.Screen name="DocDiagnoses" component={screens.DocDiagnoses} />
    <Stack.Screen name="PatientDocs" component={screens.PatientDocs} />
    <Stack.Screen name="DocUploadDocScreen" component={screens.DocUploadDocScreen} />
    <Stack.Screen name="DocProfileScreen" component={screens.DocProfileScreen} />
    <Stack.Screen name="DocPastAppointments" component={screens.DocPastAppointments} />
    <Stack.Screen name="DocUpcomingAppointments" component={screens.DocUpcomingAppointments} />
    <Stack.Screen name="DocFeedback" component={screens.DocFeedback} />

    <Stack.Screen name="AddAdmin" component={screens.AddAdmin} />
    <Stack.Screen name="AddUser" component={screens.AddUser} />
    <Stack.Screen name="AddHospital" component={screens.AddHospital} />
    <Stack.Screen name="AddDoctor" component={screens.AddDoctor} />
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