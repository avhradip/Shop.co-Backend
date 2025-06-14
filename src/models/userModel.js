const mongoose = require('mongoose')
const bcrypy = require('bcrypt')

const userSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["admin", "user"]
    },
    name: {
        type: String,
        required: true,
        default:""
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    number: {
        type: Number,
        required: true,
        default: () => Math.floor(Math.random() * 10000), // example: random 4-digit number
    },    
    password: {
        type: String,
        required: true,
    },
    profilePicture: {
        type: String,
        default: ''
    },
    address: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address"
    }],
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    }],
    cart: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    }],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    }]
})

module.exports = mongoose.model("User", userSchema)