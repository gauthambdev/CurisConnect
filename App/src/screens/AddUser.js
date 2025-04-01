"use client"

import { useState } from "react"
import { StyleSheet, Alert } from "react-native"
import Background from "../components/Background"
import Header from "../components/Header"
import Button from "../components/Button"
import TextInput from "../components/TextInput"

const AddUser = ({ navigation }) => {
  const [name, setName] = useState("")
  const [role, setRole] = useState("")

  const handleAddUser = () => {
    if (name && role) {
      // Here you would typically make an API call to add the user
      console.log("Adding user:", { name, role })
      Alert.alert("Success", "User added successfully!", [{ text: "OK", onPress: () => navigation.goBack() }])
    } else {
      Alert.alert("Error", "Please fill in all fields")
    }
  }

  return (
    <Background>
      <Header>Add New User</Header>
      <TextInput label="Name" value={name} onChangeText={setName} />
      <TextInput label="Role" value={role} onChangeText={setRole} />
      <Button mode="contained" onPress={handleAddUser} style={styles.button}>
        Add User
      </Button>
    </Background>
  )
}

const styles = StyleSheet.create({
  button: {
    marginTop: 24,
  },
})

export default AddUser

