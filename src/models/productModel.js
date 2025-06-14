const mongoose = require("mongoose");
const reviewModel = require("./reviewModel");

const productSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: String,
        required: true,
        trim: true,
        min: 0
    },
    category: {
        type: String,
        required: true
    },
    subCategory: {
        type: String,
        required: true
    },
    image: {
        type: Array,
        required: true
    },
    stock: {
        type: Number,
        default: 0,
        min: 0
    },
    size: {
        type: [String],
        default: []
    },
    material: {
        type: String,
        default: "Cotton"
    },
    color: {
        type: [String],
        default: ["Black"]
    },
    brand: {
        type: String,
        default: "Generic"
    },
    reviews: {
        type: Array,
        ref:"Review",
        default: []
    },
    averageRating: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Product", productSchema);
