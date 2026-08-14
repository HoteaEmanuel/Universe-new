import express from "express";
import type { Request, Response, NextFunction } from "express";
import {
  updateUserImage,
  unsavePost,
  followController,
  unfollowController,
  getUserById,
  followsUser,
  getFollowers,
  getFollowing,
  getAllUsers,
  getUsersFromSameUniversity,
  updateBio,
  getUserByName,
  savePostController,
} from "../controllers/user.controller.js";
import multer, { MulterError } from "multer";
import { validate } from "../middleware/validate.js";
import {
  updateBioSchema,
  followSchema,
  unfollowSchema,
} from "../schemas/user.schema.js";

const router = express.Router();

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;
// SVG is deliberately excluded from the allowlist: it can carry embedded scripts.
const ALLOWED_PROFILE_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: MAX_PROFILE_IMAGE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_PROFILE_IMAGE_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, WEBP, and GIF images are allowed"));
    }
    cb(null, true);
  },
});

const uploadProfileImage = (req: Request, res: Response, next: NextFunction) => {
  upload.single("image")(req, res, (err: unknown) => {
    if (err) {
      const message =
        err instanceof MulterError && err.code === "LIMIT_FILE_SIZE"
          ? "Image must be smaller than 5MB"
          : err instanceof Error
            ? err.message
            : "Could not process the uploaded image";
      return res.status(400).json({ message });
    }
    next();
  });
};

router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.get("/users-by-name/:name", getUserByName);
router.get("/followers/:id", getFollowers);
router.get("/following/:id", getFollowing);
router.patch("/update-bio", validate({ body: updateBioSchema }), updateBio);
router.get("/follows-user/:id", followsUser);
router.get("/users-from-same-university", getUsersFromSameUniversity);
router.put("/update-profile-image", uploadProfileImage, updateUserImage);
router.post("/posts/save/:id", savePostController);
router.post("/posts/unsave/:id", unsavePost);
router.post("/follow", validate({ body: followSchema }), followController);
router.post(
  "/unfollow",
  validate({ body: unfollowSchema }),
  unfollowController,
);

export default router;
