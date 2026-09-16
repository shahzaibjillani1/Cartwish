const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true
    },
    password: {
        type: String,
        required: false
    },
    googleId: {
        type: String,
        unique: true
    },
    facebookId: {
        type: String,
        unique: true
    },
    deliveryAddress: {
        type: String,
        required: false,
        minlength: 5
    },
    roles: {
        type: [String],
        enum: ["user","seller", "admin"],
        default: ["user"]
    }
});
const user = mongoose.model("user", userSchema);
module.exports = user;