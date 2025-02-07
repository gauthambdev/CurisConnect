import { db } from '../firebaseConfig'; // Firebase Firestore
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/dle1vya8b/auto/upload';

export const Upload = async (uploadedBy, uploadedTo, file, fileName) => {
  try {
    // 1️⃣ Convert file to FormData for Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'diagnoses');

    // 2️⃣ Upload PDF to Cloudinary
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload to Cloudinary');

    const cloudinaryData = await response.json();
    const pdfUrl = cloudinaryData.secure_url; // Get Cloudinary file URL

    // 3️⃣ Generate a unique document ID
    const docId = `${uploadedBy}_${Date.now()}`;

    // 4️⃣ Store metadata & Cloudinary URL in Firestore
    await setDoc(doc(db, 'uploads', docId), {
      uploadedBy,
      uploadedTo,
      uploadTimestamp: serverTimestamp(),
      fileFormat: 'pdf',
      fileName,
      uploadUrl: pdfUrl, // Store Cloudinary file URL
    });

    return { success: true, uploadUrl: pdfUrl }; // Return success and URL
  } catch (error) {
    console.error('Error uploading document:', error);
    return { success: false, error: error.message };
  }
};
