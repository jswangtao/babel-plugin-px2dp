import React from "react";
import { View, StyleSheet } from "react-native";

export const Test = () => {
  const fontSize = 10 + 10;
  return <View size={`${10 + 10}rpx`} fontSize={`${fontSize}rpx`} style={styles.container} />;
};

const styles = StyleSheet.create({
  container: {
    width: 200,
    fontSize: "10rpx",
    backgroundColor: "pink"
  }
});
