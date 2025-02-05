import React from "react";
import { ScrollView } from "react-native";
import Background from "../components/Background";
import Logo from "../components/Logo";
import Header from "../components/Header";
import Button from "../components/Button";
import DashboardCard from "../components/DashboardCard";
import { logout } from "../helpers/logout";

const NurseDashboard = ({ navigation }) => (
  <Background>
    <Logo />
    <Header>Nurse Dashboard</Header>
    <ScrollView>
      <DashboardCard title="Duty Schedule" action={{ label: "View", onPress: () => navigation.navigate("DutySchedule") }} />
      <DashboardCard title="Patient Assistance" action={{ label: "Assist", onPress: () => navigation.navigate("PatientCare") }} />
    </ScrollView>
    <Button mode="outlined" onPress={() => logout(navigation)}>Logout</Button>
  </Background>
);

export default NurseDashboard;
