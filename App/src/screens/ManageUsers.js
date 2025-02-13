"use client"

import React, { useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import Background from "../components/Background"
import Header from "../components/Header"
import Button from "../components/Button"
import SearchBar from "../components/SearchBar"
import { theme } from "../core/theme"
import { fetchUsers, deleteUser } from "../api/users"

const UserItem = ({ user, onDelete }) => (
  <View style={styles.userItem}>
    <Text style={styles.userName}>{user.name}</Text>
    <Text style={styles.userRole}>{user.role}</Text>
    <TouchableOpacity onPress={() => onDelete(user.id)} style={styles.deleteButton}>
      <Text style={styles.deleteButtonText}>Delete</Text>
    </TouchableOpacity>
  </View>
)

const ManageUsers = ({ navigation }) => {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState("")

  const loadUsers = async () => {
    try {
      const fetchedUsers = await fetchUsers()
      setUsers(fetchedUsers)
      setFilteredUsers(fetchedUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
      Alert.alert("Error", "Failed to load users. Please try again.")
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      loadUsers()
    }, [loadUsers]), // Added loadUsers to dependencies
  )

  const handleSearch = (query) => {
    setSearchQuery(query)
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(query.toLowerCase()) || user.role.toLowerCase().includes(query.toLowerCase()),
    )
    setFilteredUsers(filtered)
  }

  const handleDelete = async (userId) => {
    try {
      await deleteUser(userId)
      setUsers(users.filter((user) => user.id !== userId))
      setFilteredUsers(filteredUsers.filter((user) => user.id !== userId))
    } catch (error) {
      console.error("Error deleting user:", error)
      Alert.alert("Error", "Failed to delete user. Please try again.")
    }
  }

  const handleAddUser = () => {
    navigation.navigate("AddUser")
  }

  return (
    <Background>
      <Header>Manage Users</Header>
      <SearchBar placeholder="Search users..." onChangeText={handleSearch} value={searchQuery} />
      <FlatList
        data={filteredUsers}
        renderItem={({ item }) => <UserItem user={item} onDelete={handleDelete} />}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
      />
      <Button mode="contained" onPress={handleAddUser} style={styles.addButton}>
        Add New User
      </Button>
    </Background>
  )
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    width: "100%",
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  userRole: {
    fontSize: 14,
    color: theme.colors.secondary,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    padding: 5,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: theme.colors.surface,
    fontSize: 12,
  },
  addButton: {
    margin: 10,
  },
})

export default ManageUsers

