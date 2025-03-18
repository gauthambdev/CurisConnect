import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import axios from "axios";
import { SafeAreaView } from 'react-native-safe-area-context';
import Background from '../components/Background';
import Header from '../components/Header';
import Button from '../components/Button';
import BackButton from '../components/BackButton'; // Imported from components folder
import { theme } from '../core/theme';

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
    if (lowerSymptom.includes("fever") && features.includes("Temp")) return { name: "Temp", value: "1" };
    if (lowerSymptom.includes("high fever") && features.includes("Temp")) return { name: "Temp", value: "2" };
    if (lowerSymptom.includes("cough") && features.includes("SeverityCough")) return { name: "SeverityCough", value: "1" };
    if (lowerSymptom.includes("severe cough") && features.includes("SeverityCough")) return { name: "SeverityCough", value: "2" };
    if (lowerSymptom.includes("chest pain") && features.includes("ChestPainAnginaYesNo")) return { name: "ChestPainAnginaYesNo", value: "1" };
    if (lowerSymptom.includes("vomit") && features.includes("Vomiting")) return { name: "Vomiting", value: "1" };
    if (lowerSymptom.includes("headache") && features.includes("HeadacheFrontal")) return { name: "HeadacheFrontal", value: "1" };
    if (lowerSymptom.includes("rash") && features.includes("SkinErythemamaculesRashHx")) return { name: "SkinErythemamaculesRashHx", value: "1" };
    if (lowerSymptom.includes("diarrhea") && features.includes("DiarrheaSx")) return { name: "DiarrheaSx", value: "1" };
    if (lowerSymptom.includes("fatigue") && features.includes("GeneralizedFatigue")) return { name: "GeneralizedFatigue", value: "1" };
    if (lowerSymptom.includes("shortness of breath") && features.includes("ShortnessOfBreath")) return { name: "ShortnessOfBreath", value: "1" };
    if (lowerSymptom.includes("sore throat") && features.includes("SoreThroatHx")) return { name: "SoreThroatHx", value: "1" };
    if (lowerSymptom.includes("joint pain") && features.includes("JointPain")) return { name: "JointPain", value: "1" };
    if (lowerSymptom.includes("nausea") && features.includes("Nausea")) return { name: "Nausea", value: "1" };
    if (lowerSymptom.includes("abdominal pain") && features.includes("AbdominalPain")) return { name: "AbdominalPain", value: "1" };
    if (lowerSymptom.includes("chills") && features.includes("Chills")) return { name: "Chills", value: "1" };
    if (lowerSymptom.includes("sweating") && features.includes("SweatingExcessive")) return { name: "SweatingExcessive", value: "1" };
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
        setError("No specific conditions identified. Try adding more symptoms for a better diagnosis.");
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
        {/* Back Button from components */}
        <BackButton style={styles.backButton} onPress={() => navigation.navigate('Dashboard')} />
        <Header style={styles.header}>Quick Diagnosis</Header>
        <ScrollView 
          contentContainerStyle={styles.content}
          horizontal={false}
          showsHorizontalScrollIndicator={false}
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
                  <Text style={styles.resultTitle}>Possible Conditions:</Text>
                  {diagnosis.Diseases.map((disease, index) => {
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
  },
  content: {
    padding: 20,
    flexGrow: 1,
    alignItems: 'center',
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  header: {
    marginTop: 20,
    fontSize: 36,
    color: '#800080',
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    borderWidth: 2,
    borderColor: theme.colors.surface,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    height: 80,
    width: 300,
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
    width: 300,
    lineHeight: 18,
  },
  resultContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: 300,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 10,
    marginTop: 10,
    textAlign: 'center',
  },
  result: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
    textAlign: 'center',
    width: 300,
  },
  diseaseText: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
    textAlign: 'center',
    width: 300,
  },
  error: {
    fontSize: 14,
    color: theme.colors.error,
    marginVertical: 10,
    textAlign: 'center',
    width: 300,
  },
});

export default QuickDiagnosis;