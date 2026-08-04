import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import customerRoutes from "./routes/customer.route.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use("/api/customers", customerRoutes);

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Payment backend is fine"
    });
});

const start = async () => { // only start the server when db connection is established
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

start();