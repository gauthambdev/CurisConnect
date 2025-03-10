import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Background from "../components/Background";
import Header from "../components/Header";
import Button from "../components/Button";
import DashboardCard from "../components/DashboardCard";
import { theme } from "../core/theme";

const SystemSettings = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Background>
        <Header>System Settings</Header>
        <ScrollView contentContainerStyle={styles.scrollViewContainer}>
          <DashboardCard 
            title="Profile Settings" 
            action={{ label: "Edit", onPress: () => navigation.navigate("ProfileSettings") }} 
          />
          <DashboardCard 
            title="Notification Preferences" 
            action={{ label: "Manage", onPress: () => navigation.navigate("NotificationSettings") }} 
          />
          <DashboardCard 
            title="Security & Privacy" 
            action={{ label: "Update", onPress: () => navigation.navigate("SecurityPrivacy") }} 
          />
          <DashboardCard 
            title="App Preferences" 
            action={{ label: "Customize", onPress: () => navigation.navigate("AppPreferences") }} 
          />
        </ScrollView>
        <View style={styles.buttonContainer}>
          <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.backButton}>
            Back
          </Button>
        </View>
      </Background>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollViewContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    width: "100%",
  },
  backButton: {
    width: "100%",
    borderColor: theme.colors.primary,
  },
});

export default SystemSettings;
