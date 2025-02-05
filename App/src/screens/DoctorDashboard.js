import React from "react";
import { ScrollView } from "react-native";
import Background from "../components/Background";
import Logo from "../components/Logo";
import Header from "../components/Header";
import Button from "../components/Button";
import DashboardCard from "../components/DashboardCard";
import { logout } from "../helpers/logout";

const DoctorDashboard = ({ navigation }) => (
  <Background>
    <Logo />
    <Header>Doctor Dashboard</Header>
    <ScrollView>
      <DashboardCard title="Today's Appointments" content={["Total: 12", "Completed: 5", "Pending: 7"]} />
      <DashboardCard title="Nurse Duty Scheduling" action={{ label: "Schedule", onPress: () => navigation.navigate("NurseSchedule") }} />
      <DashboardCard title="Patient Consultations" action={{ label: "View Documents", onPress: () => navigation.navigate("ConsultationDocs") }} />
    </ScrollView>
    <Button mode="outlined" onPress={() => logout(navigation)}>Logout</Button>
  </Background>
);

export default DoctorDashboard;
