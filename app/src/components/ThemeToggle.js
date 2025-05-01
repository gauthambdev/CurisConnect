import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={toggleTheme}
      accessibilityLabel="Toggle theme"
      accessibilityRole="button"
    >
      <Icon
        name={isDarkMode ? 'weather-sunny' : 'weather-night'}
        size={24}
        color={isDarkMode ? '#FBBF24' : '#1F2937'}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 20,
    marginRight: 16,
  },
});

export default ThemeToggle; 