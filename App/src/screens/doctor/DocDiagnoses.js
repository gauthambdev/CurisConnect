import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Dimensions, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DataTable } from 'react-native-paper';
import { auth, db } from "../../firebaseConfig";
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import * as WebBrowser from "expo-web-browser";
import Background from "../../components/Background";
import Logo from "../../components/Logo";
import Header from "../../components/Header";
import Button from "../../components/Button";
import { theme } from "../../core/theme";

// ...imports remain unchanged...

const DocDiagnoses = ({ navigation }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchDocumentsWithPatientNames = async () => {
      try {
        const uploadsQuery = query(
          collection(db, "uploads"),
          where("uploadedBy", "==", user.uid),
          orderBy("timestamp", "desc")
        );

        const querySnapshot = await getDocs(uploadsQuery);

        const docsWithPatients = await Promise.all(
          querySnapshot.docs.map(async (uploadDoc) => {
            const uploadData = { id: uploadDoc.id, ...uploadDoc.data() };

            let patientName = "Unknown";

            if (uploadData.uploadedTo) {
              const patientRef = doc(db, "patients", uploadData.uploadedTo);
              const patientSnap = await getDoc(patientRef);

              if (patientSnap.exists()) {
                const patientData = patientSnap.data();
                patientName = `${patientData.firstName} ${patientData.lastName}`;
              }
            }

            return {
              ...uploadData,
              patientName,
            };
          })
        );

        setDocuments(docsWithPatients);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentsWithPatientNames();
  }, [user]);

  const openPDF = (url) => {
    WebBrowser.openBrowserAsync(url);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Background>
          <Logo />
          <Header>Your Diagnoses</Header>
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
        <Header style={styles.header}>Medical History</Header>

        {/* Horizontal scroll just for the table */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tableWrapper}>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Patient Name</DataTable.Title>
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
                      <DataTable.Cell>{doc.patientName}</DataTable.Cell>
                      <DataTable.Cell>{doc.filename}</DataTable.Cell>
                      <DataTable.Cell>{new Date(doc.timestamp.toDate()).toLocaleDateString()}</DataTable.Cell>
                      <DataTable.Cell>
                        <Button
                          mode="contained"
                          onPress={() => openPDF(doc.url)}
                          style={styles.actionButton}
                          labelStyle={styles.buttonLabel}
                        >
                          view
                        </Button>
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))
                )}
              </DataTable>
            </ScrollView>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('UploadDocScreen')}
            style={styles.uploadButton}
          >
            Upload New Document
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
    width: Dimensions.get('window').width * 1.2,
    paddingHorizontal: 10,
  },
  tableContainer: {
    maxHeight: 480,
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

export default DocDiagnoses;