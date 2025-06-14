const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    products: [
        {
            product: {
                _id: mongoose.Schema.Types.ObjectId,
                name: String,
                image: [String],
                price: Number
            },
            quantity: { type: Number, required: true }
        }
    ],
    paymentMethod: {
        type: String,
        enum: ["cash", "paypal", "bank"]
    },
    address: {
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String
    },
    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
        default: "pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Order", orderSchema)
