import jwt from "jsonwebtoken";

export const generateJwtMobile = async (userId: string) => {
  try {
    const accessToken = jwt.sign({ userId }, process.env.JWT_KEY, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ userId }, process.env.JWT_KEY, {
      expiresIn: "30d",
    });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating JWT token:", error);
  }
};
