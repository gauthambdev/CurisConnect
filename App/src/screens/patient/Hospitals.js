import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import MapView, { Marker, AnimatedRegion } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; // For the directions icon

const GOOGLE_API_KEY = 'AIzaSyAeNBZ8gRT7UZBLLNwPb5peSI8DNzjMKIk'; // Replace this

const Hospitals = () => {
  const [location, setLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      fetchNearbyHospitals(loc.coords.latitude, loc.coords.longitude);
    })();
  }, []);

  const fetchNearbyHospitals = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
        {
          params: {
            location: `${lat},${lng}`,
            radius: 3000,
            type: 'hospital',
            key: GOOGLE_API_KEY,
          },
        }
      );

      const enrichedHospitals = response.data.results.map((item) => {
        const dist = getDistanceFromLatLonInKm(
          lat,
          lng,
          item.geometry.location.lat,
          item.geometry.location.lng
        );
        return { ...item, distance: dist };
      });

      const sorted = enrichedHospitals.sort((a, b) => a.distance - b.distance);
      setHospitals(sorted);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const moveToLocation = (lat, lng) => {
    mapRef.current.animateToRegion(
      {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000
    );
  };

  const openDirections = (lat, lng) => {
    if (!location) return;
    const url = `https://www.google.co.in/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${lat},${lng}&travelmode=driving`;
    Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => moveToLocation(item.geometry.location.lat, item.geometry.location.lng)}>
      <View style={styles.item}>
        <View style={styles.itemContent}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.details}>{item.vicinity}</Text>
          <Text style={styles.distance}>{item.distance.toFixed(2)} km away</Text>
        </View>
        <TouchableOpacity
          style={styles.directionsButton}
          onPress={() => openDirections(item.geometry.location.lat, item.geometry.location.lng)}
        >
          <MaterialCommunityIcons name="map-marker-path" size={24} color="#4a148c" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker coordinate={location} title="You are here" />
          {hospitals.map((hospital, idx) => (
            <Marker
              key={idx}
              coordinate={{
                latitude: hospital.geometry.location.lat,
                longitude: hospital.geometry.location.lng,
              }}
              title={hospital.name}
              description={hospital.vicinity}
            />
          ))}
        </MapView>
      )}

      <View style={styles.listContainer}>
        <Text style={styles.heading}>Nearby Hospitals</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#000" />
        ) : (
          <FlatList
            data={hospitals}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  listContainer: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#f3e8ff',
    width: '100%',
    maxHeight: '45%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 5,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#4a148c',
    alignSelf: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  itemContent: {
    flex: 1,
  },
  name: { fontWeight: 'bold', fontSize: 16 },
  details: { color: 'gray' },
  distance: { color: '#6a1b9a', marginTop: 4 },
  directionsButton: {
    padding: 8,
  },
});

export default Hospitals;