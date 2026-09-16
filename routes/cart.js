const authMiddleware = require("../middleware/authmiddleware");
const Cart = require("../models/cart");
const Product = require("../models/product");

const router = require("express").Router();

router.post("/:productId",authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.productId;
    const userId = req.user._id;

    if (!productId || !quantity) {
      return res
        .status(400)
        .json({ message: "Product ID and quantity are required" });
    }

    const foundProduct = await Product.findById(productId);
    if (!foundProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (foundProduct.stock < quantity) {
      return res.status(400).json({ message: "Not enough stock" });
    }

    let userCart = await Cart.findOne({ user: userId });
    if (!userCart) {
      userCart = new Cart({
        user: userId,
        products: [],
        totalProducts: 0,
        totalCartPrice: 0,
      });
    }

    const existingProductIndex = userCart.products.findIndex(
      (p) => p.productId.toString() === productId.toString()
    );

    if (existingProductIndex !== -1) {
      if (
        userCart.products[existingProductIndex].quantity + quantity >
        foundProduct.stock
      ) {
        return res.status(400).json({ message: "Not enough stock" });
      }

      userCart.products[existingProductIndex].quantity += quantity;
    } else {
      userCart.products.push({
        productId: productId,
        quantity: quantity,
        title: foundProduct.title,
        price: foundProduct.price,
        image: foundProduct.images[0],
      });
    }

    userCart.totalProducts = userCart.products.reduce(
      (total, p) => total + p.quantity,
      0
    );

    userCart.totalCartPrice = userCart.products.reduce(
      (total, p) => total + p.quantity * p.price,
      0
    );

    await userCart.save();

    res.json({
      message: "Product added to cart",
      cart: userCart,
    });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id });
    if(!cart){
        return res.status(404).json({message:"Cart not found"})
    }
    res.json(cart);
});

router.patch("/increase/:productId", authMiddleware, async (req, res) => {
  try {
    const productId = req.params.productId;

    const userCart = await Cart.findOne({ user: req.user._id });
    if (!userCart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const productInCart = userCart.products.find(
      (p) => p.productId.toString() === productId.toString()
    );

    if (!productInCart) {
      return res.status(404).json({ message: "Product not found in cart" });
    }
    const foundProduct = await Product.findById(productId);
    if (!foundProduct) {
      return res.status(404).json({ message: "Product not found in DB" });
    }

    if (productInCart.quantity + 1 > foundProduct.stock) {
      return res.status(400).json({ message: "Not enough stock available" });
    }

    productInCart.quantity++;

    userCart.totalProducts = userCart.products.reduce(
      (total, p) => total + p.quantity,
      0
    );

    userCart.totalCartPrice = userCart.products.reduce(
      (total, p) => total + p.quantity * p.price,
      0
    );

    await userCart.save();

    res.json({ message: "Quantity increased", cart: userCart });
  } catch (err) {
    console.error("Increase quantity error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.patch("/decrease/:productId", authMiddleware, async (req, res) => {
  try {
    const productId = req.params.productId;

    const userCart = await Cart.findOne({ user: req.user._id });
    if (!userCart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const productIndex = userCart.products.findIndex(
      (p) => p.productId.toString() === productId.toString()
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    const productInCart = userCart.products[productIndex];

    productInCart.quantity--;

    if (productInCart.quantity <= 0) {
      userCart.products.splice(productIndex, 1);
    }

    userCart.totalProducts = userCart.products.reduce(
      (total, p) => total + p.quantity,
      0
    );

    userCart.totalCartPrice = userCart.products.reduce(
      (total, p) => total + p.quantity * p.price,
      0
    );

    await userCart.save();

    res.json({ message: "Quantity decreased", cart: userCart });
  } catch (err) {
    console.error("Decrease quantity error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.patch("/remove/:productId", authMiddleware, async (req, res) => {
  
  const productId = req.params.productId;
  const product = await Product.findById(productId);
  if(!product){
    return res.status(404).json({message:"Product not found"});
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if(!cart){
    return res.status(404).json({message:"Cart not found"});
  }
  const productIndex = cart.products.findIndex((p) => p.productId.toString() === productId.toString());
  if(productIndex === -1){
    return res.status(404).json({message:"Product not found in cart"});
  }
  cart.products.splice(productIndex, 1);
  cart.totalProducts = cart.products.reduce((total, p) => total + p.quantity, 0);
  cart.totalCartPrice = cart.products.reduce((total, p) => total + p.quantity * p.price, 0);
  await cart.save();
  res.json({message:"Product removed from cart", cart});


});
module.exports = router;
