import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import nodemailer from "nodemailer"; // Import nodemailer
import otpRoutes from "./Routes/otpRoutes.js"; // Import the OTP routes
import mongoose from "mongoose"; // Import mongoose for MongoDB connection
import phoneOrEmailRoutes from "./Routes/phoneOrEmailRoutes.js"; // Import the phone or email routes

const app = express();
dotenv.config();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;
const DBURL = process.env.DBURL; // MongoDB connection string

const jsonData = JSON.parse(fs.readFileSync("data.json", "utf-8"));

// Middleware to log the request body
app.use((req, res, next) => {
  console.log("Request Body:", req.body); // Log the request body
  next();
});
app.use("/api", otpRoutes); // Use the OTP routes
app.use("/api", phoneOrEmailRoutes); // Use the phone or email routes

// Feedback email route
app.post("/api/feedback", async (req, res) => {
  const { name, email, phone, location, feedback } = req.body;
  console.log("Received body:", req.body); // यह लाइन जोड़ें

  if (!name || !email || !phone || !location || !feedback) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Configure the transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", // Use your email service provider
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app password
      },
    });

    // Email options
    const mailOptions = {
      from: `From  ${name} ${process.env.EMAIL_USER}`, // Sender address
      to: process.env.FEEDBACK_EMAIL, // Feedback recipient email
      subject: "New Feedback Received",
      replyTo: email, // Reply-to address
      html: `
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <div style="background-color: #4CAF50; color: #ffffff; padding: 20px; text-align: center;">
      <h2 style="margin: 0;">📬 नया फीडबैक प्राप्त हुआ</h2>
    </div>
    <div style="padding: 20px;">
      <p style="font-size: 16px; margin-bottom: 10px;"><strong>👤 नाम:</strong> ${name}</p>
      <p style="font-size: 16px; margin-bottom: 10px;"><strong>📧 ईमेल:</strong> ${email}</p>
      <p style="font-size: 16px; margin-bottom: 10px;"><strong>📱 फ़ोन:</strong> ${phone}</p>
      <p style="font-size: 16px; margin-bottom: 10px;"><strong>📍 स्थान:</strong> ${location}</p>
      <p style="font-size: 16px; margin-top: 20px; margin-bottom: 5px;"><strong>💬 संदेश:</strong></p>
      <div style="font-size: 15px; background-color: #f4f4f4; padding: 15px; border-left: 4px solid #4CAF50; border-radius: 5px; white-space: pre-line;">
        ${feedback}
      </div>
    </div>
    <div style="background-color: #f1f1f1; text-align: center; padding: 10px; font-size: 13px; color: #777;">
      यह ईमेल आपके वेबसाइट फीडबैक फॉर्म से भेजा गया है।
    </div>
  </div>
    `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Feedback sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send feedback" });
  }
});

app.get("/api/data", (req, res) => {
  res.json(jsonData);
});

mongoose
  .connect(DBURL)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
