import Customer from "../models/customer.model.js";

/**
 * Create a new customer
 * @route POST /api/customers
 */
export const createCustomer = async (req, res) => {
    try {
        const { name, email } = req.body;

        // Basic validation
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required",
            });
        }

        // Clean name and email
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address",
            });
        }

        // Check if customer already exists
        const existingCustomer = await Customer.findOne({ email: cleanEmail });
        if (existingCustomer) {
            return res.status(409).json({
                success: false,
                message: "A customer with this email already exists",
            });
        }

        // Create new customer
        const customer = new Customer({
            name: cleanName,
            email: cleanEmail,
        });
        await customer.save();

        res.status(201).json({
            success: true,
            data: customer,
        });
    } catch (error) {
        console.error("Error creating customer:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
