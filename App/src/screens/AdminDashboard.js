import React, { useState } from "react";
import { ScrollView, View, TextInput, Text } from "react-native";
import Background from "../components/Background";
import Logo from "../components/Logo";
import Header from "../components/Header";
import Button from "../components/Button";
import DashboardCard from "../components/DashboardCard";
import { logout } from "../helpers/logout";

const AdminDashboard = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const dashboardItems = [
    { title: "Manage Users", screen: "ManageUsers" },
    { title: "Hospital Statistics", screen: "HospitalStats" },
    { title: "Reports & Analytics", screen: "ReportsAnalytics" },
    { title: "System Settings", screen: "SystemSettings" }
  ];

  const filteredItems = dashboardItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Background>
      <Logo />
      <Header>Admin Dashboard</Header>

      {/* Search Bar */}
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#E5E7EB", padding: 10, borderRadius: 8, margin: 16 }}>
        <TextInput
          placeholder="Search dashboard..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ flex: 1, color: "#1F2937" }}
        />
      </View>

      {/* Quick Stats Section */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", paddingHorizontal: 16, paddingBottom: 16 }}>
        <Text style={{ fontWeight: "bold", fontSize: 16 }}>Total Users: 200</Text>
        <Text style={{ fontWeight: "bold", fontSize: 16 }}>Active Appointments: 45</Text>
        <Text style={{ fontWeight: "bold", fontSize: 16, color: "#DC2626" }}>Critical Alerts: 3</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, flexGrow: 1 }}>
        {filteredItems.map(({ title, screen }, index) => (
          <DashboardCard
            key={index}
            title={title}
            action={{ label: "View", onPress: () => navigation.navigate(screen) }}
          />
        ))}
      </ScrollView>

      <Button mode="outlined" onPress={() => logout(navigation)} style={{ margin: 16 }}>
        Logout
      </Button>
    </Background>
  );
};

export default AdminDashboard;
