import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import customerRoutes from "./routes/customer.route.js";
import orderRoutes from "./routes/order.route.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Payment backend is fine"
    });
});
// only start the server when db connection is established
const start = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

start();