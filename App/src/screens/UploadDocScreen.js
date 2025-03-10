import React, { useState } from 'react';
import { View, Text, TextInput, Image, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { MaterialIcons } from '@expo/vector-icons';
import jsPDF from 'jspdf';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

import Background from '../components/Background';
import Logo from '../components/Logo';
import Header from '../components/Header';
import Button from '../components/Button';
import Paragraph from '../components/Paragraph';

export default function UploadDocScreen({ navigation }) {
  const [images, setImages] = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);

  const takePicture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Camera permission is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({ quality: 1 });
      if (!result.canceled) {
        const processedImage = await processImage(result.assets[0].uri);
        setImages([...images, processedImage]);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
    }
  };

  const processImage = async (uri) => {
    const processedImage = await manipulateAsync(uri, [{ resize: { width: 1200 } }], { compress: 0.8, format: SaveFormat.JPEG });
    return processedImage.uri;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Background>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Logo />
          <Header>Upload Medical Document</Header>
          <Paragraph>Take pictures of your medical documents to create a PDF</Paragraph>

          <TextInput
            style={styles.input}
            placeholder="Enter document name"
            value={fileName}
            onChangeText={setFileName}
            editable={!loading}
          />

          {images.length > 0 && (
            <View style={styles.imageContainer}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.image} />
                  <Button mode="text" onPress={() => setImages(images.filter((_, i) => i !== index))}>
                    Remove
                  </Button>
                </View>
              ))}
            </View>
          )}

          <Button mode="contained" onPress={takePicture} disabled={loading}>
            Take Picture
          </Button>
        </ScrollView>
      </Background>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  input: {
    width: '90%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  imageContainer: {
    width: '90%',
    marginBottom: 20,
  },
  imageWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 10,
  },
  image: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
});
