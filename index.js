import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import nodemailer from "nodemailer"; // Import nodemailer

const app = express();
dotenv.config();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

const jsonData = JSON.parse(fs.readFileSync("data.json", "utf-8"));

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
      from: process.env.EMAIL_USER,
      to: process.env.FEEDBACK_EMAIL, // Feedback recipient email
      subject: "New Feedback Received",
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nLocation: ${location}\nMessage: ${feedback}`,
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
