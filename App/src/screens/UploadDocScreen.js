import React, { useState } from 'react';
import { View, Text, TextInput, Image, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { MaterialIcons } from '@expo/vector-icons';
import jsPDF from 'jspdf';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

import Background from '../components/Background'
import Logo from '../components/Logo'
import Header from '../components/Header'
import Button from '../components/Button'
import Paragraph from '../components/Paragraph'

export default function UploadDocScreen({ navigation }) {
  const [images, setImages] = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);

  const storeInFirebase = async (cloudinaryUrl) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');

      const uploadData = {
        uploadedBy: currentUser.uid,
        uploadedTo: currentUser.uid,
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

  const processImage = async (uri) => {
    try {
      const processedImage = await manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      return processedImage.uri;
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  return (
    <Background>
      <Logo />
      <Header>Upload Medical Document</Header>
      <Paragraph>
        Take pictures of your medical documents to create a PDF
      </Paragraph>

      <ScrollView style={{ width: '100%' }}>
        <TextInput
          style={{
            width: '100%',
            height: 40,
            borderColor: 'gray',
            borderWidth: 1,
            marginBottom: 20,
            paddingHorizontal: 10,
            borderRadius: 4,
          }}
          placeholder="Enter document name"
          value={fileName}
          onChangeText={setFileName}
          editable={!loading}
        />

        {images.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            {images.map((uri, index) => (
              <View 
                key={index} 
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 10,
                  padding: 10,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 4,
                }}
              >
                <Image 
                  source={{ uri }} 
                  style={{ width: 50, height: 50, marginRight: 10 }} 
                />
                <Text>Page {index + 1}</Text>
                <Button
                  mode="text"
                  onPress={() => removeImage(index)}
                  style={{ marginLeft: 'auto' }}
                >
                  Remove
                </Button>
              </View>
            ))}
          </View>
        )}

        <Button
          mode="contained"
          onPress={takePicture}
          disabled={loading}
        >
          Take Picture
        </Button>

        {images.length > 0 && (
          <Button
            mode="contained"
            onPress={handleUpload}
            disabled={loading}
            style={{ marginTop: 10 }}
          >
            {loading ? 'Processing...' : 'Create and Upload PDF'}
          </Button>
        )}
      </ScrollView>
    </Background>
  );
}