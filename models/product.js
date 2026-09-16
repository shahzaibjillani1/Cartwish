
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        minlength: 50
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    images: {
        type: [String],
        required: true
    },
    review: {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: false
        },
        rating: {
            type: Number,
            required: false,
            min: 0,
        },
        comment: {
            type: String,
        }
    }
});

module.exports = mongoose.model("Product", productSchema);