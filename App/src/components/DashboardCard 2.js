import React from "react";
import { View, Text } from "react-native";
import Button from "./Button";

const DashboardCard = ({ title, description, icon, action }) => (
  <View className="bg-white rounded-lg shadow-md p-4">
    <View className="flex flex-row items-center mb-2">
      {icon}
      <Text className="text-lg font-bold ml-2">{title}</Text>
    </View>
    <Text className="text-gray-600 mb-4">{description}</Text>
    {action && (
      <Button mode="contained" onPress={action.onPress}>
        {action.label}
      </Button>
    )}
  </View>
);

export default DashboardCard;
