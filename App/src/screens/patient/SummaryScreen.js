import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, Dimensions } from "react-native";
import axios from "axios";
import { SafeAreaView } from 'react-native-safe-area-context';
import Background from '../../components/Background';
import Header from '../../components/Header';
import { theme } from '../../core/theme';

// Get screen width to constrain elements
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = Math.min(SCREEN_WIDTH - 40, 300); // Constrained width to prevent overflow

const SummaryScreen = ({ route }) => {
  // Extract parameters from navigation
  const { extractedText, date } = route.params;

  // State variables
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gemini API configuration
  const GEMINI_API_KEY = "AIzaSyBLVW6kDs3esuNNc5Ri09gmu2FRuGdyJvg"; // Replace with your actual API key
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  // Fetch summary when component mounts
  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Construct the prompt with date and extracted text
        const prompt = `
          You are a medical assistant. Please provide a concise summary of the following medical text, 
          highlighting key points such as diagnoses, treatments, medications, test results, 
          and any important notes. Exempt and irrelevant details. Start by mentioning the Date provided.
          Keep it in short points. Explain all scientific terms in laymen terms so a simple person could understand.

          Date: ${date}

          Medical Text: ${extractedText}
        `;

        // Make API request to Gemini
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
        const resultText = response.data.candidates[0].content.parts[0].text;
        setSummary(resultText);
      } catch (error) {
        console.error("Gemini API error:", error.response?.status, error.response?.data || error.message);
        setError("Failed to generate summary. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [extractedText, date]); // Dependencies ensure re-fetch if params change

  // Function to render formatted text (handles bold markdown like **text**)
  const renderFormattedText = (text) => {
    if (!text) return null;

    // Split text into lines and filter out empty ones
    const lines = text.split("\n").filter(line => line.trim() !== "");

    return lines.map((line, index) => {
      // Split line by bold markdown (**text**)
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <Text key={index} style={styles.summaryText}>
          {parts.map((part, i) => {
            // If part is between ** **, render it as bold
            if (i % 2 === 1) {
              return <Text key={i} style={{ fontWeight: 'bold' }}>{part}</Text>;
            }
            return part;
          })}
          {"\n"} {/* Add newline after each line */}
        </Text>
      );
    });
  };

  // Render the UI
  return (
    <SafeAreaView style={styles.container}>
      <Background>
        <Header style={styles.header}>Summary</Header>
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

// Styles adapted from QuickDiagnosis for consistency
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
    alignItems: 'center',
    width: MAX_CONTENT_WIDTH,
  },
  summaryText: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
    textAlign: 'left',
    width: MAX_CONTENT_WIDTH,
  },
  error: {
    fontSize: 14,
    color: theme.colors.error,
    marginVertical: 10,
    textAlign: 'center',
    width: MAX_CONTENT_WIDTH,
  },
});

export default SummaryScreen;