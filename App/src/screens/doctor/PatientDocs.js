import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DataTable } from 'react-native-paper';
import { db } from "../../firebaseConfig";
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import * as WebBrowser from "expo-web-browser";
import Background from "../../components/Background";
import Logo from "../../components/Logo";
import Header from "../../components/Header";
import Button from "../../components/Button";
import { theme } from "../../core/theme";

const PatientDocs = ({ navigation, route }) => {
  const { userId } = route.params;
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("");

  useEffect(() => {
    if (!userId) return;

    const fetchDocumentsWithPatientName = async () => {
      try {
        const q = query(
          collection(db, "uploads"),
          where("uploadedBy", "==", userId),
          orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(q);

        let patientFullName = "";
        const docsWithNames = await Promise.all(
          querySnapshot.docs.map(async (uploadDoc) => {
            const uploadData = { id: uploadDoc.id, ...uploadDoc.data() };

            if (!patientFullName && uploadData.uploadedTo) {
              const patientRef = doc(db, "patients", uploadData.uploadedTo);
              const patientSnap = await getDoc(patientRef);
              if (patientSnap.exists()) {
                const patientData = patientSnap.data();
                patientFullName = `${patientData.firstName} ${patientData.lastName}`;
              }
            }

            return {
              ...uploadData,
              patientName: patientFullName || "Unknown",
            };
          })
        );

        setDocuments(docsWithNames);
        setPatientName(patientFullName || "Patient");
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentsWithPatientName();
  }, [userId]);

  const openPDF = (url) => {
    WebBrowser.openBrowserAsync(url);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Background>
          <Logo />
          <Header>Loading Documents...</Header>
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
        <Header style={styles.header}>{patientName} Documents</Header>
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
                  <Text style={styles.noDataText}>No documents found for this patient.</Text>
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
                        Open
                      </Button>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))
              )}
            </DataTable>
          </ScrollView>
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
  header: {
    marginTop: 20,
    marginBottom: 20,
    fontSize: 27,
    color: theme.colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
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
    paddingHorizontal: 0,
  },
  tableContainer: {
    flex: 1,
    maxHeight: 550,
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

export default PatientDocs;