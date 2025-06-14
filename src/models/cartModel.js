const mongoose = require("mongoose")

const cartSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    color: {
        type: String,
        required: true,
        min: 1
    },
    size: {
        type: String,
        required: true,
        min: 1
    },
    createdAt: {
        type: String,
        default: Date.now
    }
})

module.exports = mongoose.model("Cart", cartSchema)