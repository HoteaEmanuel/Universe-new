import jwt, { decode } from "jsonwebtoken";
export const verifyToken = async (req, res, next) => {
  let token = null;
  // check if there is a token in header
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  // token from cookie
  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }
  console.log("TOKEN: ", token);
  // Check if the refresh Token exists
  const refreshToken = req.cookies?.refreshToken;
  // If acces token is null ( e.g expired) and we have a refresh Token then generate a new access token
  if (!token && refreshToken) {
    try {
      // Check if refresh token is valid
      const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_KEY);
      if (!decodedRefresh) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }
      // Generate a new acces token
      const newToken = jwt.sign(
        { userId: decodedRefresh.userId },
        process.env.JWT_KEY,
        {
          expiresIn: "15m",
        },
      );

      // Saving in a cookie
      res.cookie("accessToken", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1 * 1000 * 60 * 15, // 15 minutes
      });
      req.userId = decodedRefresh.userId;
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Session expired" });
    }
  }

  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    // In case the acces token exists and not expired, we check if it is valid
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.log("ERROR: ", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
