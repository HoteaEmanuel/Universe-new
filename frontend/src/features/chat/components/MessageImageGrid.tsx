type MessageImageGridProps = {
  images: string[];
  onOpen: (index: number) => void;
};

const GRID_CELL_CLASS =
  "h-full w-full cursor-pointer object-cover select-none";

const MessageImageGrid = ({ images, onOpen }: MessageImageGridProps) => {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <img
        src={images[0]}
        alt="attachment"
        className="max-h-72 max-w-full cursor-pointer rounded-2xl object-cover"
        onClick={() => onOpen(0)}
      />
    );
  }

  if (images.length === 2) {
    return (
      <div className="grid h-48 grid-cols-2 gap-0.5 overflow-hidden rounded-2xl">
        {images.map((image, index) => (
          <img
            key={image}
            src={image}
            alt="attachment"
            className={GRID_CELL_CLASS}
            onClick={() => onOpen(index)}
          />
        ))}
      </div>
    );
  }

  if (images.length === 3) {
    return (
      <div className="grid h-48 grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-2xl">
        <img
          src={images[0]}
          alt="attachment"
          className={`${GRID_CELL_CLASS} row-span-2`}
          onClick={() => onOpen(0)}
        />
        <img
          src={images[1]}
          alt="attachment"
          className={GRID_CELL_CLASS}
          onClick={() => onOpen(1)}
        />
        <img
          src={images[2]}
          alt="attachment"
          className={GRID_CELL_CLASS}
          onClick={() => onOpen(2)}
        />
      </div>
    );
  }

  const remaining = images.length - 3;

  return (
    <div className="grid h-48 grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-2xl">
      {images.slice(0, 3).map((image, index) => (
        <img
          key={image}
          src={image}
          alt="attachment"
          className={GRID_CELL_CLASS}
          onClick={() => onOpen(index)}
        />
      ))}
      <div
        className="relative cursor-pointer"
        onClick={() => onOpen(3)}
      >
        <img
          src={images[3]}
          alt="attachment"
          className={GRID_CELL_CLASS}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
          +{remaining}
        </div>
      </div>
    </div>
  );
};

export default MessageImageGrid;
