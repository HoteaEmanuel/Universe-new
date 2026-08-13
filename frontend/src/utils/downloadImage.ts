const CLOUDINARY_UPLOAD_MARKER = "/upload/";

export const downloadImage = (url: string) => {
  const markerIndex = url.indexOf(CLOUDINARY_UPLOAD_MARKER);
  const downloadUrl =
    markerIndex === -1
      ? url
      : `${url.slice(0, markerIndex + CLOUDINARY_UPLOAD_MARKER.length)}fl_attachment/${url.slice(markerIndex + CLOUDINARY_UPLOAD_MARKER.length)}`;

  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};
