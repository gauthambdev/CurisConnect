import { Provider as PaperProvider } from 'react-native-paper';
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
  UploadDocScreen,
  BookAppointments,
  MedicalHistory,
  ManageUsers,
  SystemSettings,
  ProfileScreen,
  QuickDiagnosis,
  UpcomingAppointments,
  AppPreferences,
} from './src/screens';

const Stack = createStackNavigator();

export default function App() {
  return (
    <PaperProvider theme={theme}>
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
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}