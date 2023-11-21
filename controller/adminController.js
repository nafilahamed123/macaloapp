const bcrypt = require('bcrypt');
const dotenv = require('dotenv').config(); 
const { ObjectId } = require('mongodb');
const { getDb } = require('../config/dbConnection');
const Category = require('../models/modelCategory');
const Brand = require('../models/modelBrands');
const { consumers } = require('nodemailer/lib/xoauth2');
const Product = require('../models/modelProduct');
const { json } = require('express');





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

const adminHome = async (req, res) => {
    try {
        res.render('home');
    } catch (error) {
        console.log(error.message); 
    }
}

const login = async (req,res) =>{
    try {
        res.render('admin-login');
    } catch (error) {
        console.log(error.message);
        
    }
}

const loginVerifiy = async (req,res) =>{
    try {

        const username = req.body.username;
        const password = req.body.password;
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if(username == adminUsername && password == adminPassword){
            res.render('home',{message:"login sucsessfuly"});
        }else{
           res.render('admin-login',{message:"your password or username incorrect"});
        }
        
    } catch (error) {
        
    }
}

const customerList = async (req, res) => {
  try {
      const db = getDb();
      const collection = db.collection('users');
      const data = await collection.find().toArray();
      console.log('customers page entering')
      res.render('customers', { data }); 
  } catch (error) {
      console.log(error.message);
  }
}



const blockUser = async (req, res) => {
    try {
        const userId = req.params.userId; 
        console.log("user id ",userId);
        const db = getDb();
        const collection = db.collection('users');
        const ObjectIdUserId = new ObjectId(userId);
        console.log('user _id ',ObjectIdUserId);
        const user = await collection.findOne( {_id:ObjectIdUserId} );
        if (!user) {
            return res.status(404).send('User not found');
        }

        const newStatus = !user.isBlocked;

      
        await collection.updateOne(
            { _id: ObjectIdUserId },
            { $set: { isBlocked: newStatus } }
        );

        res.redirect('/admin/customers');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Error blocking/unblocking user');
    }
}

// category adding
const CategoryPage = async (req,res) =>{
  try {
    res.render('category-add');
  } catch (error) {
    console.log(error.message);
    
  }
}

const addCategory = async (req, res) => {
  try {
    const categoryName = req.body.categoryName;
    const subcategoryNames = req.body.subcategoryNames.split(',').map(s => s.trim());
    const db = getDb();
    const collection = db.collection('categories'); 
    const newCategory = new Category(categoryName, subcategoryNames);
    const result = await collection.insertOne(newCategory);

    res.redirect('/admin/Categoryadd'); 
  } catch (error) {
    console.error(error.message);
  }
};

const showCategoryList = async (req, res) => {
  try {
    const categories = await Category.getAllCategories();
    res.render('listCategory', { categories });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error fetching categories');
  }
};

// edit category 


const showEditCategory = async (req, res) => {
  try {
    const categoryId = req.params.id; 
    const category = await Category.getCategoryById(categoryId);
    res.render('editCategory', { category: category });
  } catch (err) {
    console.error(err);
  }
};


const editCategory = async (req, res) => {
  try {
    const categoryId = req.params.id; 
  
    const { categoryName, subcategoryNames } = req.body;
    await Category.updateCategory(categoryId, categoryName, subcategoryNames);
    res.redirect('/admin/list-Categorys'); 
  } catch (error) {
    console.error(error.message);
  }
};

const deleteCategorys = async (req, res) => {
  try {
    const categoryId = req.params.id;
    console.log("categoryID", categoryId);
    await Category.deleteCategory(categoryId);
    res.redirect('/admin/list-Categorys');
  } catch (error) {
    console.log(error.message);
  }
};

// brands

const brandPage = async (req,res) =>{
  try {
  const categories = await Category.getAllCategories();
    res.render('addBrands',{categories});
  } catch (error) {
    console.log(error.message);
    
  }
}

const addBrand = async (req, res) => {
  try {
    const brandName = req.body.brandName;
    
  
    const db = getDb();
    const collection = db.collection('Brands'); 
    const newCategory = new Brand(brandName);
    const result = await collection.insertOne(newCategory);

    res.redirect('/admin/addBrands'); 
  } catch (error) {
    console.error(error.message);
  }
};

const showBrandList = async (req, res) => {
  try {
    const brands = await Brand.getAllbrands();
    res.render('listBrand', { brands });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error fetching categories');
  }
};

const showEditBrand = async (req,res) =>{
  try {
    const brandID = req.params.id;
    console.log("brand id",brandID);
    const brand = await Brand.getBrandID(brandID);
    console.log("brand",brand);
    res.render('editbrand',{brand});
  } catch (error) {
    console.log(error.message);
    
  }
}

const editBrands = async (req,res) =>{
  try {
   const brandId = req.params.id;
    const {BrandName}=req.body;
    console.log("brand name",BrandName)
    console.log("categoryName");
    await Brand.updateBrand(brandId,BrandName);
    res.redirect('/admin/list-brand');
  } catch (error) {
    
  }
}

const deleteBrand = async (req, res) => {
  try {
    const brandID = req.params.id;
    console.log("categoryID", brandID);
    await Brand.deleteBrand(brandID);
    res.redirect('/admin/list-Brand');
  } catch (error) {
    console.log(error.message);
  }
};

// products 

const productPage = async (req,res) =>{
  try {
    const categories = await Category.getAllCategories();
    const brands = await Brand.getAllbrands();
    res.render('addProducts',{categories,brands});
  } catch (error) {
    console.log(error.message);
    
  }
}

