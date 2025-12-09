import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    bio: { type: String, default: "" },
    profilePic: { type: String, default: "" },
    location: { type: String, default: "" },
    
    // --- UPDATED FIELDS START ---
    
    // 1. Role (Student or Teacher)
    role: { 
      type: String, 
      enum: ["student", "teacher"], 
      default: "student" 
    },

    // 2. Department (For both Students and Teachers)
    department: { type: String, default: "" },

    // 3. Year Level (For Students Only)
    yearLevel: { type: String, default: "" },

    // 4. Position (For Teachers Only)
    position: { type: String, default: "" },

    // REMOVED OLD FIELDS (You can delete these lines if you don't need the data anymore)
    // nativeLanguage: { type: String, default: "" },
    // learningLanguage: { type: String, default: "" },

    // --- UPDATED FIELDS END ---

    isOnboarded: { type: Boolean, default: false },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;