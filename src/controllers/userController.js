const jwt = require("jsonwebtoken")
const mongoose = require('mongoose');
const bcrypt = require("bcrypt")
const userModel = require("../models/userModel")
const getDataUri = require("../config/datauri")
const cloudinary = require('../config/cloudinary');
const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const wishlistModel = require("../models/wishlistModel");
const addressModel = require("../models/addressModel");
const orderModel = require("../models/orderModel");
const reviewModel = require("../models/reviewModel");
var nodemailer = require('nodemailer');
const JWT_SECRET = process.env.JWT_SECRET

exports.signUp = async (req, res) => {
    try {
        const { name, email, number, password, type } = req.body

        if (!name, !email, !number, !password, !type) {
            return res.status(404).json({ message: "plese enter all required fields", success: false })
        }

        const exist = await userModel.findOne({ email: email })

        if (exist) {
            return res.status(409).json({ message: "User already exists", success: false })
        }
        const hashPassword = await bcrypt.hash(password, 10)

        const newUser = new userModel({
            name, email, number, type, password: hashPassword
        })

        await newUser.save()

        if (!newUser) {
            return res.status(400).json({ message: "faild to signup user!", success: false })
        }

        return res.status(200).json({ message: "Signup sucessfull", success: true })

    } catch (error) {
        console.log("signup", error)
        res.status(500).json({ message: "surver error", error: error })
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email, !password) {
            return res.status(404).json({ message: "plese enter all required fields", success: false })
        }

        const user = await userModel.findOne({ email: email })

        if (!user) {
            return res.status(404).json({ message: "user not found!", success: false })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(400).json({ message: "invalid email or password", success: false })
        }

        const token = await jwt.sign({ id: user._id }, JWT_SECRET, {
            expiresIn: "1d"
        })

        return res.status(200).json({ message: "login Sucessfull", success: true, user: user, token: token })
    } catch (error) {
        console.log("login", error)
        res.status(500).json({ message: "surver error", error: error })
    }
}

exports.googlelogin = async (req, res) => {
    try {
        const { email, name, googleId, image } = req.body;

        if (!email) {
            return res.status(404).json({ message: "plese enter all required fields", success: false })
        }

        let user = await userModel.findOne({ email: email })

        if (!user) {
            user = await userModel.create({ email, name, googleId, avatar: image });
        }

        const token = generateJWT(user);
        res.json({ token });
    } catch (error) {
        console.log("googlelogin", error)
        res.status(500).json({ message: "surver error", error: error })
    }
}

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found", success: false });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });

        const resetURL = `https://golden-jelly-72b975.netlify.app/reset-password/${token}`;

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'abirghosh102@gmail.com',
                pass: 'qbii tjjm ktdr paxm'
            }
        });

        var mailOptions = {
            from: 'abirghosh102@gmail.com',
            to: email,
            subject: 'Password reset',
            text: resetURL
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        res.status(200).json({ message: "Reset link sent to your email", success: true });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const userId = req.user.id
        const { newPassword, conformPassword } = req.body;

        if (!newPassword || !conformPassword) {
            return res.status(400).json({ message:"newPassword and conformPassword not found..!"})
        }

        if (newPassword !== conformPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const hashPassword = await bcrypt.hash(newPassword, 10)

        await userModel.findByIdAndUpdate(userId, { password: hashPassword })

        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: "Invalid or expired token" });
    }
};

exports.getUser = async (req, res) => {
    try {
        const userId = req.user.id
        const user = await userModel.findById(userId)
        if (!user) return res.status(400).json({ message: "user not found", success: false })
        res.status(200).json({ success: true, user: user })
    } catch (error) {
        console.log("getUser", error)
        res.status(500).json({ message: "surver error", error: error })
    }
}

exports.editProfile = async (req, res) => {
    try {
        const userId = req.user.id
        const name = req.body.name
        const number = req.body.number
        const profilePicture = req.file

        let cloudinaryres

        const user = userModel.findById(userId)

        if (!user) {
            return res.status(404).json({ message: "user not found!", success: false })
        }

        if (profilePicture) {
            const filePath = getDataUri(profilePicture)
            cloudinaryres = await cloudinary.uploader.upload(filePath)
        }

        const updateFields = {}
        if (name) updateFields.name = name
        if (number) updateFields.number = number
        if (cloudinaryres) updateFields.profilePicture = cloudinaryres.secure_url

        const updatedProfile = await userModel.findByIdAndUpdate(userId, updateFields, {
            new: true
        }).select('-password')

        if (!updatedProfile) {
            return res.status(400).json({ message: "failed to updated profile" })
        }

        return res.status(200).json({ message: "user updated successfully", user: updatedProfile })

    } catch (error) {
        console.log("login", error)
        res.status(500).json({ message: "surver error", error: error.message })
    }
}

