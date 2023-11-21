const bcrypt = require('bcrypt');
const User = require('../models/modelUser');
const { ObjectId } = require('mongodb');
const Category = require('../models/modelCategory');
const { getDb } = require('../config/dbConnection');
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');
const { sendEmail } = require('../config/emailConfig');
const { Db } = require('mongodb');
const twilio = require('twilio');
const Brand = require('../models/modelBrands');
const Product = require('../models/modelProduct');

// password hashing
const securePassword = async (password) => {
  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
    throw error;
  }
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// mobile otp generator twilio

async function sendSMS(mobile,otp) {
  console.log(mobile);
  console.log(otp);
  const client = new twilio(process.env.TWILIO_STD, process.env.TWILIO_AUTH_TOKEN);
  try {
    const message = await client.messages.create({
      body: `your otp is ${otp} `,
      from: '+12565008076',
      to: `+91${mobile}`,
    });
    console.log("Message is sent");
  } catch (err) {
    console.error("Message is not sent", err);
  }
}

const loadHome = async (req, res, next) => {
  try {
    console.log(req.session.user);
    if(!req.session.user){
      res.render('Home');
    }else{
      res.render('login-home',{userData:req.session.user});
    }
  } catch (error) {
    console.error('error occurred', error);
  }
}

const loginHome = async (req,res) => {
  try {
    console.log('req.session.user: ',req.session.user);
    if(req.session.user){
      res.render('Home',{userData:req.session.user})
    }else{
      res.render('Home')
    }
  } catch (error) {
    console.log(error.message);
    
  }
}
 
const loadRegister = async (req, res) => {
  try {
    res.render('registration');
  } catch (error) {
    console.error('error occurred', error);
  }
}

const insertUser = async (req, res) => {
  try {
    let { name, email, password, mobile } = req.body;
    const db = getDb();
    const collection = db.collection('users');
    const emailExists = await collection.findOne({ email });
    const mobileExists = await collection.findOne({ mobile });
    if(emailExists || mobileExists){
     res.render('registration',{message:"email or mobile exists"}) 
    }
    const otp = generateOTP();
    const timestamp = new Date().getTime();
    sendEmail(email, 'Email Verification OTP', `Your OTP is: ${otp}`); 
    password = await securePassword(password); 
    req.session.userData =  {name, email, password, mobile, otp,timestamp};
    setTimeout(async () => {
      await req.session.userData.otp == null;
    },60000);     
   console.log("sectiondata",req.session.userData);
   const userData = req.session.userData;
      if(userData){
      res.redirect(`/verify-otp`);
      }else{
        res.render('registration',{message : " registertaion field"});
      }
    
  } catch (error) {
    console.error(error);
  }
};

const loadOTP = async (req, res) => {
  try {
        const user = req.session.userData
        const timestamp = user.timestamp 
        console.log("",timestamp);
        res.render('verify-otp',{timestamp: timestamp});
      } catch (error) {
        console.error(error);
      }
    };   

    const verifyOTP = async (req, res) => {
      try {
        const {otp}=req.body;
        console.log(otp);
        const db = getDb();
        const collection = await db.collection('users');
        const user = req.session.userData;
        const currentTimestamp = new Date().getTime();
        const timeDifference = currentTimestamp - user.timestamp;
     if (user && user.otp === otp && timeDifference <= 60000) {
          console.log("5");
          console.log("registration successful");
          const {name,email,mobile,password,}=req.session.userData;
          let user = new User(name,email,mobile,password)
          const result = user.save();
         
          res.render('user-login', { message: 'Registration Complete' });
        } else {
          
          res.render('verify-otp', { message: 'Invalid OTP or OTP has expired' }); 
        }
      } catch (error) {
        console.error(error);
      }
    }
    

const resendOTP = async (req, res) => {
  try {
    console.log("resend enterd ");
    const user = req.session.userData;
    if (user && user.otp == null) {
    }
      const otp = generateOTP();
      req.session.userData.otp = otp;
      req.session.userData.timestamp = new Date().getTime();
      const email  = user.email;
      if(email){
      sendEmail(email, 'Email Verification OTP (Resent)', `Your OTP is: ${otp}. This OTP is valid for 1 minute.`);
       setTimeout(()=>{
         req.session.userData.otp = null;
         console.log("otp null")
       },60000) 
       
      return res.render('verify-otp', { message: 'OTP has been resent',email });
      }else{
        res.render('registration',{message : "please try one more"});
      }
  } catch (error) {
    console.error(error);
  }
};

 // user login

const userlogin = async (req,res) => {
   try {
    res.render('user-login');
   } catch (error) {
     console.log(error.message);
   }
}

const loginSection = async (req,res) => {
  try {
    const {email,password} = req.body;
    console.log(email);
    console.log(password);
    const db = getDb();
    const collection = db.collection('users');
    const findUser = await collection.findOne({ email });
  
    if(!findUser){
      return res.render('user-login',{message : "user not found"});
    }
    const isPassword = await bcrypt.compare(password,findUser.password);
    if(!isPassword){
      return res.render('user-login',{message : "Password incorrect"})
    }if(findUser.isBlocked){
      return res.render('user-login',{message:"user is blocked"});
      
    }else{
      req.session.user = findUser.email
      res.redirect('/home');
    }
 
  } catch (error) {
    console.log(error.message); 
  }
} 

const userLogout= async(req,res)=>{
  try {
      req.session.destroy();
      res.render('user-login'); 
  } catch (error) {
      console.log(error.message); 
  }
}

const forgetPass = async (req,res) => {
  try {
    res.render('forget-pass')
  } catch (error) {
    console.log(error.message);
  }
}

