import express from "express";
import { Application } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { User } from "./models/user";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { authMiddleware } from "./middleware/authMiddleware";

const app: Application = express();


app.use(cors());

dotenv.config();

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

const PORT: number = 8000;

app.get("/", (req, res) => {
  res.send("<h1>Welcome To JWT Authentication </h1>");
});

app.listen(PORT, async () => {
  console.log(`🗄️  Server Fire on http:localhost//${PORT}`);

  try {
    await mongoose.connect(
      process.env.DATABASE_URL as string
    );
    console.log("🛢️  Connected To Database");
  } catch (error) {
    console.log("⚠️ Error to connect Database");
  }
});

app.post("/auth/register", async (req, res) => {
  try {
    const user = req.body;
    const { name, email, password } = user;

    const isEmailAllReadyExist = await User.findOne({
      email: email,
    });

    if (isEmailAllReadyExist) {
      res.status(400).json({
        status: 400,
        message: "Email already in use",
      });
      return;
    }

    // HACHAGE DU MOT DE PASSE
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword, // ✅ Stocker le mot de passe haché
    });

    // Ne pas retourner le mot de passe dans la réponse
    const userResponse = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    };

    res.status(201).json({
      status: 201,
      success: true,
      message: "User created successfully",
      user: userResponse, // ✅ Sans le mot de passe
    });
  } catch (error: any) {
    console.log(error);
    res.status(400).json({
      status: 400,
      message: error.message.toString(),
    });
  }
});

// login
/*
app.post("/auth/login", async (req, res) => {
  try {
    const user = req.body;

    const { email, password } = user;

    const isUserExist = await User.findOne({
      email: email,
    });


    if (!isUserExist) {
      res.status(404).json({
        status: 404,
        success: false,
        message: "User not found",
      });
return;
    }


    const isPasswordMatched =
      isUserExist?.password === password;


    if (!isPasswordMatched) {
      res.status(400).json({
        status: 400,
        success: false,
        message: "wrong password",
      });
        return;
    }

   
    const token = jwt.sign(
      { _id: isUserExist?._id, email: isUserExist?.email },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "1d",
      }
    );

  
    res.status(200).json({
      status: 200,
      success: true,
      message: "login success",
      token: token,
    });
  } catch (error: any) {
    res.status(400).json({
      status: 400,
      message: error.message.toString(),
    });
  }
});*/

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({
        status: 401,
        message: "User not found",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        status: 401,
        message: "Wrong password",
      });
      return;
    }

     const token = jwt.sign(
      { _id: user?._id, email: user?.email },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "1d",
      }
    );
    
    res.status(200).json({
      status: 200,
      success: true,
      message: "Login successful",
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.log(error);
    res.status(400).json({
      status: 400,
      message: error.message.toString(),
    });
  }
});

app.get("/auth/profile", authMiddleware, async (req, res) => {
  try {
    console.log(req.userId);
    const user = await User.findById(req.userId).select("-password");

    console.log(user);

    if (!user) {
      res.status(404).json({
        status: 404,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      status: 200,
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.log(error);
    res.status(400).json({
      status: 400,
      message: error.message.toString(),
    });
  }
});