import { useState } from "react";
import { View, Image, Text, Pressable } from "react-native";
import ImageGalleryModal from "./ImageGalleryModal";

type MessageImageGridProps = {
  images: string[];
};

const GRID_SIZE = 192;
// Untyped (not StyleProp<ViewStyle>) so it structurally satisfies both
// View/Pressable's ViewStyle and Image's ImageStyle without a cast.
const CELL_FLEX = { flex: 1 };

// Ports frontend/src/features/chat/components/MessageImageGrid.tsx's
// 1/2/3/4+ layouts to RN flexbox (no CSS grid here). Owns its own
// tap-to-open gallery state instead of lifting it to MessageBubble/the
// thread screen like web does — RN's Modal is cheap when `visible={false}`,
// so there's no real cost to keeping this self-contained per message.
//
// Grid containers need an explicit width, not just height: MessageBubble
// wraps children in a Pressable with `alignItems: flex-end/flex-start` (for
// own-vs-other alignment), which does NOT stretch children to fill available
// width. Without a definite width here, the flex-1 image cells below have
// nothing to distribute and collapse to zero width — this, not a
// className/NativeWind issue, was why every multi-image layout rendered as
// empty space while the single-image case (explicit height AND width) worked.
const MessageImageGrid = ({ images }: MessageImageGridProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <>
        <Pressable onPress={() => setOpenIndex(0)}>
          <Image
            source={{ uri: images[0] }}
            style={{ height: 288, width: 220, borderRadius: 16 }}
            resizeMode="cover"
          />
        </Pressable>
        <ImageGalleryModal
          images={images}
          initialIndex={openIndex ?? 0}
          visible={openIndex !== null}
          onClose={() => setOpenIndex(null)}
        />
      </>
    );
  }

  if (images.length === 2) {
    return (
      <>
        <View className="flex-row gap-0.5 overflow-hidden rounded-2xl" style={{ height: GRID_SIZE, width: GRID_SIZE }}>
          {images.map((image, index) => (
            <Pressable key={image} onPress={() => setOpenIndex(index)} style={CELL_FLEX}>
              <Image source={{ uri: image }} style={CELL_FLEX} resizeMode="cover" />
            </Pressable>
          ))}
        </View>
        <ImageGalleryModal
          images={images}
          initialIndex={openIndex ?? 0}
          visible={openIndex !== null}
          onClose={() => setOpenIndex(null)}
        />
      </>
    );
  }

  if (images.length === 3) {
    return (
      <>
        <View className="flex-row gap-0.5 overflow-hidden rounded-2xl" style={{ height: GRID_SIZE, width: GRID_SIZE }}>
          <Pressable onPress={() => setOpenIndex(0)} style={CELL_FLEX}>
            <Image source={{ uri: images[0] }} style={CELL_FLEX} resizeMode="cover" />
          </Pressable>
          <View className="gap-0.5" style={CELL_FLEX}>
            <Pressable onPress={() => setOpenIndex(1)} style={CELL_FLEX}>
              <Image source={{ uri: images[1] }} style={CELL_FLEX} resizeMode="cover" />
            </Pressable>
            <Pressable onPress={() => setOpenIndex(2)} style={CELL_FLEX}>
              <Image source={{ uri: images[2] }} style={CELL_FLEX} resizeMode="cover" />
            </Pressable>
          </View>
        </View>
        <ImageGalleryModal
          images={images}
          initialIndex={openIndex ?? 0}
          visible={openIndex !== null}
          onClose={() => setOpenIndex(null)}
        />
      </>
    );
  }

  // 4+: a true 2x2 grid (matches web) rather than reusing the 3-image
  // asymmetric layout — the 4th tile carries the "+N" overlay.
  const remaining = images.length - 4;

  return (
    <>
      <View className="gap-0.5 overflow-hidden rounded-2xl" style={{ height: GRID_SIZE, width: GRID_SIZE }}>
        <View className="flex-row gap-0.5" style={CELL_FLEX}>
          <Pressable onPress={() => setOpenIndex(0)} style={CELL_FLEX}>
            <Image source={{ uri: images[0] }} style={CELL_FLEX} resizeMode="cover" />
          </Pressable>
          <Pressable onPress={() => setOpenIndex(1)} style={CELL_FLEX}>
            <Image source={{ uri: images[1] }} style={CELL_FLEX} resizeMode="cover" />
          </Pressable>
        </View>
        <View className="flex-row gap-0.5" style={CELL_FLEX}>
          <Pressable onPress={() => setOpenIndex(2)} style={CELL_FLEX}>
            <Image source={{ uri: images[2] }} style={CELL_FLEX} resizeMode="cover" />
          </Pressable>
          <Pressable onPress={() => setOpenIndex(3)} style={[CELL_FLEX, { position: "relative" }]}>
            <Image source={{ uri: images[3] }} style={CELL_FLEX} resizeMode="cover" />
            {remaining > 0 && (
              <View className="absolute inset-0 items-center justify-center bg-black/50">
                <Text className="text-lg font-semibold text-white">+{remaining}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
      <ImageGalleryModal
        images={images}
        initialIndex={openIndex ?? 0}
        visible={openIndex !== null}
        onClose={() => setOpenIndex(null)}
      />
    </>
  );
};

export default MessageImageGrid;
