const express = require('express');
const userRoute = express();

/* GET users listing. */

userRoute.set('view engine','ejs');
userRoute.set('views','./views/users');


userRoute.get('/', function(req, res, next) {
  try {
    console.log('hai');
    res.render('Home');
  } catch (error) {
    console.error('error occuured',error);
  }
});

module.exports = userRoute;
