import React, { useState } from 'react';
import { View, Text, TextInput, Image, StyleSheet, ScrollView } from 'react-native';
import { theme } from "../../core/theme";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import jsPDF from 'jspdf';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFunctions, httpsCallable } from 'firebase/functions';
import Background from '../../components/Background'
import Header from '../../components/Header'
import Button from '../../components/Button'
import Paragraph from '../../components/Paragraph'

export default function UploadDocScreen({ navigation }) {
  const [images, setImages] = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  const storeInFirebase = async (docURL) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');

      const uploadData = {
        uploadedBy: currentUser.uid,
        uploadedTo: currentUser.uid,
        filename: fileName,
        timestamp: serverTimestamp(),
        url: docURL,
      };

      const docRef = await addDoc(collection(db, 'uploads'), uploadData);
      console.log('Document stored in Firebase with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error storing in Firebase:', error);
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

  const processDocumentWithVision = async (pdfUrl, docId) => {
    try {
      setProcessingStatus('Extracting text from PDF...');
      
      // Call the Cloud Function to process the PDF
      const functions = getFunctions();
      const extractTextFromPdf = httpsCallable(functions, 'extract1');
      
      const result = await extractTextFromPdf({ pdfUrl });
      console.log('Text extraction result:', result.data);
      
      // Update the Firestore document with the extracted text
      await updateDoc(doc(db, 'uploads', docId), {
        extractedText: result.data.text,
        processedAt: serverTimestamp()
      });
      
      setProcessingStatus('Text extraction complete');
      return result.data;
    } catch (error) {
      console.error('Error processing document with Vision API:', error);
      setProcessingStatus('Error extracting text');
      throw error;
    }
  };

  const handleUpload = async () => {
    if (images.length === 0) {
        alert("Please take at least one picture");
        return;
    }

    if (!fileName.trim()) {
        alert("Please enter a file name");
        return;
    }

    setLoading(true);
    setProcessingStatus('Creating PDF...');
    try {
        // Generate the PDF URI
        const pdfUri = await createPDF();

        // Convert the file to a Blob
        const response = await fetch(pdfUri);
        const blob = await response.blob();

        // Upload to Firebase Storage
        setProcessingStatus('Uploading PDF...');
        const storage = getStorage();
        const storageRef = ref(storage, `pdfs/${fileName}.pdf`);
        const uploadTask = uploadBytesResumable(storageRef, blob);

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log(`Upload is ${progress}% done`);
                setProcessingStatus(`Uploading: ${Math.round(progress)}%`);
            },
            (error) => {
                console.error("Upload failed:", error);
                alert("Error uploading document");
                setLoading(false);
                setProcessingStatus('');
            },
            async () => {
                try {
                    // Get download URL
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    // Store in Firestore
                    const docId = await storeInFirebase(downloadURL);
                    
                    // Process the document with Vision API
                    await processDocumentWithVision(downloadURL, docId);
                    
                    alert("Document uploaded and processed successfully!");
                    setImages([]);
                    setFileName("");
                } catch (error) {
                    console.error("Processing error:", error);
                    alert("Document was uploaded but there was an error processing the text");
                } finally {
                    setLoading(false);
                    setProcessingStatus('');
                }
            }
        );
    } catch (error) {
        console.error("Upload error:", error);
        alert("Error uploading document");
        setLoading(false);
        setProcessingStatus('');
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
      <Header style={styles.header}>Upload Medical Document</Header>
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

        {processingStatus ? (
          <Text style={styles.statusText}>{processingStatus}</Text>
        ) : null}
      </ScrollView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
    paddingTop: 100,
    fontSize: 27,
    color: theme.colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusText: {
    marginTop: 20,
    textAlign: 'center',
    color: theme.colors.secondary,
    fontStyle: 'italic'
  }
});