const forgetOtp = async (req,res) => {
  try {   
    const {mobile} = req.body;
    const {email} = req.body;
    console.log(mobile);
    console.log(email);
    const db = getDb();
    let value = email?email:mobile;
    const collection = db.collection('users');
    const findMobile = await collection.findOne({ mobile });
    const findEMail = await collection.findOne({ email });
    console.log(findEMail);
    console.log(findMobile);

    if(findMobile){
      const otp = generateOTP();
      const timestamp = new Date().getTime();
      req.session.sms = {mobile,otp,timestamp};
      console.log("checking section mobile",req.session.sms.mobile);
      console.log(otp);
      sendSMS(mobile,otp);
      res.render('forget-otp');

    }else if(findEMail){
      const otp = generateOTP();
      const timestamp = new Date().getTime();
      sendEmail(email, 'Email Verification OTP (Resent)', `Your OTP is: ${otp}. This OTP is valid for 1 minute.`);
      req.session.email = {email,otp,timestamp};
      res.render('forget-otp');

    }

  } catch (error) {
    console.log(error.message);
  }
}

const forgetOTPvarify = async(req,res)=>{
  try {
      
      const otp = req.body.otp;
      let message = "";

      if(req.session.sms){
      const mobileOTP = req.session.sms.otp;
      const timestamp = req.session.sms.timestamp;
      const currentTimestamp = new Date().getTime();
      const timeDifference = currentTimestamp - timestamp;
      if(otp == mobileOTP && timeDifference <= 60000){
        console.log("otp verified")
        res.render('forget-verification');
      }else{
        res.render('forget-otp',{ message:"otp expired or otp not match"});
      }
    }else if(req.session.email){
      const emailOtp = req.session.email.otp;
      const timestamp = req.session.email.timestamp;
      console.log("email otp",emailOtp);
      const currentTimestamp =new Date().getTime();
      const timeDifference = currentTimestamp-timestamp;
      if(otp == emailOtp && timeDifference <= 60000){
        console.log('otp verified')
        res.render('forget-verification')
      }else{
        res.render('forget-otp',{ message:"otp expired or otp not match"});
      }
    }
      
  } catch (error) {
    console.log(error.message);
  }
}



const forgetResend = async (req, res) => {
  try {
    res.render('forget-otp');
    console.log('resend entered');
    const mobile = req.session.sms ? req.session.sms.mobile : null;
    const email = req.session.email ? req.session.email.email : null;

    console.log(mobile);
    if (mobile) {
      const otp = generateOTP();
      const timestamp = new Date().getTime();
      req.session.sms.otp = otp; 
      req.session.sms.timestamp = timestamp; 
      req.session.save();
      sendSMS(mobile, otp);
      console.log('resend otp =', otp);
    }else if(email){
      const otp = generateOTP();
      const timestamp = new Date().getTime();
      req.session.email.otp = otp; 
      req.session.email.timestamp = timestamp; 
      req.session.save();
      sendEmail(email, 'Email Verification OTP (Resent)', `Your OTP is: ${otp}. This OTP is valid for 1 minute.`);
     
    }
  } catch (error) {
    console.log(error.message);
  }
}

const resetPasswordVerify = async (req, res) => {
  try {
    let password = req.body.password;
    password = await bcrypt.hash(password, 10);

    const mobile = req.session.sms ? req.session.sms.mobile : null;
    const email = req.session.email ? req.session.email.email : null;

    console.log("resetpassword", password);
    
    console.log("here user", mobile);

    if (mobile) {
      const db = getDb();
      const collection = db.collection('users'); 
      const Data = await collection.findOne({mobile});
      const result = await collection.updateOne({ mobile }, { $set: { password } });

      if (result.modifiedCount === 1) {
        res.render('user-login', { message: "Password reset successfully" });
        console.log("updated")
      } else {
        res.render('user-login', { message: "Password reset failed" });
        console.log("not updated");
      }
    } else if(email) {
      const db = getDb();
      const collection = db.collection('users'); 
      const Data = await collection.findOne({email});
      const result = await collection.updateOne({ email }, { $set: { password } });

      if (result.modifiedCount === 1) {
        res.render('user-login', { message: "Password reset successfully" });
        console.log("updated")
      } else {
        res.render('user-login', { message: "Password reset failed" });
        console.log("not updated");
      }
       
    }
  } catch (error) {
    console.log(error.message);
  }
}

// shop page 

const  shopPageLoad = async (req,res) =>{
  try {
    const categories = await Category.getAllCategories();
    const brands = await Brand.getAllbrands();
    console.log('brands',brands);
    res.render('shop',{ categories,brands })
    
  } catch (error) {
    console.log(error.message);
  }
}

const  ClothesPageLoad = async (req,res) =>{
  try {
    const categories = await Category.getAllCategories();
    const brands = await Brand.getAllbrands();
    const products = await Product.getAllproducts();
    console.log('brands',brands);
    res.render('clothes',{ categories,brands,products });
    
  } catch (error) {
    console.log(error.message);
  }
}

const shoesPageLoad = async (req,res) =>{
  try {
    const categories = await Category.getAllCategories();
    const brands = await Brand.getAllbrands();
    const products = await Product.getAllproducts();
    console.log('brands',brands);
    res.render('shoes',{ categories,brands,products });
  } catch (error) {
    
  }
}

 


module.exports = {
  loadRegister,
  loadHome,
  insertUser,
  loadOTP,
  verifyOTP,
  resendOTP,
  userlogin,
  loginSection,
  loginHome,
  userLogout,
  forgetPass,
  forgetOtp,
  forgetOTPvarify,
  resetPasswordVerify,
  forgetResend,
  shopPageLoad,
  ClothesPageLoad,
  shoesPageLoad


};
