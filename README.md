# CartWish Backend

A RESTful backend API for **CartWish**, an e-commerce platform providing secure and scalable functionality for managing users, products, categories, shopping carts, and orders.

Built with **Node.js, Express.js, and MongoDB**, the project follows a modular structure that keeps authentication, authorization, business logic, and database models organized and maintainable.

---

## 🚀 Features

- 🔐 User authentication with JWT
- 🛡️ Role-based authorization
- 👤 User management
- 🛍️ Product management
- 📂 Category management
- 🛒 Shopping cart management
- 📦 Order management
- 📤 File and image upload support
- 🔒 Protected API routes
- 📝 Application logging
- 🌱 Environment variable configuration
- 🗄️ MongoDB database integration
- 📦 Mongoose data modeling
- 🧩 Modular project structure

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Backend web framework |
| MongoDB | Database |
| Mongoose | MongoDB ODM |
| JWT | Authentication |
| Passport.js | Authentication strategy |
| bcrypt | Password hashing |
| Multer | File uploads |
| dotenv | Environment configuration |
| Git | Version control |
| Postman | API testing |

---

## 📁 Project Structure

```
cartwish-backend/
│
├── config/
│   └── passport.js
│
├── middleware/
│   ├── authmiddleware.js
│   └── checkRole.js
│
├── models/
│   ├── cart.js
│   ├── category.js
│   ├── order.js
│   ├── product.js
│   └── users.js
│
├── routes/
│   ├── auth.js
│   ├── cart.js
│   ├── category.js
│   ├── product.js
│   └── users.js
│
├── uploads/
│
├── logs/
│   └── mylogs.log
│
├── .env
├── .gitignore
├── index.js
├── package.json
└── package-lock.json
```

---

## 🏗️ Architecture

The backend is organized into separate layers to keep the application easy to develop, maintain, and scale.

```
                    Client
                      │
                      ▼
                 REST API
                      │
                      ▼
                   Routes
                      │
                      ▼
                 Middleware
                ┌─────┴─────┐
                │           │
        Authentication   Authorization
                │           │
                └─────┬─────┘
                      │
                      ▼
                   Models
                      │
                      ▼
                   MongoDB
```

### Main Components

**Routes** — API endpoints for each application module.

**Middleware** — Handles authentication and authorization before requests reach protected endpoints.

**Models** — Mongoose schemas used to interact with MongoDB.

**Config** — Application configuration and authentication-related setup.

**Uploads** — Stores uploaded files and media.

**Logs** — Application log files, excluded from version control.

---

## 🔐 Authentication & Authorization

CartWish uses token-based authentication to protect private resources.

After a successful login, the client receives an authentication token used to access protected endpoints:

```
Authorization: Bearer <your-token>
```

Protected routes use authentication middleware to verify the user's identity. Role-based authorization is enforced through dedicated role-checking middleware to restrict specific operations according to user permissions.

---

## 📌 API Modules

### 🔑 Authentication
- Register user
- Login user
- Authenticate user

### 👤 Users
- Create users
- Retrieve user information
- Update user information
- Manage user roles
- Delete users

### 🛍️ Products
- Create product
- View products
- View product details
- Update product
- Delete product
- Manage product information
- Associate products with categories
- Upload product images

Typical product data includes: `name`, `description`, `price`, `category`, `stock`, `image`, `status`.

### 📂 Categories
- Create category
- View categories
- Update category
- Delete category
- Associate products with categories

### 🛒 Shopping Cart
- Add products to cart
- View cart
- Update product quantity
- Remove products
- Calculate cart totals

Typical flow:

```
Customer → Select Product → Add to Cart → Update Quantity → Checkout → Create Order
```

### 📦 Orders
- Create order
- View orders
- View order details
- Update order information
- Manage order status
- Store ordered products
- Store customer information

---

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/shahzaibjillani1/cartwish-backend.git
cd cartwish-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

Replace the placeholder values with your own configuration.

> ⚠️ **Important:** Never commit your `.env` file or other secrets to GitHub.

### 4. Start the application

For development:

```bash
npm run dev
```

If no dev script is configured:

```bash
node index.js
```

The server should start on:

```
http://localhost:5000
```

---

## 🧪 API Testing

The API can be tested using:

- Postman
- Insomnia
- Thunder Client
- Any frontend application

### Example login request

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

After authentication, include the returned token on subsequent requests:

```
Authorization: Bearer <your-token>
```

---

## 🔒 Security

- JWT-based authentication
- Password hashing (bcrypt)
- Protected routes
- Role-based authorization
- Environment variables for sensitive configuration
- Separation of authentication and authorization logic
- Sensitive files excluded from Git
- Controlled access to administrative operations

---

## 🗄️ Database

CartWish uses MongoDB for persistent storage, with Mongoose defining schemas and handling interaction with the database.

**Main models:** `User`, `Product`, `Category`, `Cart`, `Order`

### Basic relationships

```
Category
   │
   └── Products
          │
          ├── Cart
          │
          └── Orders

User
 ├── Cart
 └── Orders
```

---

## 📤 File Uploads

Uploaded files are stored in the `uploads/` directory and are intentionally excluded from Git version control.

## 📝 Logging

Application logs are stored separately from source code in `logs/mylogs.log` and excluded from Git via `.gitignore`.

## 🌱 Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the server runs on |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key used to sign JWTs |
| `NODE_ENV` | Application environment (`development` / `production`) |

For production, use secure environment configuration provided by your hosting platform.

---

## 🚀 Production Deployment

Before deploying CartWish to production:

- [ ] Configure production environment variables
- [ ] Use a production MongoDB database
- [ ] Use a strong JWT secret
- [ ] Configure CORS appropriately
- [ ] Enable HTTPS
- [ ] Configure secure file storage
- [ ] Configure application logging
- [ ] Disable development-specific settings
- [ ] Use a process manager (e.g. PM2) where appropriate

```bash
npm install --production
npm start
```

---

## 📈 Future Improvements

- ⚡ Redis caching
- 🧪 Automated unit and integration testing
- 🐳 Docker containerization
- 🔄 CI/CD pipeline
- ☁️ Cloud deployment
- 📊 Admin dashboard analytics

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch
   ```bash
   git checkout -b feature/your-feature
   ```
3. Make your changes and test them
4. Commit your changes
   ```bash
   git add .
   git commit -m "Add your feature"
   ```
5. Push your branch
   ```bash
   git push origin feature/your-feature
   ```
6. Open a Pull Request with a clear description of your changes

---

## 🧑‍💻 Author

**Shahzaib Jillani**
Backend / Full Stack Developer

GitHub: [github.com/shahzaibjillani1](https://github.com/shahzaibjillani1)

---

## 📄 License

This project is currently developed for educational, portfolio, and demonstration purposes.

---

⭐ **CartWish Backend** provides the server-side foundation for an e-commerce platform with authentication, authorization, product management, category management, shopping cart functionality, and order management — built with a modular structure for future scalability.

If you find this project useful, consider giving it a ⭐ on GitHub.
