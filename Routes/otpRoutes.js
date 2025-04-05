import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

// Temporary OTP store
const otpStore = {};

router.post("/send-otp", async (req, res) => {
  const { phoneOrEmail } = req.body;
  if (!phoneOrEmail) {
    return res.status(400).json({ error: "Phone or Email is required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore[phoneOrEmail] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // valid for 5 min
  };

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `OTP Verification <${process.env.EMAIL_USER}>`,
      to: phoneOrEmail,
      subject: "Your OTP Code",
      html: `<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; border-radius: 5px;">
        <h2 style="color: #333;">Your OTP Code</h2>
        <p style="font-size: 16px; color: #555;">For debit card payment verification of Rs.579 please enter the following OTP:</p>
        <h1 style="font-size: 24px; color: #4CAF50;">${otp}</h1>
        <p style="font-size: 14px; color: #777;">This code is valid for 5 minutes.</p>
      </div>`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

router.post("/verify-otp", (req, res) => {
  const { phoneOrEmail, otp } = req.body;
  const stored = otpStore[phoneOrEmail];

  if (!stored) {
    return res.status(400).json({ error: "No OTP requested" });
  }

  if (Date.now() > stored.expiresAt) {
    delete otpStore[phoneOrEmail];
    return res.status(400).json({ error: "OTP expired" });
  }

  if (stored.otp !== otp) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  delete otpStore[phoneOrEmail];
  return res.status(200).json({ message: "OTP verified successfully" });
});

export default router;
