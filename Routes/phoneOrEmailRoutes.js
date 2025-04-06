import express from "express";
import Otp from "../Models/otpModel.js"; // Import the Otp model
import nodemailer from "nodemailer";

const router = express.Router();

// Generate random 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Send OTP Route
router.post("/sendPhoneEmail-otp", async (req, res) => {
  const { phoneOrEmail } = req.body;
  if (!phoneOrEmail)
    return res.status(400).json({ error: "Phone or Email is required" });

  const otp = generateOTP();

  // Save OTP in DB
  await Otp.create({ phoneOrEmail, otp });

  console.log("Creating OTP in DB...");

  console.log("OTP saved in DB!");

  if (phoneOrEmail.includes("@")) {
    // Send via email
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: phoneOrEmail,
        subject: "Your OTP Code",
        html: `<p>Your OTP is: <b>${otp}</b></p>`,
      });

      return res.status(200).json({ message: "OTP sent to email!" });
    } catch (error) {
      return res.status(500).json({ error: "Failed to send email OTP" });
    }
  } else {
    // Return OTP in response (simulating SMS)
    return res
      .status(200)
      .json({ message: "OTP sent to mobile (test mode)", otp });
  }
});

// Verify OTP Route
router.post("/verifyPhoneEmail-otp", async (req, res) => {
  const { phoneOrEmail, otp } = req.body;
  if (!phoneOrEmail || !otp)
    return res.status(400).json({ error: "All fields required" });

  const valid = await Otp.findOne({ phoneOrEmail, otp });

  if (!valid) return res.status(400).json({ error: "Invalid or expired OTP" });

  await Otp.deleteMany({ phoneOrEmail }); // Cleanup OTPs
  return res.status(200).json({ message: "OTP verified successfully!" });
});

export default router;
