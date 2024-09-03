const express=require('express')
const { getvendor, createvendor, getvendorMap, getSingleVendorDetails, getVendorListByCity, createfeaturedvendor, updateVendor, getFeaturedVendors, removeFeaturedVendor,getFeaturedVendorByCityName ,getvendorExplore} = require('../controller/vendorController');
const { signup, login, getuser, verifyOTP, getSingleuser, logout, sendResetPasswordOTP, verifyResetPasswordOTP, resetPassword, updateUser } = require('../controller/user');
const verifyAdmin = require('../middleware/auth');
const { addFavoriteVendor, removeFavoriteVendor, getFavoriteVendors } = require('../controller/Favorite');
const { createFoodItem, getFoodItemsByVendor, getVendorsByPriceRange, getVendorsByPriceRangeAndLocation, updateFoodItem, deleteFoodItem } = require('../controller/foodItemController');
const { safety, getSafety } = require('../controller/adminController');

//router object
const router = express.Router();

//GET ALL VENDOR LIST || GET

//*****-----ADMIN------*****////
router.post("/createvendor",createvendor)
router.post('/createfeaturedvendor',createfeaturedvendor)
router.get('/vendormap',getvendorMap)
router.post('/postsafety',safety)
router.get('/getsafety',getSafety)

////********--------FOOD ITEMS ROUTES////
router.post('/addfooditems',createFoodItem)
router.get('/getfooditmes',getFoodItemsByVendor)
router.put('/updatefooditem',updateFoodItem)
router.delete('/deletefooditem',deleteFoodItem)


///*****------OTPLESS-----******/////
router.post('/otpverification',verifyOTP)
router.post('/sendotpresetpassword',sendResetPasswordOTP)
router.post('/verifyresentpasswordotp',verifyResetPasswordOTP)
router.post('/resetpassword',resetPassword)


///*******USER */
router.post("/signup",signup)
router.post('/login',login)
router.get('/user',getuser)
router.post('/addfavorite', addFavoriteVendor);
router.delete('/removefavorite', removeFavoriteVendor);
router.get('/getfavorites/:userId', getFavoriteVendors);
router.get('/singleuser',getSingleuser)
router.post('/removefeaturedvendor',removeFeaturedVendor)
router.put('/updateuser',updateUser)
router.get('/getexplorevendors',getvendorExplore)





////---------*****VENDOR****-----------/////
router.get("/vendorlist",getvendor)
router.get('/singlevendor',getSingleVendorDetails)
router.get('/vendorbycity',getFeaturedVendorByCityName)
router.put('/updatevenor',updateVendor)
router.get('/getvendorbyprice',getVendorsByPriceRangeAndLocation)
router.get('/getfeaturedvendor',getFeaturedVendors)

module.exports = router ;
