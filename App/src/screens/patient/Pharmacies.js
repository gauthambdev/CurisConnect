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
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; // Updated icon library

const GOOGLE_API_KEY = 'AIzaSyAeNBZ8gRT7UZBLLNwPb5peSI8DNzjMKIk'; // Keep this in .env ideally

const Pharmacies = () => {
  const [location, setLocation] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
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
      fetchNearbyPharmacies(loc.coords.latitude, loc.coords.longitude);
    })();
  }, []);

  const fetchNearbyPharmacies = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
        {
          params: {
            location: `${lat},${lng}`,
            radius: 3000,
            type: 'pharmacy',
            key: GOOGLE_API_KEY,
          },
        }
      );

      const withDistance = response.data.results
        .map(pharmacy => {
          const d = getDistanceFromLatLonInKm(
            lat,
            lng,
            pharmacy.geometry.location.lat,
            pharmacy.geometry.location.lng
          );
          return { ...pharmacy, distance: d };
        })
        .sort((a, b) => a.distance - b.distance); // Sort by nearest

      setPharmacies(withDistance);
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = deg => deg * (Math.PI / 180);

  const focusOnLocation = (lat, lng) => {
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
    <TouchableOpacity
      onPress={() =>
        focusOnLocation(item.geometry.location.lat, item.geometry.location.lng)
      }
    >
      <View style={styles.item}>
        <View style={styles.itemContent}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.details}>{item.vicinity}</Text>
          <Text style={styles.distance}>
            {item.distance.toFixed(2)} km away
          </Text>
        </View>
        <TouchableOpacity
          style={styles.directionsButton}
          onPress={() =>
            openDirections(
              item.geometry.location.lat,
              item.geometry.location.lng
            )
          }
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
          showsUserLocation
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {pharmacies.map((pharmacy, idx) => (
            <Marker
              key={idx}
              coordinate={{
                latitude: pharmacy.geometry.location.lat,
                longitude: pharmacy.geometry.location.lng,
              }}
              title={pharmacy.name}
              description={pharmacy.vicinity}
            />
          ))}
        </MapView>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <View style={styles.listContainer}>
          <Text style={styles.heading}>Nearby Pharmacies</Text>
          <FlatList
            data={pharmacies}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  listContainer: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#f3e8ff', // light purple hint
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
    marginBottom: 12,
    alignSelf: 'center',
    color: '#4a148c',
  },
  listContent: {
    paddingBottom: 30,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 12,
  },
  itemContent: {
    flex: 1,
  },
  name: { fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  details: { color: '#666', marginBottom: 4 },
  distance: { color: '#6a1b9a', marginTop: 4 },
  directionsButton: {
    padding: 8,
  },
});

export default Pharmacies;