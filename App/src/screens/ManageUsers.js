import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import Background from "../components/Background";
import Logo from "../components/Logo";
import Header from "../components/Header";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("patient");

  const calculateAge = (dobString) => {
    if (!dobString) return "N/A";
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const dayDiff = today.getDate() - dob.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const collections = ["patients", "medicalstaff"];
        let allUsers = [];

        for (const collectionName of collections) {
          const usersRef = collection(db, collectionName);
          const q = query(usersRef, orderBy("firstName"));
          const querySnapshot = await getDocs(q);
          const fetchedUsers = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          allUsers = [...allUsers, ...fetchedUsers];
        }

        setUsers(allUsers);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch users. Please try again later.");
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <Background>
      <Logo />
      <Header>Manage Users</Header>

      <View style={styles.tabContainer}>
        {["patient", "doctor", "nurse"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView horizontal>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.headerCell]}>Name</Text>
            <Text style={[styles.cell, styles.headerCell]}>Age</Text>
            <Text style={[styles.cell, styles.headerCell]}>Sex</Text>
            <Text style={[styles.cell, styles.headerCell]}>Contact</Text>
            <Text style={[styles.cell, styles.headerCell]}>Email</Text>
          </View>
          <ScrollView style={styles.tableBody}>
            {users.filter(user => user.role === activeTab).map((user) => (
              <View key={user.id} style={styles.tableRow}>
                <Text style={styles.cell}>{user.firstName} {user.lastName}</Text>
                <Text style={styles.cell}>{calculateAge(user.dob)}</Text>
                <Text style={styles.cell}>{user.sex}</Text>
                <Text style={styles.cell}>{user.contact}</Text>
                <Text style={styles.cell}>{user.email}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </Background>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#ef4444",
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 16,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#4B0082",
  },
  tabText: {
    color: "#6b7280",
    fontWeight: "bold",
  },
  activeTabText: {
    color: "#4B0082",
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#4B0082",
    paddingVertical: 10,
  },
  tableBody: {
    maxHeight: 400,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 10,
  },
  cell: {
    flex: 1,
    paddingHorizontal: 8,
    textAlign: "center",
  },
  headerCell: {
    fontWeight: "bold",
    color: "#fff",
  },
});

export default ManageUsers;