exports.editCart = async (req, res) => {
    try {
        const productId = req.params.id
        const userId = req.user.id
        const { quantity } = req.body || {}

        if (!productId) return res.status(400).json({ message: "product id is required", success: false })
        if (!quantity) return res.status(400).json({ message: "quantity is required", success: false })

        const user = await userModel.findById(userId)
        const product = await productModel.findById(productId)

        if (!user) return res.status(404).json({ message: "user not found" });
        if (!product) return res.status(404).json({ message: "Product not found" });

        const cartItem = await cartModel.findOne({ userId: userId, product: productId })

        if (!cartItem) return res.status(401).json({ message: "cartItem not found", success: false })

        cartItem.quantity = quantity;
        const updated = await cartItem.save();

        return res.status(200).json({ message: "cart updated", success: true, updatedCaet: updated })
    } catch (error) {
        console.log("Edit to cart", error)
        res.status(500).json({ message: "surver error", error: error.message })
    }
}

exports.addToCart = async (req, res) => {
    try {
        const productId = req.params.id
        const userId = req.user.id
        const { quantity, size, color } = req.body || {}

        const user = await userModel.findById(userId)
        const product = await productModel.findById(productId)

        if (!productId) return res.status(400).json({ message: "product id is required", success: false })
        if (!user) return res.status(404).json({ message: "user not found" });
        if (!product) return res.status(404).json({ message: "Product not found" });

        let cartItem = await cartModel.findOne({ userId: userId, product: productId });


        if (cartItem) {
            cartItem.quantity += quantity || 1
            await cartItem.save()
            return res.status(200).json({ message: "Product added to cart", success: true, cartItem });
        } else {
            cartItem = new cartModel({
                userId: user._id,
                product: productId,
                quantity: quantity || 1,
                size: size,
                color: color
            })
            await cartItem.save()
            await userModel.updateOne({ _id: userId }, { $push: { cart: productId } })
            return res.status(200).json({ message: "Product added to cart", success: true });
        }
    } catch (error) {
        console.log("Add to cart", error)
        res.status(500).json({ message: "surver error", error: error.message })
    }
}

