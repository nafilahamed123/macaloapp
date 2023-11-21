const express = require('express');
const adminRoute = express()
const multer = require('multer');

const bodyParser = require('body-parser');

adminRoute.set('view engine', 'ejs');
adminRoute.set('views', './views/admin');

adminRoute.use(bodyParser.json());
adminRoute.use(bodyParser.urlencoded({ extended: true }));

const adminController = require('../controller/adminController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/assets/img'); 
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname); 
    },
  });

  const upload= multer({storage:storage})

adminRoute.get('/', adminController.adminHome);
adminRoute.get('/adminlogin',adminController.login);
adminRoute.post('/adminlogin',adminController.loginVerifiy)
adminRoute.get('/customers',adminController.customerList);
adminRoute.post('/blockUser/:userId', adminController.blockUser);



adminRoute.get('/Categoryadd',adminController.CategoryPage);
adminRoute.post('/Categoryadd',adminController.addCategory);
adminRoute.get('/list-Categorys',adminController.showCategoryList)
adminRoute.get('/editCategory/:id',adminController.showEditCategory);
adminRoute.post('/editCategory/:id',adminController.editCategory);
adminRoute.get('/deleteCategory/:id',adminController.deleteCategorys);


//brands


adminRoute.get('/addBrands',adminController.brandPage);
adminRoute.post('/addBrands',adminController.addBrand);
adminRoute.get('/list-brand',adminController.showBrandList);
adminRoute.get('/editBrand/:id',adminController.showEditBrand);
adminRoute.post('/editBrand/:id',adminController.editBrands);
adminRoute.get('/delete-brand/:id',adminController.deleteBrand);

// products
adminRoute.get('/add-Products',adminController.productPage);
adminRoute.post('/add-products',upload.array('image'),adminController.addProducts);
adminRoute.get('/get-subcategories/:categoryId',adminController.fecthSubCategory);
adminRoute.get('/list-Products',adminController.listProducts);
adminRoute.get('/edit-produt/:id',adminController. listProductsEditPage);
adminRoute.post('/edit-produt/:id',upload.array('image'),adminController.editProduct);
adminRoute.get('/delete-product/:id',adminController.deleteProduct);

module.exports = adminRoute;
