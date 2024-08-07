// controllers/userController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary");

const User = require("../../models/Users/Users");

const createAccessToken = (user) => jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: "24h" });

const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(500).json({ msg: "This email is already registered" });

    if (password.length < 6) return res.status(500).json({ msg: "Password must be at least 6 characters" });

    // Encrypt password
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      phone,
      password: passwordHash,
    });

    await newUser.save();

    // Create JWT for authentication
    const accessToken = createAccessToken({ id: newUser._id });

    res.status(200).json({ user: { ...newUser._doc, password: undefined }, accessToken });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// controllers/userController.js

const login = async (req, res) => {  
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(500).json({ msg: "Invalid email" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(500).json({ msg: "Incorrect password" });

      // Create JWT for authentication
      const accessToken = createAccessToken({ id: user._id });
      
    // Remove the password field from the user object
    const { password: _, ...userWithoutPassword } = user.toObject();

    res.status(200).json({ accessToken, user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };

 // controllers/userController.js

const GetAllUsers = async (req, res) => {
    try {
      const users = await User.find({});
      res.status(200).json({ users, msg: "Successfully retrieved all users" });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  };
   
// controllers/userController.js

// const forgetPassword = async (req, res) => {
//     const { email } = req.body;
//     const user = await User.findOne({ email });
  
//     if (!user) return res.status(500).json({ msg: "User not found" });
  
//     // Get reset token
//     const resetToken = user.getRestPasswordToken();
//     await user.save({ validateBeforeSave: false });
  
//     const resetPasswordUrl = `${process.env.FRONTEND_URL}/api/v1/user/reset/${resetToken}`;
//     const message = `Your password reset token is:\n\n${resetPasswordUrl}\n\nIf you did not request this, please ignore this email.`;
  
//     try {
//       await sendEmail({
//         email: user.email,
//         subject: "Password Reset Request",
//         message,
//       });
  
//       res.status(200).json({
//         success: true,
//         message: `Email sent to ${user.email} successfully`,
//       });
//     } catch (error) {
//       user.resetPasswordToken = undefined;
//       user.resetPasswordExpire = undefined;
//       await user.save({ validateBeforeSave: false });
//       res.status(500).json({ msg: error.message });
//     }
//   };

  // controllers/userController.js

const resetPassword = async (req, res) => {
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
  
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
  
    if (!user) {
      return res.status(400).json({ msg: "Reset password token is invalid or has expired" });
    }
  
    if (req.body.password !== req.body.confirmpassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }
  
    const passwordHash = await bcrypt.hash(req.body.password, 10);
    user.password = passwordHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    const accessToken = createAccessToken({ id: user._id });
    await user.save();
  
    res.status(200).json({ msg: "Password updated successfully", accessToken, user, success: true });
  };
  
  // controllers/userController.js

const ChangePassword = async (req, res) => {
    const { id } = req.params;
    const { password, confirmpassword } = req.body;
  
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }
  
    if (password !== confirmpassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }
  
    const passwordHash = await bcrypt.hash(password, 10);
    user.password = passwordHash;
    const accessToken = createAccessToken({ id: user._id });
    await user.save();
  
    res.status(200).json({ msg: "Password updated successfully", accessToken, user, success: true });
  };
  
// controllers/userController.js

const deleteUser = async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
  
      res.status(200).json({
        user,
      });
    } catch (error) {
      res.status(400).json({
        status: "failed",
        error,
      });
    }
  };
  

  // controllers/userController.js

const getUserById = async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password");
  
      res.status(200).json({
        user,
      });
    } catch (error) {
      res.status(400).json({
        status: "failed",
        error,
      });
    }
  };
  
  // controllers/userController.js

const updateUser = async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      }).select("-password");
  
      res.status(200).json({
        user,
        message: "Successfully updated user",
      });
    } catch (error) {
      res.status(400).json({
        status: "failed",
        error,
        msg: "Try again later",
      });
    }
  };

  // controllers/userController.js

const updateUserProfileImg = async (req, res) => {
    try {
      const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "UserProfileImages",
        width: 150,
        crop: "scale",
      });
  
      const user = await User.findByIdAndUpdate(req.params.id, {
        avatar: {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        },
      }).select("-password");
  
      res.status(200).json({
        user,
      });
    } catch (error) {
      res.status(400).json({
        status: "failed",
        error,
      });
    }
  };
  

  module.exports = {
    login,
    register,
    // forgetPassword,
    resetPassword,
    deleteUser,
    getUserById,
    updateUser,
    GetAllUsers,
    updateUserProfileImg,
    ChangePassword
  };