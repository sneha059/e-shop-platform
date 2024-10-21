import asyncHandler from '../middleware/asyncHandler.js';
import Product from '../models/productModel.js';

// @desc    fetch all products
// @route GET /api/products
// @access public
const getProducts = asyncHandler(async(req,res) => {
    const pageSize = 8;
    const page = Number(req.query.pageNumber) || 1;

    const keyword = req.query.keyword ? { name : { $regex: req.query.keyword , $options : 'i'}}
    : {};

    const count = await Product.countDocuments({...keyword});

    const products = await Product.find({...keyword}).limit(pageSize).skip(pageSize * (page - 1));
    res.json({products , page , pages: Math.ceil(count/ pageSize)});
});

// @desc    fetch a products
// @route GET /api/products/:id
// @access public
const getProductById = asyncHandler(async(req,res) => {
    const product = await Product.findById(req.params.id);

    if(product){
    return res.json(product);
    }
    else{
        res.status(404); 
        throw new Error('Resource not found');
    }
});

// @desc    create new products
// @route POST /api/products
// @access private/admin
const createProduct = asyncHandler(async(req,res) => {
  const product = new Product({
      name: 'sample name',
      price: 0,
      user: req.user._id,
      image: '/images/sample.jpg',
      brand: 'sample brand',
      category: 'sample category',
      countInStock: 0,
      numReviews: 0,
      description: 'sample description'
  })

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

// @desc   Update a product
// @route PUT /api/products/:id
// @access Private/Admin
const updateProduct = asyncHandler(async(req,res) => {
    const {name,price,description,image,brand,category,countInStock} = req.body;

    const product = await Product.findById(req.params.id)

    if(product)
    {
        product.name = name;
        product.price = price;
        product.description = description;
        product.image = image;
        product.brand = brand;
        product.category = category;
        product.countInStock = countInStock;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    }else{
        res.status(404);
        throw new Error('resource not found')
    }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async(req,res) => {
    const {name,price,description,image,brand,category,countInStock} = req.body;

    const product = await Product.findById(req.params.id)

    if(product)
    {
       await Product.deleteOne({ _id : product._id});
        res.status(200).json({message : 'product deleted'});
    }else{
        res.status(404);
        throw new Error('resource not found')
    }
});

 // @desc   create a review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async(req,res) => {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);
  
    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );
  
      if (alreadyReviewed) {
        res.status(400);
        throw new Error('Product already reviewed');
      }
  
      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
      };
  
      product.reviews.push(review);
  
      product.numReviews = product.reviews.length;
  
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;
  
      await product.save();
      res.status(201).json({ message: 'Review added' });
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
});

 // @desc   delete a review
// @route   DELETE /api/products/:id/reviews
// @access  Private
const deleteProductReview = async (req, res) => {
  const productId = req.params.id;

  try {
    // Find the product by ID
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find the index of the review for the specified user
    const reviewIndex = product.reviews.findIndex(
      (review) => review.user.toString() === req.user._id.toString()
    );

    // Check if the user has a review for this product
    if (reviewIndex === -1) {
      return res.status(404).json({ message: 'Review not found for this user' });
    }

    // Remove the review
    product.reviews.splice(reviewIndex, 1);

    // Update the product's average rating and number of reviews
    product.rating =
      product.reviews.reduce((acc, review) => acc + review.rating, 0) /
      product.reviews.length;
    product.numReviews = product.reviews.length;

    // Save the updated product
    await product.save();

    return res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    fetch top products
// @route GET /api/products/top
// @access public
const getTopProducts = asyncHandler(async(req,res) => {
    const products = await Product.find({}).sort({rating: -1}).limit(4);

    return res.json(products);
});


export {getProducts,getProductById,createProduct,updateProduct,deleteProduct,createProductReview,getTopProducts,deleteProductReview};