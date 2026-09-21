const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authmiddleware");
const checkRole = require("../middleware/checkRole");
const Order = require("../models/order");
const Cart = require("../models/cart");
const Product = require("../models/product");
const User = require("../models/users");

// POST /api/orders - Create order from active cart
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { shippingAddress, paymentId } = req.body;

    // Fetch user to fallback shipping address if missing
    const user = await User.findById(req.user._id);
    const finalAddress = shippingAddress || user?.deliveryAddress;

    if (!finalAddress || finalAddress.trim().length < 5) {
      return res.status(400).json({
        message: "A valid shipping address (min 5 chars) is required to place an order.",
      });
    }

    const userCart = await Cart.findOne({ user: req.user._id });
    if (!userCart || !userCart.products || userCart.products.length === 0) {
      return res.status(400).json({ message: "Cart is empty. Cannot place order." });
    }

    // Verify stock and update product inventory
    const orderProducts = [];
    let totalPrice = 0;
    let totalProducts = 0;

    for (const item of userCart.products) {
      const prod = await Product.findById(item.productId);

      if (!prod) {
        return res.status(404).json({
          message: `Product "${item.title}" is no longer available.`,
        });
      }

      if (prod.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product "${prod.title}". Requested: ${item.quantity}, Available: ${prod.stock}`,
        });
      }

      // Deduct stock
      prod.stock -= item.quantity;
      await prod.save();

      orderProducts.push({
        productId: item.productId,
        quantity: item.quantity,
        title: item.title,
        price: item.price,
        image: item.image,
      });

      totalPrice += item.quantity * item.price;
      totalProducts += item.quantity;
    }

    const newOrder = new Order({
      user: req.user._id,
      products: orderProducts,
      totalProducts,
      totalPrice,
      shippingAddress: finalAddress,
      paymentId: paymentId || "PAYMENT_PENDING",
      paymentStatus: paymentId ? "completed" : "pending",
      orderStatus: "pending",
    });

    await newOrder.save();

    // Clear cart
    userCart.products = [];
    userCart.totalProducts = 0;
    userCart.totalCartPrice = 0;
    await userCart.save();

    res.status(201).json({
      message: "Order placed successfully",
      order: newOrder,
    });
  } catch (err) {
    console.error("Create Order Error:", err);
    res.status(500).json({ message: "Server error creating order" });
  }
});

// GET /api/orders - Get user's orders (or all orders for admin)
router.get("/", authMiddleware, async (req, res) => {
  try {
    let query = { user: req.user._id };

    // Admin can view all orders if requested
    if (req.user.roles && req.user.roles.includes("admin") && req.query.all === "true") {
      query = {};
    }

    const orders = await Order.find(query)
      .populate("user", "_id username email")
      .populate("products.productId", "_id title price images")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("Get Orders Error:", err);
    res.status(500).json({ message: "Server error fetching orders" });
  }
});

// GET /api/orders/:id - Get single order details
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "_id username email")
      .populate("products.productId", "_id title price images");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check ownership or admin
    const isAdmin = req.user.roles && req.user.roles.includes("admin");
    if (!isAdmin && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(order);
  } catch (err) {
    console.error("Get Order Error:", err);
    res.status(500).json({ message: "Server error fetching order" });
  }
});

// PATCH /api/orders/:id/status - Update order status (Admin or Seller)
router.patch("/:id/status", authMiddleware, checkRole(["admin", "seller"]), async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const allowedStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

    if (orderStatus && !allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${allowedStatuses.join(", ")}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
      if (orderStatus === "delivered") {
        order.deliveredAt = new Date();
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    res.json({ message: "Order status updated successfully", order });
  } catch (err) {
    console.error("Update Order Status Error:", err);
    res.status(500).json({ message: "Server error updating order status" });
  }
});

// PATCH /api/orders/:id/cancel - Cancel order (User or Admin)
router.patch("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isAdmin = req.user.roles && req.user.roles.includes("admin");
    if (!isAdmin && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (["shipped", "delivered"].includes(order.orderStatus)) {
      return res.status(400).json({
        message: `Cannot cancel order that is already ${order.orderStatus}.`,
      });
    }

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({ message: "Order is already cancelled." });
    }

    // Restore stock
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });
    }

    order.orderStatus = "cancelled";
    await order.save();

    res.json({ message: "Order cancelled successfully and stock restored.", order });
  } catch (err) {
    console.error("Cancel Order Error:", err);
    res.status(500).json({ message: "Server error cancelling order" });
  }
});

module.exports = router;
