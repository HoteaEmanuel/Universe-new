import { View, Text } from "react-native";
import React from "react";
import { useState, useRef } from "react";
import { Image, Button } from "react-native";
import ThemedText from "./ThemedText";

const ImageSlider = ({ images }) => {
  const [index, setIndex] = useState(1);

  const touchStartX = useRef(null);
  const handlePrevious = () => {
    let newIndex = index - 1;
    if (newIndex < 1) newIndex = images.length;
    setIndex(newIndex);
  };
  const handleNext = () => {
    let newIndex = index + 1;
    if (newIndex > images.length) newIndex = 1;
    setIndex(newIndex);
  };
  return (
    <View
      className="relative"
      onTouchStart={(e) => {
        e.stopPropagation();
        touchStartX.current = e.nativeEvent.pageX;
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
        const touchEndX = e.nativeEvent.pageX;
        const diff = touchStartX.current - touchEndX;
        if (diff > 30) {
          handleNext();
        } else if (diff < -30) {
          handlePrevious();
        }
      }}
    >
      <View className="absolute flex items-center  justify-center top-0 right-0 rounded-r-xl rounded-b-xl p-3 bg-black/50 z-10">
        <ThemedText className="absolute text-xs  z-10">
          {index} / {images.length}
        </ThemedText>
      </View>
      <Image
        source={{ uri: images[index - 1] }}
        style={{ width: "100%", height: 200 }}
        className="rounded-t-2xl object-cover"
      />
    </View>
  );
};

export default ImageSlider;
