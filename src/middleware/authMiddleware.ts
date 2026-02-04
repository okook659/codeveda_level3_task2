import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// Étendre le type Request pour inclure userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Interface pour le payload du JWT
interface TokenPayload extends JwtPayload {
  userId: string;
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        status: 401,
        message: "No token provided",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({
        status: 401,
        message: "No token provided",
      });
      return;
    }

    // Vérifier que JWT_SECRET existe
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    // Vérifier le token avec double cast (via unknown)
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as unknown as TokenPayload;

    console.log('decoded ', {...decoded});

    console.log('decoded user id', decoded.userId);

    // Ajouter l'userId à la requête
    req.userId = decoded._id;

    next();
  } catch (error) {
    res.status(401).json({
      status: 401,
      message: "Invalid or expired token",
    });
  }
};