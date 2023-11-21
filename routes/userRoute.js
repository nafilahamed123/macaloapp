const express = require('express');
const userRoute = express();
const bodyParser = require('body-parser');


userRoute.set('view engine','ejs');
userRoute.set('views','./views/users');
const authMiddleware = require('../middleware/userAuth');

userRoute.use(bodyParser.json());
userRoute.use(bodyParser.urlencoded({extended:true}));


const userController = require('../controller/userController');
// landing page.
userRoute.get('/',userController.loadHome);
// user home page.
userRoute.get('/home',authMiddleware.isLogin,userController.loginHome);
// registertaion sections
userRoute.get('/register',userController.loadRegister);
userRoute.post('/register',userController.insertUser);
userRoute.get('/verify-otp', userController.loadOTP);
userRoute.post('/verify-otp',userController.verifyOTP);
userRoute.get('/resend-otp', userController.resendOTP);

//login sections
userRoute.get('/login',userController.userlogin);
userRoute.post('/login',userController.loginSection);
userRoute.post('/logout',userController.userLogout);
userRoute.get('/forgetPass',userController.forgetPass)
userRoute.post('/forgetPass',userController.forgetOtp);
userRoute.get('/forgetRsendOtp',userController.forgetResend);
userRoute.post('/forgetOtpVerify',userController.forgetOTPvarify);
userRoute.post('/resetpassword',userController.resetPasswordVerify);

// shpo page 

userRoute.get('/shopPage',userController.shopPageLoad);

userRoute.get('/Clothes',userController.ClothesPageLoad);

userRoute.get('/shoes',userController.shoesPageLoad);







module.exports = userRoute;
