import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { jsPDF } from 'jspdf';
import { Upload } from '../helpers/upload'; 
import { auth } from '../firebaseConfig';

const UploadDocScreen = () => {
  const [images, setImages] = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);

  // Request camera permissions and capture images
  const captureImages = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'You need to grant camera permissions to capture images.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [595, 842], // A4 aspect ratio (width: 595px, height: 842px)
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      const image = result.assets[0];

      // Convert HEIC to JPEG if necessary
      if (image.mimeType === 'image/heic' || image.mimeType === 'image/heif') {
        const jpegImage = await ImageManipulator.manipulateAsync(
          image.uri,
          [],
          { format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        setImages((prev) => [...prev, { ...jpegImage, mimeType: 'image/jpeg' }]);
      } else {
        setImages((prev) => [...prev, image]);
      }
    }
  };

  // Compile images into a PDF and return the base64 string
  const compileImagesToPdf = (images) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    images.forEach((image, index) => {
      if (index > 0) doc.addPage(); // Add a new page for each image after the first
      doc.addImage(`data:image/jpeg;base64,${image.base64}`, 'JPEG', 0, 0, 210, 297); // A4 dimensions in mm
    });

    // Convert the PDF to a base64 string
    const pdfBase64 = doc.output('datauristring').split(',')[1]; // Extract base64 data
    return pdfBase64;
  };

  // Handle the upload process
  const handleUpload = async () => {
    if (!fileName) {
      Alert.alert('Error', 'Please enter a file name.');
      return;
    }
    if (images.length === 0) {
      Alert.alert('Error', 'Please capture at least one image.');
      return;
    }

    setLoading(true);

    try {
      // Compile images into a PDF and get the base64 string
      const pdfBase64 = compileImagesToPdf(images);

      // Get the current user's ID
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not logged in.');
      }

      // Upload the PDF using the Upload function
      const uploadResult = await Upload(user.uid, user.uid, pdfBase64, fileName);

      if (uploadResult.success) {
        Alert.alert('Success', 'Document uploaded successfully!');
      } else {
        throw new Error(uploadResult.error || 'Upload failed.');
      }
    } catch (error) {
      console.error('Error during upload:', error);
      Alert.alert('Error', error.message || 'An error occurred during upload.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>Upload Document</Text>

      <TextInput
        placeholder="Enter file name"
        value={fileName}
        onChangeText={setFileName}
        style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
      />

      <Button title="Capture Image" onPress={captureImages} />

      {images.length > 0 && (
        <Text style={{ marginTop: 20 }}>{images.length} image(s) captured.</Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
      ) : (
        <Button title="Upload PDF" onPress={handleUpload} disabled={!fileName || images.length === 0} />
      )}
    </View>
  );
};

export default UploadDocScreen;