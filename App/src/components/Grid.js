import { View, StyleSheet } from "react-native"

export function Grid({ children }) {
  return <View style={styles.grid}>{children}</View>
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
})

