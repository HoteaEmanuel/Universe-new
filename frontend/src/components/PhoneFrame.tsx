import type { ReactNode } from "react";

type PhoneSticker = {
  content: ReactNode;
  className: string;
};

type PhoneFrameProps = {
  variant?: string;
  children: ReactNode;
  stickers?: PhoneSticker[];
};

const PhoneFrame = ({ variant = "", children, stickers = [] }: PhoneFrameProps) => (
  <div className={`cascade-device ${variant}`}>
    <div className="cascade-bezel" />
    <div className="cascade-edge-btn power" />
    <div className="cascade-edge-btn vol-up" />
    <div className="cascade-edge-btn vol-down" />
    <div className="cascade-rim">
      <div className="cascade-screen">{children}</div>
    </div>
    <div className="cascade-island">
      <span className="cascade-cam" />
      <span className="cascade-spk" />
    </div>
    {stickers.map((s, i) => (
      <span key={i} className={`cascade-phone-sticker ${s.className}`} aria-hidden="true">
        {s.content}
      </span>
    ))}
  </div>
);

export default PhoneFrame;
