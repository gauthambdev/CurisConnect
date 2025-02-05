import React from "react";
import { ScrollView } from "react-native";
import Background from "../components/Background";
import Logo from "../components/Logo";
import Header from "../components/Header";
import Button from "../components/Button";
import DashboardCard from "../components/DashboardCard";
import { logout } from "../helpers/logout";

const AdminDashboard = ({ navigation }) => (
  <Background>
    <Logo />
    <Header>Admin Dashboard</Header>
    <ScrollView>
      <DashboardCard title="Manage Users" action={{ label: "View", onPress: () => navigation.navigate("ManageUsers") }} />
      <DashboardCard title="Hospital Statistics" action={{ label: "View", onPress: () => navigation.navigate("HospitalStats") }} />
    </ScrollView>
    <Button mode="outlined" onPress={() => logout(navigation)}>Logout</Button>
  </Background>
);

export default AdminDashboard;
