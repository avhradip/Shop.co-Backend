const express = require("express")
const authenticateToken = require("../middlewares/auth")
const upload = require("../middlewares/multer")
const { addProduct, getAllProduct, removeProduct, editProduct, getProductById, getAllProductByAdmin, getAllCatagoris, getProductByCatagori, getProductsByCategory } = require("../controllers/productController")
const router = express.Router()

// router.post('/add/product', authenticateToken, upload.single('image'),addProduct)
router.post('/add/product', authenticateToken, upload.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image3', maxCount: 1 }, { name: 'image4', maxCount: 1 }]), addProduct)
router.get('/products/all', getAllProduct)
router.get('/productsbyadmin/all', authenticateToken, getAllProductByAdmin)
router.delete('/:id/remove/products', authenticateToken, removeProduct)
router.patch('/:id/edit/products', authenticateToken, editProduct)
router.get('/:id/productdetatls', getProductById)
router.get('/getallcatagiris', getAllCatagoris)
router.get('/getproductbycatagori/:catagori', getProductsByCategory)

module.exports = router