import { useState } from "react";
import {
  View,
  Image,
  ScrollView,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

type PostImageCarouselProps = {
  images: string[];
};

// Square-cropped, like the frontend feed's `aspect-square object-cover`.
// Paging needs a real pixel width to snap to, so it's only measured (via
// onLayout) for the multi-image case — a single image just fills its
// aspect-ratio box with percentage sizing, no measurement needed.
const PostImageCarousel = ({ images }: PostImageCarouselProps) => {
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);

  if (images.length <= 1) {
    return (
      <View style={{ width: "100%", aspectRatio: 1 }}>
        <Image
          source={{ uri: images[0] }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>
    );
  }

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    setPage(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={{ width: "100%", aspectRatio: 1 }} onLayout={onLayout}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {images.map((uri, index) => (
          <Image
            key={`${uri}-${index}`}
            source={{ uri }}
            style={{ width, height: width }}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
      <View
        pointerEvents="none"
        className="absolute bottom-2.5 w-full flex-row items-center justify-center gap-1.5"
      >
        {images.map((_, index) => (
          <View
            key={index}
            className={`h-1.5 rounded-full ${index === page ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
          />
        ))}
      </View>
    </View>
  );
};

export default PostImageCarousel;
