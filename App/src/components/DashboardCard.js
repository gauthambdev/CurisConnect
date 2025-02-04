import React from 'react'
import { View, StyleSheet } from 'react-native'
import Header from './Header'
import Paragraph from './Paragraph'
import Button from './Button'

export default function DashboardCard({ title, content, action, actions }) {
  return (
    <View style={styles.card}>
      <Header>{title}</Header>
      {content && content.map((item, index) => (
        <Paragraph key={index}>{item}</Paragraph>
      ))}
      {action && (
        <Button mode="contained" onPress={action.onPress}>
          {action.label}
        </Button>
      )}
      {actions && actions.map((action, index) => (
        <Button key={index} mode="contained" onPress={action.onPress}>
          {action.label}
        </Button>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
})