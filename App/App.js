import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/navigation/navigationRef';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import NotificationService from './src/services/NotificationService';
import { LogBox } from 'react-native';
import * as Notifications from 'expo-notifications';
import { auth } from './src/firebaseConfig';
import { Provider as PaperProvider } from 'react-native-paper';
// import { setupNotifications } from './src/utils/notifications';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const App = () => {
  const [userRole, setUserRole] = useState(null);

  return (
    <PaperProvider>
      <NotificationProvider userRole={userRole}>
        <ThemeProvider>
          <NavigationContainer ref={navigationRef}>
            <AppNavigator setUserRole={setUserRole} />
          </NavigationContainer>
        </ThemeProvider>
      </NotificationProvider>
    </PaperProvider>
  );
};

export default App;