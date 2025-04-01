import React, { useState } from "react";
import { View, Text, TextInput, ActivityIndicator, ScrollView, StyleSheet, Dimensions } from "react-native";
import axios from "axios";
import { SafeAreaView } from 'react-native-safe-area-context';
import Background from '../components/Background';
import Header from '../components/Header';
import Button from '../components/Button';
import { theme } from '../core/theme';

// Get screen width to constrain elements
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = Math.min(SCREEN_WIDTH - 40, 300); // Constrained width to prevent overflow

const QuickDiagnosis = ({ navigation }) => {
  const [symptoms, setSymptoms] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [error, setError] = useState(null);

  // Replace with your Gemini API key (store securely in production, e.g., environment variables)
  const GEMINI_API_KEY = "AIzaSyBLVW6kDs3esuNNc5Ri09gmu2FRuGdyJvg"; // Obtain from Google AI Studio
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  const handleDiagnosis = async () => {
    if (!symptoms.trim()) {
      setError("Please enter symptoms separated by commas (e.g., fever, cough)");
      return;
    }
    setIsProcessing(true);
    setError(null);
    setDiagnosis(null);

    try {
      const symptomList = symptoms.split(",").map(s => s.trim()).join(", ");
      const prompt = `
        You are a medical assistant. Based on the following symptoms: "${symptomList}", provide: 
        1. A possible diagnosis (top 2 conditions with short explanations). 
        2. Quick home remedies (safe, non-prescription solutions). 
        3. Easily available over-the-counter drugs (include common brand names if possible). 
        4. Suggested medical specializations to consult. 
        Note: keep your responses short and easy to understand
      `;

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

      const resultText = response.data.candidates[0].content.parts[0].text;
      setDiagnosis({ text: resultText });
    } catch (error) {
      console.error("Gemini API error:", error.response?.status, error.response?.data || error.message);
      setError("Failed to get diagnosis. Please try again or check your API key.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to parse the response text and render with proper formatting
  const renderFormattedText = (text) => {
    if (!text) return null;

    // Split the text by lines
    const lines = text.split("\n").filter(line => line.trim() !== "");

    return lines.map((line, index) => {
      // Check for bold formatting (**text**)
      const parts = line.split(/\*\*(.*?)\*\*/g); // Split by **text**
      return (
        <Text key={index} style={styles.result}>
          {parts.map((part, i) => {
            // If the index is odd, this part was between ** **, so render it as bold
            if (i % 2 === 1) {
              return (
                <Text key={i} style={{ fontWeight: 'bold' }}>
                  {part}
                </Text>
              );
            }
            return part;
          })}
          {"\n"} {/* Add a newline for each line */}
        </Text>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Background>
        <Header style={styles.header}>Quick Diagnosis</Header>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          horizontal={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={true}
        >
          {/* Symptom Input */}
          <Text style={styles.inputLabel}>Enter Your Symptoms:</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., fever, cough"
            placeholderTextColor={theme.colors.placeholder}
            value={symptoms}
            onChangeText={setSymptoms}
            multiline
            autoFocus={false}
            scrollEnabled={true}
          />

          {/* Diagnosis Button */}
          <Button 
            mode="contained" 
            onPress={handleDiagnosis} 
            disabled={isProcessing}
            style={styles.button}
          >
            {isProcessing ? <ActivityIndicator color="#fff" /> : "Get Diagnosis"}
          </Button>

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            Disclaimer: This tool provides preliminary suggestions based on symptoms and is not a substitute for professional medical advice. Consult a healthcare provider for an accurate diagnosis and treatment.
          </Text>

          {/* Error Message */}
          {error && <Text style={styles.error}>{error}</Text>}

          {/* Diagnosis Results */}
          {diagnosis && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Diagnosis Results:</Text>
              {renderFormattedText(diagnosis.text)}
            </View>
          )}
        </ScrollView>
      </Background>
    </SafeAreaView>
  );
};

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
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
    width: MAX_CONTENT_WIDTH,
  },
  input: {
    borderWidth: 2,
    borderColor: theme.colors.surface,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    height: 80,
    width: MAX_CONTENT_WIDTH,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    fontSize: 16,
    color: theme.colors.text,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  button: {
    marginBottom: 20,
    paddingVertical: 10,
    alignSelf: 'center',
    width: 180,
    borderRadius: 50,
  },
  buttonLabel: {
    fontSize: 16,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 12,
    color: theme.colors.secondary || '#666',
    textAlign: 'center',
    marginBottom: 15,
    width: MAX_CONTENT_WIDTH,
    lineHeight: 18,
  },
  resultContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: MAX_CONTENT_WIDTH,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 10,
    marginTop: 10,
    textAlign: 'center',
    width: MAX_CONTENT_WIDTH,
  },
  result: {
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

export default QuickDiagnosis;