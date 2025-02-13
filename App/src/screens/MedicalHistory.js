import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import * as WebBrowser from "expo-web-browser";
import Background from "../components/Background";
import Logo from "../components/Logo";
import Header from "../components/Header";

const MedicalHistory = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchDocuments = async () => {
      try {
        const q = query(
          collection(db, "uploads"),
          where("uploadedTo", "==", user.uid),
          orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDocuments(docs);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  const openPDF = (url) => {
    WebBrowser.openBrowserAsync(url);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Background>
      <Logo />
      <Header>Medical History</Header>

      <ScrollView horizontal>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.headerCell]}>File Name</Text>
            <Text style={[styles.cell, styles.headerCell]}>Uploaded Date</Text>
            <Text style={[styles.cell, styles.headerCell]}>Action</Text>
          </View>
          <ScrollView style={styles.tableBody}>
            {documents.length === 0 ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No documents found.</Text>
              </View>
            ) : (
              documents.map((doc) => (
                <View key={doc.id} style={styles.tableRow}>
                  <Text style={styles.cell}>{doc.filename}</Text>
                  <Text style={styles.cell}>{new Date(doc.timestamp.toDate()).toLocaleDateString()}</Text>
                  <TouchableOpacity onPress={() => openPDF(doc.url)} style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
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
  viewButton: {
    backgroundColor: "#4B0082",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignSelf: "center",
  },
  viewButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  noDataContainer: {
    padding: 20,
    alignItems: "center",
  },
  noDataText: {
    color: "#6b7280",
    fontSize: 16,
  },
});

export default MedicalHistory;
