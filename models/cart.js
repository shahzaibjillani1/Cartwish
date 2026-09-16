const mongoose = require("mongoose");
const product = require("./product");

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "product",
                required: true
            },
            quantity: {
                type: Number,
                min: 1,
                default: 1,
                required: true
            },
            title: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true
            },
            image: {
                type: String,
                required: true
            },
        }
    ],
    totalProducts: {
        type: Number,
        default: 0
    },
    totalCartPrice: {
        type: Number,
        default: 0
    }
});

const cart = mongoose.model("cart", cartSchema);
module.exports = cart;