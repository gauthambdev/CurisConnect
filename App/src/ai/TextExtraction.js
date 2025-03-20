import { db } from '../firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { extractTextFromImage } from './textUtils';

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dle1vya8b/auto/upload';

export const Upload = async (uploadedBy, uploadedTo, file, fileName) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'diagnoses');

    const response = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: formData });
    if (!response.ok) throw new Error('Cloudinary upload failed');

    const cloudinaryData = await response.json();
    const pdfUrl = cloudinaryData.secure_url;

    // 🧠 Extract text from the uploaded PDF
    const extractedText = await extractTextFromImage(pdfUrl);

    // 🗂️ Store text + metadata in Firestore
    const docId = `${uploadedBy}_${Date.now()}`;
    await setDoc(doc(db, 'uploads', docId), {
      uploadedBy,
      uploadedTo,
      uploadTimestamp: serverTimestamp(),
      fileFormat: 'pdf',
      fileName,
      uploadUrl: pdfUrl,
      extractedText, // Save extracted medical text
    });

    return { success: true, uploadUrl: pdfUrl };
  } catch (error) {
    console.error('Upload & OCR failed:', error);
    return { success: false, error: error.message };
  }
};
