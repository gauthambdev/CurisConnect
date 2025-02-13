import React from 'react';
import { Provider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { theme } from './src/core/theme';
import {
  StartScreen,
  LoginScreen,
  RegisterScreen,
  ResetPasswordScreen,
  DoctorDashboard,
  PatientDashboard,
  NurseDashboard,
  AdminDashboard,
  UploadDocScreen,  // Import new screens
  BookAppointments,
  MedicalHistory
} from './src/screens';


const Stack = createStackNavigator();

export default function App() {
  return (
    <Provider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="StartScreen"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="StartScreen" component={StartScreen} />
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
          <Stack.Screen name="DoctorDashboard" component={DoctorDashboard} />
          <Stack.Screen name="PatientDashboard" component={PatientDashboard} />
          <Stack.Screen name="NurseDashboard" component={NurseDashboard} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
          <Stack.Screen name="UploadDocScreen" component={UploadDocScreen} />
          <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />

          {/* Adding the new screens */}
          <Stack.Screen name="UpcomingAppointments" component={UpcomingAppointments} />
          <Stack.Screen name="BookAppointments" component={BookAppointments} />
          <Stack.Screen name="MedicalHistory" component={MedicalHistory} />

        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}
