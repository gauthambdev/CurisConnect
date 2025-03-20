import { extractTextFromImage } from './textUtils';
import { explainMedicalTerms } from './medicalUtils';

// Sample image URL (replace with actual Cloudinary URL)
const sampleImageUrl = 'https://res.cloudinary.com/dle1vya8b/image/upload/sample-report.png';

const processMedicalReport = async () => {
  try {
    // Step 1: Extract text
    const extractedText = await extractTextFromImage(sampleImageUrl);
    console.log('Extracted Text:', extractedText);

    // Step 2: Explain medical terms
    const explanations = await explainMedicalTerms(extractedText);
    console.log('Medical Term Explanations:', explanations);
  } catch (error) {
    console.error('Failed to process medical report:', error);
  }
};

processMedicalReport();
