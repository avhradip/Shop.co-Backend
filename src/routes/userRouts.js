const express = require("express")
const router = express.Router()
const { signUp, login, editProfile, addToCart, removeCartItem, addorremovefromWishlist, editCart, getUserCartItems, getUserWishlist, addAddress, editAddress, deleteAddress, getUserAddresses, getUserAddressesById, placeOrder, getAllOrders, editOrder, getUser, addReview, removeReview, forgotPassword, updatePassword, resetPassword, googlelogin, getReviewByProductId } = require("../controllers/userController")
const upload = require("../middlewares/multer")
const authenticateToken = require('../middlewares/auth')


router.post('/signup', signUp)
router.post('/login', login)
router.post('/googlelogin', googlelogin)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", authenticateToken, resetPassword);
router.get('/user', authenticateToken, getUser)
router.patch('/profile/edit', authenticateToken, upload.single('profilePicture'), editProfile)
router.post('/:id/addtocart', authenticateToken, addToCart)
router.patch('/:id/editcart', authenticateToken, editCart)
router.delete('/:id/removefromcart', authenticateToken, removeCartItem)
router.get('/allcartitems', authenticateToken, getUserCartItems)
router.post('/:id/addorremovefromwishlist', authenticateToken, addorremovefromWishlist)
router.get('/allwishlistitems', authenticateToken, getUserWishlist)
router.post('/addaddress', authenticateToken, addAddress)
router.patch('/:id/editaddress', authenticateToken, editAddress)
router.delete('/:id/deleteaddress', authenticateToken, deleteAddress)
router.get('/getaddress', authenticateToken, getUserAddresses)
router.get('/:id/getaddressbyid', authenticateToken, getUserAddressesById)
router.post('/:id/placeorder', authenticateToken, placeOrder)
router.get('/orderlist', authenticateToken, getAllOrders)
router.patch('/:id/editorder', authenticateToken, editOrder)
router.post('/:id/addreview', authenticateToken, addReview);
router.delete('/:id/deletereview', authenticateToken, removeReview)
router.delete('/:id/getreviewbyproductId', authenticateToken, getReviewByProductId)

module.exports = router