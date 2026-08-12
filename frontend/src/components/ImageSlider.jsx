import React from "react";
import { useRef } from "react";
import { useState } from "react";
import { GrPrevious } from "react-icons/gr";
import { GrNext } from "react-icons/gr";
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
  console.log(index);
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
          src={images[index-1]}
          alt="slider image"
          className="aspect-square w-full self-center object-cover select-none pointer-events-none"
        />
        <div className="absolute top-0 right-0 text-xs bg-gray rounded-xl p-1">
          {index} / {images.length}
        </div>
        <GrPrevious
          className="absolute top-1/2 left-2 size-7  glass-effect text-white cursor-pointer"
          onClick={handlePrevious}
        />
        <GrNext
          className="absolute top-1/2 right-2 size-7 glass-effect text-white cursor-pointer"
          onClick={handleNext}
        />
      </div>
    </div>
  );
}

export default ImageSlider;
