import Idempotency from "../models/idempotency.model.js";
import { computeRequestHash } from "../utils/hash.js";

/**
 * Express middleware to handle API idempotency.
 * Expects an 'Idempotency-Key' header.
 */
export const checkIdempotency = async (req, res, next) => {
    try {
        const idempotencyKey = req.headers["idempotency-key"];
        const { customer_id } = req.body;

        // 1. Validate Request - check if key and customer_id are present
        if (!idempotencyKey) {
            return res.status(400).json({
                success: false,
                message: "Idempotency-Key header is required",
            });
        }

        if (!customer_id) {
            return res.status(400).json({
                success: false,
                message: "customer_id is required",
            });
        }

        // 5. Compute Request Hash
        const currentHash = computeRequestHash(req.body);

        // 6. Idempotency Check
        const existingRecord = await Idempotency.findOne({ idempotency_key: idempotencyKey });

        if (existingRecord) {
            // Validate request hash matches
            if (existingRecord.request_hash !== currentHash) {
                return res.status(400).json({
                    success: false,
                    message: "Idempotency-Key conflict: Request payload does not match original request",
                });
            }

            // Check the state of the record
            if (existingRecord.state === "processing") {
                return res.status(409).json({
                    success: false,
                    message: "A request with this Idempotency-Key is already in progress",
                });
            }

            if (existingRecord.state === "completed") {
                // Return cached response
                return res.status(existingRecord.status_code || 200).json(existingRecord.response_body);
            }

            if (existingRecord.state === "failed") {
                // If it failed previously, delete the failed record to allow a new attempt
                await Idempotency.deleteOne({ _id: existingRecord._id });
            }
        }

        // If no active record exists, create a new "processing" record
        const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Hours TTL
        const newRecord = new Idempotency({
            idempotency_key: idempotencyKey,
            request_hash: currentHash,
            customer_id,
            state: "processing",
            expiry_date: expiryDate
        });

        await newRecord.save();

        // Attach record info to request so controller can finalize it
        req.idempotencyRecord = newRecord;

        next();
    } catch (error) {
        console.error("Idempotency middleware error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error during idempotency check",
        });
    }
};
