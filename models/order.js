const { required } = require("joi");
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
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
        totalPrice: {
            type: Number,
            default: 0
        },
        shippingAddress: {
            type: String,
            required: true
        },
        paymentId: {
            type: String,
            required: true
        },
        Paymentstatus: {
            type: String,
            required: true
        },
        orderStatus: {
            type: String,
            enum: ["pending", "processing", "shipped", "delivered"],
            default: "pending"
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        deliveredAt: {
            type: Date,
        }

});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;