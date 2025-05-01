import React, { useEffect } from 'react'
import { Image, View, StyleSheet, Animated, Easing } from 'react-native'

export default function Logo({ animated = false }) {
  const scaleValue = new Animated.Value(1);

  useEffect(() => {
    if (!animated) return;

    const heartbeat = () => {
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.2,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1.2,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    };

    // Start the heartbeat animation
    heartbeat();

    // Repeat the animation every 3 seconds
    const interval = setInterval(heartbeat, 3000);

    return () => clearInterval(interval);
  }, [animated]);

  const ImageComponent = animated ? Animated.Image : Image;

  return (
    <View style={styles.container}>
      <ImageComponent 
        source={require('../assets/logo.png')} 
        style={[
          styles.image,
          animated && {
            transform: [{ scale: scaleValue }]
          }
        ]} 
        resizeMode="contain" 
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 8,
  },
})