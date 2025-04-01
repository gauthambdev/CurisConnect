import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import Paragraph from './Paragraph'

export default function PatientCard({ name, time, status, onPress }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.card}>
        <View style={styles.row}>
          <Paragraph style={styles.name}>{name}</Paragraph>
          <View style={[styles.statusBadge, styles[status.toLowerCase()]]}>
            <Paragraph style={styles.statusText}>{status}</Paragraph>
          </View>
        </View>
        <Paragraph style={styles.time}>{time}</Paragraph>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontWeight: 'bold',
  },
  time: {
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
  },
  admitted: {
    backgroundColor: '#4CAF50',
  },
  emergency: {
    backgroundColor: '#f44336',
  },
  discharged: {
    backgroundColor: '#2196F3',
  }
})