const fecthSubCategory = async (req, res) => {
  const categoryId = req.params.categoryId;
  console.log("categoryID", categoryId);

  const subcategories = await Category.getSubcategoriesForCategory(categoryId);
  console.log("expected data",subcategories);
  res.json({ subcategories });
}


const addProducts = async (req, res) => {
  try {
     const body = JSON.parse(JSON.stringify(req.body));
     console.log("body",body);

      const { product, price, description, stock} = body
      const categoryId = body.category;
      const brandId = body.brand;
      const subcategory = body.subCategory;
     
      const images = req.files.map(file => file.path.replace('public', ''));
      const categoryObject = await Category.getCategoryById(categoryId);
      const brandObject = await Brand.getBrandID(brandId);
      const category = categoryObject.name;
      const brand = brandObject.name;

    
      const unitS = body.UnitS;
      const unitM = body.UnitM;
      const unitL = body.UnitL;
      const unitXL = body.UnitXL;
      const unitXXL = body.UnitXXL;
      const Us5 = body.UnitUs5;
      const Us6 = body.UnitUs6;
      const Us7 = body.UnitUs7;
      const Us8 = body.UnitUs8;
      const Us9 = body.UnitUs9;
      const Us10 = body.UnitUs10;
      

      const Size = {
        S :unitS?unitS:undefined,
        M :unitM?unitM:undefined,
        L :unitL?unitL:undefined,
        XL : unitXL?unitXL:undefined,
        XXL:unitXXL?unitXXL:undefined,
        US5:Us5?Us5:undefined,
        US6:Us7?Us7:undefined,
        US7:Us6?Us6:undefined,
        US8:Us8?Us8:undefined,
        US9:Us9?Us9:undefined,
        US10:Us10?Us10:undefined
        
      }

    

      for (const key in Size) {
        if (Size[key] === undefined) {
          delete Size[key];
        }
      }     
       const name = product.toUpperCase();
     
      const newProduct = new Product(name, category,subcategory ,brand, price, description, images, stock, Size);
      if (newProduct.category) {
        delete newProduct.category.subcategories;
      }

      newProduct.name.toUpperCase();
      
        const db = getDb();
        const collection = db.collection('products');
        const result = await collection.insertOne(newProduct);
        res.redirect('/admin/add-Products'); 
        

  } catch (error) {
      console.log(error.message);
  }
};

const listProducts = async (req,res) =>{
  try {
    const products = await Product.getAllproducts();
    res.render('listProducts',{products});
  } catch (error) {
    
  }
}

const listProductsEditPage = async (req, res) => {
  try {
    const productID = req.params.id;
    const product = await Product.getProductID(productID);
    const categories = await Category.getAllCategories();
    const brands = await Brand.getAllbrands();
    console.log("product",product);
    // const categories = product.category;
    // const brands = product.brand;
    // console.log("categories",categories);
    // console.log("brands",brands);

    res.render('editProducts', { product, categories, brands });
  } catch (error) {
    console.error(error);
    res.redirect('/error');
  }
};

const editProduct = async (req, res) => {
  try {
    const body = JSON.parse(JSON.stringify(req.body));
    const { product, category, subCategory, brand, price, description,stock } = req.body;

    const productID = req.params.id;
   
    const categoriess = await Category.getCategoryById(category);
    const brandss = await Brand.getBrandID(brand);
    const categories = categoriess.name;
    const brands = brandss.name;
    
    

    const unitS = body.UnitS;
    const unitM = body.UnitM;
    const unitL = body.UnitL;
    const unitXL = body.UnitXL;
    const unitXXL = body.UnitXXL;
    const Us5 = body.UnitUs5;
    const Us6 = body.UnitUs6;
    const Us7 = body.UnitUs7;
    const Us8 = body.UnitUs8;
    const Us9 = body.UnitUs9;
    const Us10 = body.UnitUs10;

    const Size = {
      S: unitS ? unitS : undefined,
      M: unitM ? unitM : undefined,
      L: unitL ? unitL : undefined,
      XL: unitXL ? unitXL : undefined,
      XXL: unitXXL ? unitXXL : undefined,
      US5: Us5 ? Us5 : undefined,
      US6: Us7 ? Us7 : undefined,
      US7: Us6 ? Us6 : undefined,
      US8: Us8 ? Us8 : undefined,
      US9: Us9 ? Us9 : undefined,
      US10: Us10 ? Us10 : undefined,
    };

    for (const key in Size) {
      if (Size[key] === undefined) {
        delete Size[key];
      }
    }

    const updatedProduct = {
      product,
      categories,
      subCategory,
      brands,
      price,
      description,
      stock,
      Size,
    };

   
    updatedProduct.product = updatedProduct.product.toUpperCase();

    if (updatedProduct.categories) {
      delete updatedProduct.categories.subcategories;
    }

    console.log("Product updated: ", updatedProduct);

    await Product.updateProduct(productID, updatedProduct);

    res.redirect('/admin/list-products');
  } catch (error) {
    console.error(error);
    res.redirect('/error');
  }
};

const deleteProduct = async (req,res) =>{
  try {
    console.log("enterd here ")
    const productID = req.params.id;
    await Product.deleteProduct(productID);
    res.redirect('/admin/list-products');
  } catch (error) {
    console.log(error.message);
    
  }
}








module.exports = {
    adminHome,
    login,
    loginVerifiy,
    customerList,
    blockUser,
    CategoryPage,
    addCategory,
    showCategoryList,
    showEditCategory,
    editCategory,
    deleteCategorys,
    addBrand,
    brandPage,
    showBrandList,
    showEditBrand,
    editBrands,
    deleteBrand,
    productPage,
    addProducts,
    fecthSubCategory,
    listProducts,
    listProductsEditPage,
    editProduct,
    deleteProduct
   
  
}
