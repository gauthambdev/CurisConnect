import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import jsPDF from 'jspdf';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

const UploadDocScreen = () => {
  const [images, setImages] = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);

  // Store upload information in Firebase
  const storeInFirebase = async (cloudinaryUrl) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');

      const uploadData = {
        uploadedBy: currentUser.uid,
        uploadedTo: currentUser.uid, // Set to current user
        filename: fileName,
        timestamp: serverTimestamp(),
        url: cloudinaryUrl,
      };

      const docRef = await addDoc(collection(db, 'uploads'), uploadData);
      console.log('Document stored in Firebase with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error storing in Firebase:', error);
      throw error;
    }
  };

  // Upload to Cloudinary
  const uploadToCloudinary = async (pdfUri) => {
    try {
      const cloudName = 'dle1vya8b';
      const uploadPreset = 'diagnoses';

      const formData = new FormData();
      formData.append('file', {
        uri: pdfUri,
        type: 'application/pdf',
        name: `${fileName || 'document'}.pdf`,
      });
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  };

  // Create PDF from images
  const createPDF = async () => {
    try {
      const pdf = new jsPDF();
      let currentPage = 1;

      for (const imageUri of images) {
        if (currentPage > 1) {
          pdf.addPage();
        }

        const base64Data = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        pdf.addImage(
          base64Data,
          'JPEG',
          10,
          10,
          190,
          277
        );

        currentPage++;
      }

      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      const pdfUri = FileSystem.documentDirectory + `${fileName || 'document'}.pdf`;
      await FileSystem.writeAsStringAsync(pdfUri, pdfBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return pdfUri;
    } catch (error) {
      console.error('Error creating PDF:', error);
      throw error;
    }
  };

  // Handle the complete upload process
  const handleUpload = async () => {
    if (images.length === 0) {
      alert('Please take at least one picture');
      return;
    }

    if (!fileName.trim()) {
      alert('Please enter a file name');
      return;
    }

    setLoading(true);
    try {
      const pdfUri = await createPDF();
      const cloudinaryUrl = await uploadToCloudinary(pdfUri);
      await storeInFirebase(cloudinaryUrl);
      
      alert('Document uploaded successfully!');
      setImages([]);
      setFileName('');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading document');
    } finally {
      setLoading(false);
    }
  };

  // Take picture using camera
  const takePicture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Camera permission is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 1,
        allowsMultipleSelection: true,
      });

      if (!result.canceled) {
        const processedImages = await Promise.all(
          result.assets.map(async (asset) => {
            return await processImage(asset.uri);
          })
        );
        setImages([...images, ...processedImages]);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      alert('Error taking picture');
    }
  };

  // Process image
  const processImage = async (uri) => {
    try {
      const processedImage = await manipulateAsync(
        uri,
        [
          { resize: { width: 1200 } },
        ],
        {
          compress: 0.8,
          format: SaveFormat.JPEG
        }
      );

      return processedImage.uri;
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={takePicture}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Take Picture</Text>
        </TouchableOpacity>

        {images.length > 0 && (
          <View style={styles.imagePreviewContainer}>
            {images.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={styles.imagePreview}
              />
            ))}
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Enter file name"
          value={fileName}
          onChangeText={setFileName}
          editable={!loading}
        />

        <TouchableOpacity 
          style={[styles.button, styles.uploadButton]} 
          onPress={handleUpload}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Processing...' : 'Upload Document'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  imagePreview: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 8,
  },
});

export default UploadDocScreen;