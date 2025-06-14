const mongoose = require("mongoose")

const wishlistSchema = new mongoose.Schema({
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
    createdAt: {
        type: String,
        default: Date.now
    }
})

module.exports = mongoose.model("Wishlist",wishlistSchema)