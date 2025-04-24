import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebaseConfig';

const extractTextFromPDF = async (pdfUrl) => {
  if (!pdfUrl || typeof pdfUrl !== 'string' || pdfUrl.trim() === '') {
    console.error('Invalid pdfUrl in extractor.js:', pdfUrl);
    throw new Error('A valid PDF URL is required');
  }
  try {
    console.log('Preparing to call Cloud Function with pdfUrl:', pdfUrl); // Debug
    console.log('Payload:', { pdfUrl }); // Debug exact payload
    const extractText = httpsCallable(functions, 'extractTextFromPDF');
    const result = await extractText({ pdfUrl });
    console.log('Cloud Function response:', result); // Debug response
    return result.data.text;
  } catch (error) {
    console.error('Error calling Cloud Function:', error);
    throw error;
  }
};

export { extractTextFromPDF };