import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../../core/theme';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import jsPDF from 'jspdf';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import Background from '../../components/Background';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Paragraph from '../../components/Paragraph';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function DocUploadDocScreen({ navigation }) {
  const [images, setImages] = useState([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientModalVisible, setPatientModalVisible] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('docId', '==', currentUser.uid)
        );
        const snapshot = await getDocs(appointmentsQuery);

        const userIds = new Set();
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.userId) userIds.add(data.userId);
        });

        const patientPromises = Array.from(userIds).map(async userId => {
          const patientDocRef = doc(db, 'patients', userId);
          const patientDocSnap = await getDoc(patientDocRef);
          if (patientDocSnap.exists()) {
            const patientData = patientDocSnap.data();
            const { firstName, lastName, dob } = patientData;
            const age = calculateAge(dob);
            return {
              userId,
              name: `${firstName} ${lastName}`,
              age,
            };
          } else {
            return null;
          }
        });

        const patientsData = await Promise.all(patientPromises);
        setPatients(patientsData.filter(Boolean));
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };

    fetchPatients();
  }, []);

  const calculateAge = dobString => {
    if (!dobString) return 'Unknown';
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const storeInFirebase = async docURL => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');

      const uploadData = {
        uploadedBy: currentUser.uid,
        uploadedTo: selectedPatientId,
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
        if (currentPage > 1) pdf.addPage();

        const base64Data = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        pdf.addImage(base64Data, 'JPEG', 10, 10, 190, 277);
        currentPage++;
      }

      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      const pdfUri =
        FileSystem.documentDirectory + `${fileName || 'document'}.pdf`;
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

    if (!selectedPatientId) {
      alert('Please select a patient');
      return;
    }

    setLoading(true);
    try {
      const pdfUri = await createPDF();

      const response = await fetch(pdfUri);
      const blob = await response.blob();

      const storage = getStorage();
      const storageRef = ref(storage, `pdfs/${fileName}.pdf`);
      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on(
        'state_changed',
        snapshot => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        error => {
          console.error('Upload failed:', error);
          alert('Error uploading document');
          setLoading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await storeInFirebase(downloadURL);
          alert('Document uploaded successfully!');
          setImages([]);
          setFileName('');
          setSelectedPatientId('');
        }
      );
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
          result.assets.map(async asset => {
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

  const processImage = async uri => {
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

  const removeImage = index => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const renderPatientItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => {
        setSelectedPatientId(item.userId);
        setPatientModalVisible(false);
      }}
    >
      <Text style={styles.modalItemText}>{`${item.name} (Age: ${item.age})`}</Text>
    </TouchableOpacity>
  );

  return (
    <Background>
      <Header style={styles.header}>Upload Medical Document</Header>
      <Paragraph>
        Take pictures of your medical documents to create a PDF
      </Paragraph>

      <ScrollView style={{ width: '100%' }} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={[styles.dropdown, loading && styles.disabledDropdown]}
          onPress={() => setPatientModalVisible(true)}
          disabled={loading}
        >
          <Text style={styles.dropdownText}>
            {selectedPatientId
              ? patients.find(p => p.userId === selectedPatientId)?.name +
                ` (Age: ${patients.find(p => p.userId === selectedPatientId)?.age})`
              : 'Select recipient'}
          </Text>
          <Icon name="chevron-down" size={20} color={theme.colors.primary || '#800080'} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Enter document name"
          value={fileName}
          onChangeText={setFileName}
          editable={!loading}
        />

        {images.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
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

        <Button mode="contained" onPress={takePicture} disabled={loading}>
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

      <Modal
        visible={patientModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPatientModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Select Patient</Text>
            {patients.length === 0 ? (
              <Text style={styles.noDataText}>No patients available.</Text>
            ) : (
              <FlatList
                data={patients}
                renderItem={renderPatientItem}
                keyExtractor={item => item.userId}
                contentContainerStyle={styles.modalListContent}
              />
            )}
            <Button
              mode="contained"
              onPress={() => setPatientModalVisible(false)}
              style={styles.modalCloseButton}
              labelStyle={styles.buttonLabel}
            >
              Close
            </Button>
          </View>
        </View>
      </Modal>
    </Background>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 20,
    marginBottom: 20,
    paddingTop: 100,
    fontSize: 27,
    color: theme.colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    marginTop: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  disabledDropdown: {
    backgroundColor: '#e0e0e0',
    opacity: 0.5,
  },
  dropdownText: {
    fontSize: 16,
    color: '#666',
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#000',
    marginBottom: 20,
  },
  imageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalListContent: {
    paddingBottom: 15,
  },
  modalItem: {
    padding: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalItemText: {
    fontSize: 16,
    color: '#000',
  },
  modalCloseButton: {
    marginTop: 15,
    paddingVertical: 10,
    alignSelf: 'center',
    width: 120,
    borderRadius: 8,
    backgroundColor: '#560CCE',
  },
  buttonLabel: {
    fontSize: 16,
    color: '#fff',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
});