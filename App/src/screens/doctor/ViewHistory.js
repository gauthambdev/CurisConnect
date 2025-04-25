import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from "axios";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from '../../firebaseConfig'; // Adjust path to your Firebase config
import Background from '../../components/Background';
import Header from '../../components/Header';
import { theme } from '../../core/theme';

// Get screen width to constrain elements
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = Math.min(SCREEN_WIDTH - 40, 300); // Constrained width to prevent overflow

const ViewHistory = ({ route }) => {
  // Extract patientId from navigation params
  const { patientId } = route.params;

  // State variables
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gemini API configuration
  const GEMINI_API_KEY = "AIzaSyBLVW6kDs3esuNNc5Ri09gmu2FRuGdyJvg"; // Replace with your actual API key
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  // Fetch documents and generate a single summary when component mounts
  useEffect(() => {
    const fetchAndSummarize = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch documents from Firestore
        const uploadsRef = collection(db, "uploads");
        const q = query(uploadsRef, where("uploadedTo", "==", patientId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("No medical records found for this patient.");
          setIsLoading(false);
          return;
        }

        // Prepare documents for processing
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          extractedText: doc.data().extractedText,
          timestamp: doc.data().timestamp,
        }));

        // Sort documents by timestamp (earliest to latest)
        docs.sort((a, b) => a.timestamp.toDate() - b.timestamp.toDate());

        // Combine all documents into a single prompt
        const recordsText = docs.map(doc => {
          const dateString = new Date(doc.timestamp.toDate()).toLocaleDateString();
          return `Date: ${dateString}\nMedical Text: ${doc.extractedText}\n\n`;
        }).join("");

        const prompt = `
          You are a medical assistant. Below is a collection of medical records for a patient, each with a date and medical text. 
          Provide a concise, consolidated summary of all records, highlighting key points such as diagnoses, treatments, medications, test results, and important notes. 
          Organize the summary by date in chronological order, starting each section with the provided date. Exclude irrelevant details.
          If a date does not have medical data, ignore it, do not mention it. Keep the summary for each short and to the point. Highlight any irregularities and important details in bold.
          Give response in bullet points.

          ${recordsText}
        `;

        // Make a single API request to Gemini
        const response = await axios.post(
          GEMINI_API_URL,
          {
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          },
          {
            params: { key: GEMINI_API_KEY },
            headers: { "Content-Type": "application/json" },
          }
        );

        // Extract the generated summary text
        const summaryText = response.data.candidates[0].content.parts[0].text;
        setSummary(summaryText);
      } catch (error) {
        console.error("Error:", error.response?.status || error.message);
        setError("Failed to fetch or summarize medical records. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndSummarize();
  }, [patientId]); // Re-run if patientId changes

  // Function to render formatted text as bullet points
  const renderFormattedText = (text) => {
    if (!text) return null;

    // Split text into lines and filter out empty ones
    const lines = text.split("\n").filter(line => line.trim() !== "");

    return lines.map((line, index) => {
      // Check if the line is a bullet point (starts with -, *, or •)
      const isBullet = /^[-*•]\s+/.test(line);
      let content = line;

      // Remove bullet marker for processing
      if (isBullet) {
        content = line.replace(/^[-*•]\s+/, '');
      }

      // Split content by bold markdown (**text**)
      const parts = content.split(/\*\*(.*?)\*\*/g);

      return (
        <View key={index} style={styles.bulletContainer}>
          {isBullet && <Text style={styles.bullet}>• </Text>}
          <Text style={[styles.summaryText, isBullet ? styles.bulletText : null]}>
            {parts.map((part, i) => {
              // If part is between ** **, render it as bold
              if (i % 2 === 1) {
                return <Text key={i} style={{ fontWeight: 'bold' }}>{part}</Text>;
              }
              return part;
            })}
          </Text>
        </View>
      );
    });
  };

  // Render the UI
  return (
    <SafeAreaView style={styles.container}>
      <Background>
        <Header style={styles.header}>Medical History</Header>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          horizontal={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={true}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <View style={styles.summaryContainer}>
              {renderFormattedText(summary)}
            </View>
          )}
        </ScrollView>
      </Background>
    </SafeAreaView>
  );
};

// Styles adapted from SummaryScreen with bullet point additions
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  content: {
    padding: 20,
    alignItems: 'center',
    width: SCREEN_WIDTH,
    paddingBottom: 40,
  },
  header: {
    marginTop: 30,
    fontSize: 28,
    color: theme.colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    width: SCREEN_WIDTH,
  },
  summaryContainer: {
    marginTop: 20,
    width: MAX_CONTENT_WIDTH,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  bulletContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
  },
  summaryText: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
    flex: 1,
  },
  bulletText: {
    marginLeft: 8, // Indent bullet point text
  },
  error: {
    fontSize: 14,
    color: theme.colors.error,
    marginVertical: 10,
    textAlign: 'center',
    width: MAX_CONTENT_WIDTH,
  },
});

export default ViewHistory;