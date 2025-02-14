import fetch from 'node-fetch';
import nlp from 'compromise';

// Caching dictionary to reduce API calls
const explanationCache = {};

export const explainMedicalTerms = async (text) => {
  const terms = extractMedicalTerms(text);
  const explanations = {};

  for (const term of terms) {
    if (explanationCache[term]) {
      explanations[term] = explanationCache[term];
    } else {
      const explanation = await getMedicalDefinition(term);
      explanations[term] = explanation;
      explanationCache[term] = explanation;
    }
  }

  return explanations;
};

// Step 1: Extract potential medical terms
const extractMedicalTerms = (text) => {
  const doc = nlp(text);
  const potentialTerms = doc.nouns().out('array');

  // Filter out common words - rough medical term check
  const medicalTerms = potentialTerms.filter((word) => word.length > 6); // Medical terms often longer
  return [...new Set(medicalTerms)];
};

// Step 2: Fetch definition from FreeDictionary API
const getMedicalDefinition = async (term) => {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${term}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();

    // Check if the term has definitions
    if (data && data[0]?.meanings) {
      const definition = data[0].meanings[0].definitions[0].definition;
      return simplifyDefinition(definition);
    } else {
      return "Definition not found.";
    }
  } catch (error) {
    console.error(`Error fetching definition for ${term}:`, error);
    return "Failed to get definition.";
  }
};

// Step 3: Simplify definition by trimming long words
const simplifyDefinition = (definition) => {
  return definition.replace(/\b\w{12,}\b/g, (word) => {
    // Split long medical terms into readable chunks
    return word.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  });
};
