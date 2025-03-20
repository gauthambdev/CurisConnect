import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Dimensions, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DataTable } from 'react-native-paper';
import { auth, db } from "../firebaseConfig";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import * as WebBrowser from "expo-web-browser";
import Background from "../components/Background";
import Logo from "../components/Logo";
import Header from "../components/Header";
import Button from "../components/Button";
import { theme } from "../core/theme";

const MedicalHistory = ({ navigation }) => {
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
      <SafeAreaView style={styles.safeArea}>
        <Background>
          <Logo />
          <Header>Medical History</Header>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </Background>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Background>
        <Logo />
        <Header>Medical History</Header>
        <View style={styles.tableWrapper}>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Filename</DataTable.Title>
              <DataTable.Title>Date</DataTable.Title>
              <DataTable.Title>Action</DataTable.Title>
            </DataTable.Header>
          </DataTable>
          <ScrollView style={styles.tableContainer}>
            <DataTable>
              {documents.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No documents found in your medical history.</Text>
                </View>
              ) : (
                documents.map(doc => (
                  <DataTable.Row key={doc.id}>
                    <DataTable.Cell>{doc.filename}</DataTable.Cell>
                    <DataTable.Cell>{new Date(doc.timestamp.toDate()).toLocaleDateString()}</DataTable.Cell>
                    <DataTable.Cell>
                      <Button
                        mode="contained"
                        onPress={() => openPDF(doc.url)}
                        style={styles.actionButton}
                        labelStyle={styles.buttonLabel}
                      >
                        open
                      </Button>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))
              )}
            </DataTable>
          </ScrollView>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('UploadDocScreen')}
            style={styles.uploadButton}
          >
            Upload New Document
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            Back to Dashboard
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: '100%',
  },
  tableWrapper: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 10,
  },
  tableContainer: {
    flex: 1,
    maxHeight: 400, // Controls scrollable table height
  },
  noDataContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 200,
    width: '100%',
  },
  noDataText: {
    color: "#6b7280",
    fontSize: 16,
    textAlign: "center",
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    width: '100%',
  },
  uploadButton: {
    marginBottom: 10,
    width: '100%',
    backgroundColor: theme.colors.primary,
  },
  backButton: {
    width: '100%',
    borderColor: theme.colors.primary,
  },
  actionButton: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: theme.colors.primary,
    minWidth: 50,
  },
  buttonLabel: {
    color: theme.colors.surface,
    fontSize: 14,
  },
});

export default MedicalHistory;
