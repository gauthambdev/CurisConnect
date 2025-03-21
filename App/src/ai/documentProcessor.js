import { db } from '../firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { extractTextFromImage } from './textUtils';
import { explainMedicalTerms } from './medicalUtils';
import pdfParse from 'pdf-parse';

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dle1vya8b/auto/upload';

export const processAndUploadDocument = async (uploadedBy, uploadedTo, file, fileName) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'diagnoses');

    const response = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: formData });
    if (!response.ok) throw new Error('Cloudinary upload failed');

    const cloudinaryData = await response.json();
    const fileUrl = cloudinaryData.secure_url;

    let extractedText = '';

    if (file.type === 'application/pdf') {
      // Extract text from PDF using pdf-parse
      const pdfBuffer = await fetch(fileUrl).then((res) => res.arrayBuffer());
      const pdfData = await pdfParse(pdfBuffer);
      extractedText = pdfData.text;
    } else {
      // Extract text from an image
      extractedText = await extractTextFromImage(fileUrl);
    }

    // Get medical term explanations
    const medicalExplanations = await explainMedicalTerms(extractedText);

    // Store data in Firestore
    const docId = `${uploadedBy}_${Date.now()}`;
    await setDoc(doc(db, 'uploads', docId), {
      uploadedBy,
      uploadedTo,
      uploadTimestamp: serverTimestamp(),
      fileFormat: file.type,
      fileName,
      uploadUrl: fileUrl,
      extractedText,
      medicalExplanations,
    });

    return { success: true, uploadUrl: fileUrl, extractedText, medicalExplanations };
  } catch (error) {
    console.error('Processing and Uploading Failed:', error);
    return { success: false, error: error.message };
  }
};