const swaggerUi = require("swagger-ui-express");

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "CartWish E-Commerce API",
    version: "1.0.0",
    description:
      "Comprehensive REST API documentation for CartWish E-Commerce platform built with Node.js, Express, and MongoDB.",
    contact: {
      name: "CartWish API Support",
    },
  },
  servers: [
    {
      url: "/",
      description: "Current Server (Production / Local)",
    },
    {
      url: "http://localhost:3000",
      description: "Local Development Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token in the format: Bearer <token>",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          _id: { type: "string" },
          username: { type: "string", example: "johndoe" },
          email: { type: "string", example: "john@example.com" },
          deliveryAddress: { type: "string", example: "123 Main St, Anytown" },
          roles: {
            type: "array",
            items: { type: "string", enum: ["user", "seller", "admin"] },
            example: ["user"],
          },
        },
      },
      Category: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string", example: "Electronics" },
          image: { type: "string", example: "1726890000000-electronics.png" },
        },
      },
      Review: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: { $ref: "#/components/schemas/User" },
          rating: { type: "number", minimum: 1, maximum: 5, example: 5 },
          comment: { type: "string", example: "Great product!" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Product: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "string", example: "Wireless Headphones" },
          description: {
            type: "string",
            example: "High quality noise-cancelling wireless bluetooth headphones.",
          },
          seller: { type: "string" },
          category: { type: "string" },
          price: { type: "number", example: 99.99 },
          stock: { type: "number", example: 50 },
          images: {
            type: "array",
            items: { type: "string" },
            example: ["headphones1.jpg"],
          },
          reviews: {
            type: "array",
            items: { $ref: "#/components/schemas/Review" },
          },
        },
      },
      CartItem: {
        type: "object",
        properties: {
          productId: { type: "string" },
          quantity: { type: "number", example: 2 },
          title: { type: "string", example: "Wireless Headphones" },
          price: { type: "number", example: 99.99 },
          image: { type: "string", example: "headphones1.jpg" },
        },
      },
      Cart: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: { type: "string" },
          products: {
            type: "array",
            items: { $ref: "#/components/schemas/CartItem" },
          },
          totalProducts: { type: "number", example: 2 },
          totalCartPrice: { type: "number", example: 199.98 },
        },
      },
      Order: {
        type: "object",
        properties: {
          _id: { type: "string" },
          user: { type: "string" },
          products: {
            type: "array",
            items: { $ref: "#/components/schemas/CartItem" },
          },
          totalProducts: { type: "number", example: 2 },
          totalPrice: { type: "number", example: 199.98 },
          shippingAddress: { type: "string", example: "123 Main St, Anytown" },
          paymentId: { type: "string", example: "PAY_12345" },
          paymentStatus: {
            type: "string",
            enum: ["pending", "completed", "failed"],
            example: "completed",
          },
          orderStatus: {
            type: "string",
            enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
            example: "pending",
          },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Error description" },
        },
      },
    },
  },
  tags: [
    { name: "Health", description: "API Status & Health Endpoint" },
    { name: "Auth", description: "OAuth 2.0 Authentication (Google & Facebook)" },
    { name: "Users", description: "User Registration, Login, and Profiles" },
    { name: "Category", description: "Category Management" },
    { name: "Products", description: "Product Catalog, Search, and Reviews" },
    { name: "Cart", description: "Shopping Cart Operations" },
    { name: "Orders", description: "Order Placement, Tracking, and Status Updates" },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "API Health Check",
        responses: {
          200: {
            description: "Server is running and healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "OK" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/signup": {
      post: {
        tags: ["Users"],
        summary: "User Registration / Sign Up",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "email", "password"],
                properties: {
                  username: { type: "string", example: "johndoe" },
                  email: { type: "string", example: "john@example.com" },
                  password: { type: "string", example: "secret123" },
                  deliveryAddress: { type: "string", example: "123 Main Street" },
                  roles: {
                    type: "array",
                    items: { type: "string", enum: ["user", "seller", "admin"] },
                    example: ["user"],
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/User" },
                    token: { type: "string" },
                  },
                },
              },
            },
          },
          400: { description: "Validation error or user already exists" },
        },
      },
    },
    "/api/users/login": {
      post: {
        tags: ["Users"],
        summary: "User Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "john@example.com" },
                  password: { type: "string", example: "secret123" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "User logged in successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    data: { $ref: "#/components/schemas/User" },
                    token: { type: "string" },
                  },
                },
              },
            },
          },
          400: { description: "Invalid credentials" },
        },
      },
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "Get current user profile",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "User profile data",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
          },
          401: { description: "Unauthorized" },
        },
      },
      put: {
        tags: ["Users"],
        summary: "Update profile information",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string", example: "john_updated" },
                  deliveryAddress: { type: "string", example: "456 New Ave" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Profile updated successfully" } },
        401: { description: "Unauthorized" },
      },
    },
    "/api/category": {
      get: {
        tags: ["Category"],
        summary: "Get all categories",
        responses: {
          200: {
            description: "List of categories",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Category" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Category"],
        summary: "Create a new category (Admin only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["name", "image"],
                properties: {
                  name: { type: "string", example: "Electronics" },
                  image: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Category created successfully" },
          403: { description: "Admin access required" },
        },
      },
    },
    "/api/category/{id}": {
      get: {
        tags: ["Category"],
        summary: "Get category by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Category details" }, 404: { description: "Not found" } },
      },
      put: {
        tags: ["Category"],
        summary: "Update category (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  image: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Updated successfully" } },
      },
      delete: {
        tags: ["Category"],
        summary: "Delete category (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Deleted successfully" } },
      },
    },
    "/api/products": {
      get: {
        tags: ["Products"],
        summary: "Get paginated products catalog with filters",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "perPage", in: "query", schema: { type: "integer", default: 8 } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: { description: "List of products with pagination metadata" },
        },
      },
      post: {
        tags: ["Products"],
        summary: "Create a new product (Seller or Admin)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["title", "description", "category", "price", "stock", "images"],
                properties: {
                  title: { type: "string", example: "Smart Watch" },
                  description: { type: "string", example: "Feature-packed smartwatch with heart rate monitoring." },
                  category: { type: "string", example: "66f000000000000000000001" },
                  price: { type: "number", example: 149.99 },
                  stock: { type: "integer", example: 25 },
                  images: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                  },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Product created successfully" } },
      },
    },
    "/api/products/suggestions": {
      get: {
        tags: ["Products"],
        summary: "Get live product search suggestions",
        parameters: [{ name: "search", in: "query", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Matching product titles" } },
      },
    },
    "/api/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get single product by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Product details with reviews" }, 404: { description: "Not found" } },
      },
      put: {
        tags: ["Products"],
        summary: "Update product (Seller or Admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  price: { type: "number" },
                  stock: { type: "integer" },
                  images: { type: "array", items: { type: "string", format: "binary" } },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Product updated successfully" } },
      },
      delete: {
        tags: ["Products"],
        summary: "Delete product (Seller or Admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Product deleted successfully" } },
      },
    },
    "/api/products/{id}/review": {
      post: {
        tags: ["Products"],
        summary: "Add or update product review",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rating", "comment"],
                properties: {
                  rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
                  comment: { type: "string", example: "Outstanding performance!" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Review added or updated" } },
      },
    },
    "/api/cart": {
      get: {
        tags: ["Cart"],
        summary: "Get active user shopping cart",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Cart object" } },
      },
      delete: {
        tags: ["Cart"],
        summary: "Clear all items from user cart",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Cart cleared" } },
      },
    },
    "/api/cart/{productId}": {
      post: {
        tags: ["Cart"],
        summary: "Add product to cart",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  quantity: { type: "integer", default: 1, example: 2 },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Product added to cart" } },
      },
    },
    "/api/cart/increase/{productId}": {
      patch: {
        tags: ["Cart"],
        summary: "Increase item quantity in cart",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Quantity increased" } },
      },
    },
    "/api/cart/decrease/{productId}": {
      patch: {
        tags: ["Cart"],
        summary: "Decrease item quantity in cart",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Quantity decreased" } },
      },
    },
    "/api/cart/remove/{productId}": {
      delete: {
        tags: ["Cart"],
        summary: "Remove product completely from cart",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Product removed from cart" } },
      },
    },
    "/api/orders": {
      post: {
        tags: ["Orders"],
        summary: "Place a new order from cart",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  shippingAddress: { type: "string", example: "123 Delivery St, City" },
                  paymentId: { type: "string", example: "PAY_987654321" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Order created successfully and cart cleared" } },
      },
      get: {
        tags: ["Orders"],
        summary: "Get user order history",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "all", in: "query", schema: { type: "boolean" }, description: "Admin option to view all orders" },
        ],
        responses: { 200: { description: "List of orders" } },
      },
    },
    "/api/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Get order details by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Order details" } },
      },
    },
    "/api/orders/{id}/status": {
      patch: {
        tags: ["Orders"],
        summary: "Update order status (Admin or Seller)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  orderStatus: {
                    type: "string",
                    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
                    example: "shipped",
                  },
                  paymentStatus: {
                    type: "string",
                    enum: ["pending", "completed", "failed"],
                    example: "completed",
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Order status updated" } },
      },
    },
    "/api/orders/{id}/cancel": {
      patch: {
        tags: ["Orders"],
        summary: "Cancel order and restore stock",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Order cancelled and inventory restored" } },
      },
    },
  },
};

const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui.min.css";
const JS_URLS = [
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-bundle.js",
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.0.0/swagger-ui-standalone-preset.js",
];

const swaggerOptions = {
  customCssUrl: CSS_URL,
  customJs: JS_URLS,
  customSiteTitle: "CartWish API Documentation",
};

const setupSwagger = (app) => {
  // Support multiple route aliases for Swagger UI
  const swaggerRoutes = ["/swagger", "/swagger-ui", "/docs", "/api-docs"];

  // Specifically handle the /swagger/api-docs path from the user's browser/Vercel URL
  app.get("/swagger/api-docs", (req, res) => res.redirect("/api-docs/"));
  app.get("/swagger/api-docs/", (req, res) => res.redirect("/api-docs/"));

  swaggerRoutes.forEach((route) => {
    app.use(route, swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));
  });

  // Redirect root /swagger to /swagger/
  app.get("/swagger", (req, res) => res.redirect("/swagger/"));
  app.get("/docs", (req, res) => res.redirect("/docs/"));
  app.get("/api-docs", (req, res) => res.redirect("/api-docs/"));
};

module.exports = setupSwagger;
