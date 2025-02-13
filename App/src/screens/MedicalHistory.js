import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { auth, db } from "../firebaseConfig";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import * as WebBrowser from "expo-web-browser";

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
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>Your Uploaded Documents</Text>
      {documents.length === 0 ? (
        <Text>No documents found.</Text>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => openPDF(item.url)} style={{ padding: 10, borderBottomWidth: 1 }}>
              <Text style={{ color: "blue" }}>{item.filename}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default MedicalHistory;