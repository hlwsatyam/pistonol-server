const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require('path');
const morgan = require('morgan');

dotenv.config();
const app = express();
app.use(express.json()); 
app.use(cookieParser());
app.use(morgan('dev'));
 
 
app.use('/generated_qrcodes', express.static(path.join(__dirname, 'generated_qrcodes')));
app.use(
  cors()
);



app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
connectDB();
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/customer", require("./routes/customer.js"));
app.use("/api/leads", require("./routes/leadRoutes.js"));
app.use("/api/qrcodes", require("./routes/qrCodeRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes.js"));
app.use("/api/wallet", require("./routes/walletRoutes.js"));
app.use("/api/products", require("./routes/productRoutes.js"));
app.use("/api/marquees" , require("./routes/marquee.js"));
app.use("/api/banners" , require("./routes/banner.js"));
app.use("/api/orders" , require("./routes/orders.js"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
