import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ActivityIndicator, ScrollView, StyleSheet, Dimensions } from "react-native";
import axios from "axios";
import { SafeAreaView } from 'react-native-safe-area-context';
import Background from '../components/Background';
import Header from '../components/Header';
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import { theme } from '../core/theme';

// Get screen width to constrain elements
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = Math.min(SCREEN_WIDTH - 40, 300); // Constrained width to prevent overflow

const QuickDiagnosis = ({ navigation }) => {
  const [symptoms, setSymptoms] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [diagnosis, setDiagnosis] = useState(null);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [features, setFeatures] = useState([]);

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      const featuresResponse = await axios.get("https://api.endlessmedical.com/v1/dx/GetFeatures");
      console.log("Available features:", featuresResponse.data.data);
      setFeatures(featuresResponse.data.data);

      const sessionResponse = await axios.get("https://api.endlessmedical.com/v1/dx/InitSession");
      const session = sessionResponse.data.SessionID || sessionResponse.data.sessionId;
      setSessionId(session);
      console.log("Session initialized with ID:", session);

      const passphrase = "I have read, understood and I accept and agree to comply with the Terms of Use of EndlessMedicalAPI and Endless Medical services. The Terms of Use are available on endlessmedical.com";
      await axios.post(
        "https://api.endlessmedical.com/v1/dx/AcceptTermsOfUse",
        {},
        {
          params: { SessionID: session, passphrase },
          headers: { "Content-Type": "application/json" }
        }
      );
      console.log("Terms of Use accepted for session:", session);
      return session;
    } catch (error) {
      console.error("Initialization error:", error.response?.status, error.response?.data || error.message);
      setError("Failed to initialize session or accept Terms of Use. Please try again.");
      return null;
    }
  };

  const mapSymptomToFeature = (symptom) => {
    const lowerSymptom = symptom.toLowerCase().trim();

    // Define a mapping of symptoms to features with synonyms and severity levels
    const symptomFeatureMap = [
      {
        keywords: ["fever", "high temperature", "hot", "febrile"],
        feature: "Temp",
        values: {
          mild: "1", // Regular fever
          severe: "2", // High fever
        },
      },
      {
        keywords: ["cough", "coughing"],
        feature: "SeverityCough",
        values: {
          mild: "1", // Regular cough
          severe: "2", // Severe cough
        },
      },
      {
        keywords: ["chest pain", "chest discomfort", "angina"],
        feature: "ChestPainAnginaYesNo",
        values: {
          default: "1", // Presence of chest pain
        },
      },
      {
        keywords: ["vomit", "vomiting", "throwing up", "nauseated"],
        feature: "Vomiting",
        values: {
          default: "1", // Presence of vomiting
        },
      },
      {
        keywords: ["headache", "head pain", "migraine"],
        feature: "HeadacheFrontal",
        values: {
          default: "1", // Presence of headache
        },
      },
      {
        keywords: ["rash", "skin irritation", "hives", "red spots"],
        feature: "SkinErythemamaculesRashHx",
        values: {
          default: "1", // Presence of rash
        },
      },
      {
        keywords: ["diarrhea", "loose stools", "frequent bowel movements"],
        feature: "DiarrheaSx",
        values: {
          default: "1", // Presence of diarrhea
        },
      },
      {
        keywords: ["fatigue", "tiredness", "exhaustion", "weakness"],
        feature: "GeneralizedFatigue",
        values: {
          default: "1", // Presence of fatigue
        },
      },
      {
        keywords: ["shortness of breath", "difficulty breathing", "breathlessness", "dyspnea"],
        feature: "ShortnessOfBreath",
        values: {
          default: "1", // Presence of shortness of breath
        },
      },
      {
        keywords: ["sore throat", "throat pain", "scratchy throat"],
        feature: "SoreThroatHx",
        values: {
          default: "1", // Presence of sore throat
        },
      },
      {
        keywords: ["joint pain", "arthritis", "joint stiffness"],
        feature: "JointPain",
        values: {
          default: "1", // Presence of joint pain
        },
      },
      {
        keywords: ["nausea", "queasy", "sick to stomach"],
        feature: "Nausea",
        values: {
          default: "1", // Presence of nausea
        },
      },
      {
        keywords: ["abdominal pain", "stomach pain", "belly ache", "gut pain"],
        feature: "AbdominalPain",
        values: {
          default: "1", // Presence of abdominal pain
        },
      },
      {
        keywords: ["chills", "shivering", "cold flashes"],
        feature: "Chills",
        values: {
          default: "1", // Presence of chills
        },
      },
      {
        keywords: ["sweating", "excessive sweat", "night sweats"],
        feature: "SweatingExcessive",
        values: {
          default: "1", // Presence of excessive sweating
        },
      },
      {
        keywords: ["dizziness", "lightheaded", "vertigo"],
        feature: "Dizziness",
        values: {
          default: "1", // Presence of dizziness
        },
      },
      {
        keywords: ["fever with rash", "fever and rash"],
        feature: "FeverWithRash",
        values: {
          default: "1", // Presence of fever with rash
        },
      },
      {
        keywords: ["muscle pain", "myalgia", "muscle ache", "body pain"],
        feature: "MusclePain",
        values: {
          default: "1", // Presence of muscle pain
        },
      },
      {
        keywords: ["runny nose", "nasal congestion", "stuffy nose"],
        feature: "NasalCongestion",
        values: {
          default: "1", // Presence of nasal congestion
        },
      },
      {
        keywords: ["loss of appetite", "not hungry", "reduced appetite"],
        feature: "LossOfAppetite",
        values: {
          default: "1", // Presence of loss of appetite
        },
      },
    ];

    // Find the matching symptom mapping
    for (const mapping of symptomFeatureMap) {
      const matchedKeyword = mapping.keywords.find(keyword => lowerSymptom.includes(keyword));
      if (matchedKeyword && features.includes(mapping.feature)) {
        // Check for severity keywords
        if (mapping.values.severe && (lowerSymptom.includes("severe") || lowerSymptom.includes("high") || lowerSymptom.includes("extreme"))) {
          return { name: mapping.feature, value: mapping.values.severe };
        }
        if (mapping.values.mild && (lowerSymptom.includes("mild") || lowerSymptom.includes("slight"))) {
          return { name: mapping.feature, value: mapping.values.mild };
        }
        return { name: mapping.feature, value: mapping.values.default || mapping.values.mild || "1" };
      }
    }

    console.log(`No feature mapped for symptom: ${symptom}`);
    return null;
  };

  const handleDiagnosis = async () => {
    if (!symptoms.trim()) {
      setError("Please enter symptoms separated by commas (e.g., fever, cough)");
      return;
    }
    setIsProcessing(true);
    setError(null);
    setDiagnosis(null);
    try {
      const newSessionId = await initializeSession();
      if (!newSessionId) throw new Error("Session initialization failed");

      const symptomArray = symptoms.split(",").map(s => s.trim());
      for (const symptom of symptomArray) {
        const feature = mapSymptomToFeature(symptom);
        if (feature) {
          console.log("Sending UpdateFeature request with:", {
            url: "https://api.endlessmedical.com/v1/dx/UpdateFeature",
            params: { SessionID: newSessionId, name: feature.name, value: feature.value }
          });
          await axios.post(
            "https://api.endlessmedical.com/v1/dx/UpdateFeature",
            {},
            {
              params: { SessionID: newSessionId, name: feature.name, value: feature.value },
              headers: { "Content-Type": "application/json" }
            }
          );
        }
      }
      console.log("Features updated for symptoms:", symptomArray);

      console.log("Sending Analyze request with:", {
        url: "https://api.endlessmedical.com/v1/dx/Analyze",
        params: { SessionID: newSessionId }
      });
      const response = await axios.get(
        "https://api.endlessmedical.com/v1/dx/Analyze",
        {
          params: { SessionID: newSessionId },
          headers: { "Content-Type": "application/json" }
        }
      );
      console.log("Analyze API response:", response.data);
      setDiagnosis(response.data);

      if (response.data.Diseases.length === 0) {
        setError("No specific conditions identified. Try adding more symptoms or rephrasing them (e.g., 'high fever' or 'severe cough').");
      }
    } catch (error) {
      console.error("Diagnosis API error:", error.response?.status, error.response?.data || error.message);
      setError(`Failed to get diagnosis: ${error.response?.data?.error || "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const mapDiseasesToSpecializations = (diseases) => {
    if (!diseases || !Array.isArray(diseases) || diseases.length === 0) return ["General Practice"];
    const specializations = new Set();
    diseases.forEach(diseaseObj => {
      const diseaseName = Object.keys(diseaseObj)[0].toLowerCase();
      if (diseaseName.includes("pneumonia") || diseaseName.includes("influenza")) specializations.add("Pulmonology");
      if (diseaseName.includes("allergic rhinitis")) specializations.add("Allergy and Immunology");
      if (diseaseName.includes("leukopenia")) specializations.add("Hematology");
      if (diseaseName.includes("prostatitis") || diseaseName.includes("urethritis") || diseaseName.includes("cystitis")) specializations.add("Urology");
      if (diseaseName.includes("sinusitis")) specializations.add("Otolaryngology");
      if (diseaseName.includes("hiv")) specializations.add("Infectious Disease");
      if (diseaseName.includes("myocarditis")) specializations.add("Cardiology");
      if (diseaseName.includes("headache") || diseaseName.includes("migraine")) specializations.add("Neurology");
      if (diseaseName.includes("diarrhea") || diseaseName.includes("gastroenteritis")) specializations.add("Gastroenterology");
      if (diseaseName.includes("rash") || diseaseName.includes("dermatitis")) specializations.add("Dermatology");
    });
    return specializations.size > 0 ? Array.from(specializations) : ["General Practice"];
  };

  return (
    <SafeAreaView style={styles.container}>
      <Background>
        <BackButton style={styles.backButton} onPress={() => navigation.navigate('Dashboard')} />
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
            labelStyle={styles.buttonLabel}
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
              <Text style={styles.resultTitle}>Suggested Specializations:</Text>
              <Text style={styles.result}>
                {mapDiseasesToSpecializations(diagnosis.Diseases).join(", ")}
              </Text>
              {diagnosis.Diseases.length > 0 && (
                <>
                  <Text style={styles.resultTitle}>Possible Conditions (Top 5):</Text>
                  {diagnosis.Diseases
                    .sort((a, b) => parseFloat(Object.values(b)[0]) - parseFloat(Object.values(a)[0])) // Sort by probability descending
                    .slice(0, 5) // Take top 5
                    .map((disease, index) => {
                      const diseaseName = Object.keys(disease)[0];
                      const probability = Math.round(Object.values(disease)[0] * 100);
                      return (
                        <Text key={index} style={styles.diseaseText}>
                          {diseaseName}: {probability}%
                        </Text>
                      );
                    })}
                </>
              )}
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
    width: SCREEN_WIDTH, // Ensure container matches screen width
    alignItems: 'center', // Center content
  },
  scrollView: {
    flex: 1,
    width: SCREEN_WIDTH, // Ensure ScrollView matches screen width
  },
  content: {
    padding: 20,
    alignItems: 'center', // Center content
    width: SCREEN_WIDTH, // Constrain content width to screen width
    paddingBottom: 40, // Add padding to ensure the bottom content is visible
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  header: {
    marginTop: 20,
    fontSize: 28, // Reduced font size from 36 to 28
    color: theme.colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    width: SCREEN_WIDTH, // Ensure the header takes the full width for centering
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
    width: MAX_CONTENT_WIDTH, // Constrain width
  },
  input: {
    borderWidth: 2,
    borderColor: theme.colors.surface,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    height: 80,
    width: MAX_CONTENT_WIDTH, // Constrain width
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
    borderRadius: 8,
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
    width: MAX_CONTENT_WIDTH, // Constrain width
    lineHeight: 18,
  },
  resultContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: MAX_CONTENT_WIDTH, // Constrain width
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 10,
    marginTop: 10,
    textAlign: 'center',
    width: MAX_CONTENT_WIDTH, // Constrain width
  },
  result: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
    textAlign: 'center',
    width: MAX_CONTENT_WIDTH, // Constrain width
  },
  diseaseText: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
    textAlign: 'center',
    width: MAX_CONTENT_WIDTH, // Constrain width
  },
  error: {
    fontSize: 14,
    color: theme.colors.error,
    marginVertical: 10,
    textAlign: 'center',
    width: MAX_CONTENT_WIDTH, // Constrain width
  },
});

export default QuickDiagnosis;