exports.getUserCartItems = async (req, res) => {
    try {
        const userId = req.user.id;

        const cartItems = await cartModel
            .find({ userId: userId.toString() })
            .populate("product").populate({ path: "userId", select: "name" })

        if (!cartItems || cartItems.length === 0) {
            return res.status(200).json({ message: "Your cart is empty" });
        }

        return res.status(200).json({
            message: "Your added cart items",
            cartItems: cartItems
        });

    } catch (error) {
        console.error("Get cart items error:", error);
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

exports.removeCartItem = async (req, res) => {
    try {
        const cartId = req.params.id;
        const userId = req.user.id;

        const cart = await cartModel.findById({ _id: cartId })
        const user = await userModel.findById({ _id: userId })

        if (!cart) return res.status(400).json({ message: "cart not found", success: false })

        const productIdToRemove = cart.product.toString();

        user.cart = user.cart.filter(id => id.toString() !== productIdToRemove);
        await user.save();

        await cartModel.findByIdAndDelete({ _id: cart._id })
        return res.status(200).json({ message: "Product removed from cart", success: true });

    } catch (error) {
        console.error("Remove Cart Item Error:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.addorremovefromWishlist = async (req, res) => {
    try {
        const productId = req.params.id
        const userId = req.user.id


        if (!productId) {
            return res.status(400).json({ message: "product id is required", success: false })
        }

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized to add product in Wishlist", success: false })
        }

        const product = await productModel.findOne({ _id: productId })

        if (!product) {
            return res.status(400).json({ message: "product not found!", success: false })
        }

        let wishlisted = await wishlistModel.findOne({ userId: userId, product: productId })

        if (!wishlisted) {
            const wishlistItem = new wishlistModel({
                userId: userId,
                product: productId,
            })
            await wishlistItem.save()
            await userModel.updateOne({ _id: userId }, { $push: { wishlist: productId } })
            return res.status(200).json({ message: "Product added to wishlist", success: true });
        } else {
            await wishlistModel.findByIdAndDelete({ _id: wishlisted._id })
            await userModel.updateOne({ _id: userId }, { $pull: { wishlist: productId } })
            return res.status(200).json({ message: "Product removed from wishlist", success: true });
        }
    } catch (error) {
        console.log("Add to wishlist", error)
        res.status(500).json({ message: "surver error", error: error.message })
    }
}

exports.getUserWishlist = async (req, res) => {
    try {
        const userId = req.user.id

        const wishlistedItems = await wishlistModel.find({ userId: userId }).populate("product").populate({ path: "userId", select: "name" })

        if (!wishlistedItems || wishlistedItems.length === 0) {
            return res.status(200).json({ message: "Your wishlist is empty" });
        }

        return res.status(200).json({
            message: "Your wishlisted items",
            wishlistedItems: wishlistedItems
        });
    } catch (error) {
        console.log("Add to wishlist", error)
        res.status(500).json({ message: "surver error", error: error.message })
    }
}

exports.addAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { street, city, state, zip, country } = req.body;


        if (!street || !city || !state || !zip || !country) {
            return res.status(400).json({ message: "Please add all address fields.", success: false });
        }


        const newAddress = new addressModel({
            userId,
            street,
            city,
            state,
            zip,
            country
        });


        const savedAddress = await newAddress.save();


        await userModel.findByIdAndUpdate(
            userId,
            { $push: { address: savedAddress._id } },
            { new: true }
        );

        return res.status(201).json({
            message: "Address added successfully.",
            address: savedAddress,
            success: true
        });

    } catch (error) {
        console.error("Error adding address:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getUserAddresses = async (req, res) => {
    try {
        const userId = req.user.id;

        const addresses = await addressModel.find({ userId });

        if (!addresses || addresses.length === 0) {
            return res.status(200).json({ message: "No addresses found for this user", addresses: [], success: false });
        }

        return res.status(200).json({
            message: "User addresses fetched successfully",
            addresses: addresses
        });

    } catch (error) {
        console.error("Get addresses error:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getUserAddressesById = async (req, res) => {
    try {
        const addressId = req.params.id

        if (!addressId) {
            return res.status(400).json({ message: "addresses not found", success: false });
        }

        const address = await addressModel.findOne({ _id: addressId })

        if (!address) {
            return res.status(400).json({ message: "Address not found!", success: false })
        }

        return res.status(200).json({ success: true, address: address })

    } catch (error) {
        console.error("Get addresses by id error:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.editAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const addressId = req.params.id;
        const { street, city, state, zip, country } = req.body;


        const address = await addressModel.findById(addressId);

        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        if (address.userId.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized to edit this address" });
        }


        if (street) address.street = street;
        if (city) address.city = city;
        if (state) address.state = state;
        if (zip) address.zip = zip;
        if (country) address.country = country;

        const updatedAddress = await address.save();

        return res.status(200).json({
            message: "Address updated successfully",
            address: updatedAddress
        });

    } catch (error) {
        console.error("Edit address error:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.deleteAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const addressId = req.params.id;

        const address = await addressModel.findById(addressId);

        if (!address) {
            return res.status(404).json({ message: "Address not found", success: false });
        }

        if (address.userId.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized to delete this address", success: false });
        }

        await addressModel.findByIdAndDelete(addressId);

        await userModel.findByIdAndUpdate(userId, {
            $pull: { address: addressId }
        });

        return res.status(200).json({ message: "Address deleted successfully", success: true });
    } catch (error) {

    }
}

exports.placeOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const addressId = req.params.id;
        const { paymentMethod } = req.body


        if (!addressId) {
            return res.status(400).json({ message: "Address is required to place an order." });
        }

        if (!paymentMethod || typeof paymentMethod !== 'string') {
            return res.status(400).json({ message: "Invalid or missing payment method" });
        }

        const user = await userModel.findById(userId).populate("cart", "name price image");

        if (!user || !user.cart || user.cart.length === 0) {
            return res.status(400).json({ message: "Your cart is empty.", success: false });
        }

        const address = await addressModel.findById(addressId);
        if (!address || address.userId.toString() !== userId) {
            return res.status(404).json({ message: "Address not found or unauthorized." });
        }

        let totalPrice = 0;
        const orderedProducts = [];

        const cartItems = await cartModel.find({ userId });

        for (let product of user.cart) {
            const cartItem = cartItems.find(item => item.product.toString() === product._id.toString());
            const quantity = cartItem ? Number(cartItem.quantity) : 1;
            const price = Number(product.price);

            if (isNaN(price) || isNaN(quantity)) {
                return res.status(400).json({ message: "Invalid product price or quantity.", success: false });
            }

            const safeQuantity = quantity > 0 ? quantity : 1;

            totalPrice += price * safeQuantity;
            orderedProducts.push({
                product: {
                    _id: product._id,
                    paymentMethod: paymentMethod,
                    name: product.name,
                    image: Array.isArray(product.image) ? product.image[0] : product.image,
                    price: product.price
                },
                quantity: safeQuantity
            });

        }

        const newOrder = new orderModel({
            userId,
            products: orderedProducts,
            paymentMethod: paymentMethod,
            address: {
                street: address.street,
                city: address.city,
                state: address.state,
                zip: address.zip,
                country: address.country
            },
            totalPrice
        });

        await newOrder.save();

        user.cart = [];
        await user.save();
        await cartModel.deleteMany({ userId });

        return res.status(201).json({
            message: "Order placed successfully",
            order: newOrder
        });

    } catch (error) {
        console.error("Place order error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        let orders;

        if (user.type === "admin") {
            orders = await orderModel.find().populate("userId", "name email")
            if (!orders || orders.length === 0) {
                return res.status(400).json({ message: "No orders found" });
            }

            return res.status(200).json({ success: true, orders });
        } else {
            orders = await orderModel.find({ userId })
            if (!orders || orders.length === 0) {
                return res.status(400).json({ message: "No orders found" });
            }

            return res.status(200).json({ success: true, orders });
        }
    } catch (error) {
        console.error("Order error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.editOrder = async (req, res) => {
    try {
        const userId = req.user.id
        const { status } = req.body
        const orderId = req.params.id

        const user = await userModel.findById(userId)

        if (!user) return res.status(400).json({ message: "user not found!" })

        if (user.type === "admin") {
            const order = orderModel.findById({ _id: orderId })

            if (!order) {
                return res.status(400).json({ message: "order not found!", success: false })
            }

            const updateFields = {}

            if (status) updateFields.status = status

            const updatedOrder = await orderModel.findByIdAndUpdate({ _id: orderId }, updateFields, {
                new: true
            })

            return res.status(200).json({ success: true, updatedOrder: updatedOrder, message: "order updated succesfully" })
        } else {
            return res.status(200).json({ success: false, message: "you can't edit a order" })
        }
    } catch (error) {
        console.error("update order error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.addReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { comment, rating } = req.body;
        const productId = req.params.id;

        if (!comment || rating === undefined || rating === null) {
            return res.status(400).json({ message: "Comment and rating are required." });
        }

        const product = await productModel.findById({ _id: productId })

        if (!product) {
            return res.status(404).json({ message: "Product not found!" });
        }

        const user = await userModel.findById(userId);

        const numericRating = Number(rating);
        if (isNaN(numericRating)) {
            return res.status(400).json({ message: "Rating must be a number." });
        }

        const newReview = {
            user: userId,
            name: user.name,
            comment,
            rating: numericRating,
            createdAt: new Date(),
        };

        const validRatings = product.reviews
            .map((r) => Number(r.rating))
            .filter((r) => !isNaN(r));

        product.averageRating = validRatings.length > 0
            ? validRatings.reduce((acc, curr) => acc + curr, 0) / validRatings.length
            : 0;

        await product.save();

        const reviewDoc = new reviewModel({
            user: userId,
            name: user.name,
            product: productId,
            comment,
            rating: numericRating,
        });

        await reviewDoc.save();

        res.status(201).json({ message: "Review added successfully", review: newReview });
    } catch (error) {
        console.error("Add review error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.removeReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const reviewId = req.params.id;

        const review = await reviewModel.findById(reviewId)
        if (!review) {
            return res.status(404).json({ message: "Review not found!" });
        }

        if (review.user.toString() !== userId) {
            return res.status(401).json({ message: "It's not your review", success: false });
        }

        
        await reviewModel.findByIdAndDelete(reviewId);

        return res.status(200).json({ message: "Review deleted", success: true });
    } catch (error) {
        console.error("Delete review error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getReviewByProductId = async (req, res) => {
    try {
        const productId = req.params.id
        const reviews = await reviewModel.find({ product: productId }).populate("user")
        if (!reviews) {
            return res.state(500).json({ message: "no review found for this product", success: false })
        }
        return res.status(200).json({ reviews: reviews, success: true })
    } catch (error) {
        console.error("get review error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
