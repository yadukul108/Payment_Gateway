import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Payment backend is fine"
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});