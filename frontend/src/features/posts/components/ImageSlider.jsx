import { useRef } from "react";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
function ImageSlider({ images }) {
  const [index, setIndex] = useState(1);

  const touchStartX = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) {
      // swiped left → next
      let newIndex = index + 1;
      if (newIndex > images.length) newIndex = 1;
      setIndex(newIndex);
    } else if (diff < -50) {
      // swiped right → previous
      let newIndex = index - 1;
      if (newIndex < 1) newIndex = images.length;
      setIndex(newIndex);
    }
  };

  const mouseStartX = useRef(null);

  const handleMouseDown = (e) => {
    e.preventDefault();
    mouseStartX.current = e.clientX;
  };

  const handleMouseUp = (e) => {
    e.preventDefault();
    const diff = mouseStartX.current - e.clientX;

    if (diff > 50) {
      let newIndex = index + 1;
      if (newIndex > images.length) newIndex = 1;
      setIndex(newIndex);
    } else if (diff < -50) {
      let newIndex = index - 1;
      if (newIndex < 1) newIndex = images.length;
      setIndex(newIndex);
    }
  };

  const handlePrevious = (e) => {
    e.preventDefault();
    e.stopPropagation();
    let newIndex = index - 1;
    if (newIndex < 1) newIndex = images.length;
    setIndex(newIndex);
  };

  const handleNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    let newIndex = index + 1;
    if (newIndex > images.length) newIndex = 1;
    setIndex(newIndex);
  };

  const handleDotClick = (e, dotIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex(dotIndex + 1);
  };
  return (
    <div
      className="w-full"
      onClick={(e) => {
        e.preventDefault();
      }}
    >
      <div
        className="relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        draggable={false}
      >
        <img
          src={images[index - 1]}
          alt="slider image"
          className="aspect-square w-full self-center object-cover select-none pointer-events-none"
        />
        <div className="glass-effect absolute top-2 right-2 px-2 py-1 text-xs text-white">
          {index} / {images.length}
        </div>
        <ChevronLeft
          className="glass-effect absolute top-1/2 left-2 size-7 -translate-y-1/2 cursor-pointer text-white transition-opacity hover:opacity-80"
          onClick={handlePrevious}
        />
        <ChevronRight
          className="glass-effect absolute top-1/2 right-2 size-7 -translate-y-1/2 cursor-pointer text-white transition-opacity hover:opacity-80"
          onClick={handleNext}
        />
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to image ${i + 1}`}
              className="p-1"
              onClick={(e) => handleDotClick(e, i)}
            >
              <span
                className={`block size-1.5 rounded-full transition-colors ${
                  i === index - 1 ? "bg-white" : "bg-white/40"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ImageSlider;
