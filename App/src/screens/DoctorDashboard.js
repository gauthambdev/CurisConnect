import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart } from "react-native-chart-kit";
import Background from "../components/Background";
import Logo from "../components/Logo";
import Header from "../components/Header";
import Button from "../components/Button";
import DashboardCard from "../components/DashboardCard";
import { logout } from "../helpers/logout";
import { theme } from "../core/theme";

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  decimalPlaces: 0,
};

const DoctorDashboard = ({ navigation }) => {
  const [appointmentData, setAppointmentData] = useState({
    labels: ["8 AM", "10 AM", "12 PM", "2 PM", "4 PM", "6 PM"],
    datasets: [
      {
        data: [2, 5, 8, 3, 6, 4], // Example data points
        color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`, // Line color
        strokeWidth: 2,
      },
    ],
  });

  useEffect(() => {
    // Here you would fetch data from Firebase and update state dynamically
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Background>
        <Logo />
        <Header>Doctor Dashboard</Header>
        <ScrollView contentContainerStyle={styles.scrollViewContainer}>
          <View style={styles.chartContainer}>
            <LineChart
              data={appointmentData}
              width={300}
              height={200}
              chartConfig={chartConfig}
              bezier
            />
          </View>
          <DashboardCard 
            title="Nurse Duty Scheduling" 
            action={{ label: "Schedule", onPress: () => navigation.navigate("NurseSchedule") }} 
          />
          <DashboardCard 
            title="Patient Consultations" 
            action={{ label: "View Documents", onPress: () => navigation.navigate("ConsultationDocs") }} 
          />
          <DashboardCard 
            title="System Settings" 
            action={{ label: "View", onPress: () => navigation.navigate("SystemSettings") }} 
          />
        </ScrollView>
        <View style={styles.logoutButtonContainer}>
          <Button
            mode="outlined"
            onPress={() => logout(navigation)}
            style={styles.backButton} 
          >
            Logout
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
  chartContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  logoutButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    width: '100%',
  },
  backButton: {
    width: '100%',
    borderColor: theme.colors.primary,
  },
});

export default DoctorDashboard;


// dynamic greeting 
// nurse duty schdules 
//patient consultations