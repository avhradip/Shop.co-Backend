const getDataUri = require("../config/datauri")
const cloudinary = require('../config/cloudinary');
const userModel = require("../models/userModel");
const productModel = require("../models/productModel");
const reviewModel = require('../models/reviewModel');

exports.addProduct = async (req, res) => {
    try {
        const { title, description, price, category, stock, subCategory, material, color, brand, size } = req.body;
        const userId = req.user.id
        const image1 = req.files.image1 && req.files.image1[0]
        const image2 = req.files.image2 && req.files.image2[0]
        const image3 = req.files.image3 && req.files.image3[0]
        const image4 = req.files.image4 && req.files.image4[0]

        const images = [image1, image2, image3, image4].filter(item => item !== undefined)
        const user = await userModel.findById(userId)

        if (!user) {
            return res.status(401).json({ message: "Unauthorized to add a product" })
        }
        if (user.type !== "admin") {
            return res.status(401).json({ message: "only admins can add product" })
        }


        const dataUrls = await Promise.all(
            images?.map(async (item) => {
                const filePath = getDataUri(item)
                return filePath
            })
        )


        let imagesUrl = await Promise.all(
            dataUrls?.map(async (item) => {
                let result = await cloudinary.uploader.upload(item)
                return result.secure_url
            })
        )

        const parsedSize = typeof size === 'string' ? size.split(',') : size;
        const parsedColor = typeof color === 'string' ? color.split(',') : color;



        const newProduct = new productModel({
            title,
            description,
            price,
            category,
            subCategory,
            stock,
            brand,
            material,
            size: parsedSize || [],
            color: parsedColor || [],
            image: imagesUrl,
            adminId: req.user.id
        });

        await newProduct.save()

        return res.status(201).json({
            message: "Product added successfully",
            product: newProduct,
            success: true
        });
    } catch (error) {
        console.error("Add Product Error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
}

exports.getAllProduct = async (req, res) => {
    try {
        const products = await productModel.find()

        if (!products) {
            return res.status(400).json({ message: "no product found" })
        }

        res.status(200).json({ message: "All products", success: true, products: products })

    } catch (error) {
        console.error("Get all Product Error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
}

exports.getAllProductByAdmin = async (req, res) => {
    try {
        const userId = req.user.id

        const user = await userModel.findById(userId)

        if (user.type === "admin") {
            const products = await productModel.find({ adminId: userId })
            if (!products) {
                return res.status(400).json({ message: "no product found for this admin" })
            }
            return res.status(200).json({ success: true, product: products })
        } else {
            return res.status(200).json({ message: "you are not admin", success: false })
        }
    } catch (error) {
        console.error("Get all Product by admin id Error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
}

exports.removeProduct = async (req, res) => {
    try {
        const productId = req.params.id
        const userId = req.user.id

        const product = await productModel.findById(productId)

        if (!product) return res.status(400).json({ message: "product not found!", success: false })
        if (userId !== product.adminId.toString()) return res.status(400).json({ message: "only product owner can remove product", success: false })

        await productModel.findByIdAndDelete(productId)

        return res.status(200).json({ message: "Product removed successfully", success: true })
    } catch (error) {
        console.error("Remove Product Error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
}

exports.editProduct = async (req, res) => {
    try {
        const { title, description, price, category, stock, subCategory, material, color, brand, size } = req.body
        const productId = req.params.id
        const userId = req.user.id

        const product = await productModel.findById(productId)

        if (!product) {
            return res.status(404).json({ message: "Product not found!", success: false });
        }

        if (product.adminId.toString() !== userId) return res.status(403).json({ message: "Only the product owner can edit the product", success: false });

        const parsedSize = typeof size === 'string' ? size.split(',') : size;
        const parsedColor = typeof color === 'string' ? color.split(',') : color;

        const updateParts = {}
        if (title) updateParts.title = title
        if (description) updateParts.description = description
        if (price) updateParts.price = price
        if (category) updateParts.category = category
        if (stock) updateParts.stock = stock
        if (subCategory) updateParts.subCategory = subCategory
        if (material) updateParts.material = material
        if (parsedColor) updateParts.color = parsedColor
        if (brand) updateParts.brand = brand
        if (parsedSize) updateParts.size = parsedSize

        const updatedProduct = await productModel.findByIdAndUpdate({ _id: productId }, updateParts, { new: true })

        return res.status(200).json({ message: "product updated successfully", success: false, updatedProduct: updatedProduct })

    } catch (error) {
        console.error("Place Order Error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
}

exports.getProductById = async (req, res) => {
    try {
        const productId = req.params.id;

        if (!productId) {
            return res.status(400).json({ message: "Product ID is required", success: false });
        }

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found", success: false });
        }

        // Fetch related reviews
        const reviews = await reviewModel.find({ product: productId });

        if (!reviews) {
            return res.status(400).json({message:"review not found"})
        }

        // Calculate average rating
        const ratings = reviews.map(r => Number(r.rating)).filter(r => !isNaN(r));
        const averageRating = ratings.length
            ? ratings.reduce((acc, val) => acc + val, 0) / ratings.length
            : 0;

        return res.status(200).json({
            success: true,
            product,
            averageRating,
            reviewCount: reviews.length,
            reviews, // Optional: include if needed
        });

    } catch (error) {
        console.error("Get product by ID error:", error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

exports.getAllCatagoris = async (req, res) => {
    try {
        const catagoris = await productModel.distinct("category")
        if (!catagoris) {
            return res.status(400).json({ success: false, message: "no catagori abalabel!" })
        }

        return res.status(200).json({ success: true, catagoris: catagoris })
    } catch (error) {
        console.error("Get categories error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.getProductsByCategory = async (req, res) => {
    try {
        const { catagori } = req.params;

        if (!catagori) {
            return res.status(400).json({ success: false, message: "Category is required." });
        }

        const products = await productModel.find({
            category: catagori.trim()
        });

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: "No products found for this category." });
        }

        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};





  