import crypto from "crypto";

/**
 * Computes a SHA-256 hash of the request body
 * Ensures order of products does not affect the hash
 * @param {Object} body - Request body containing customer_id and products
 * @returns {string} SHA-256 hash in hex format
 */
export const computeRequestHash = (body) => {
    const { customer_id, products } = body;
    
    // Sort products by product_id to ensure deterministic hashing
    const sortedProducts = Array.isArray(products)
        ? [...products].sort((a, b) => {
              const idA = String(a.product_id || "");
              const idB = String(b.product_id || "");
              return idA.localeCompare(idB);
          })
        : [];

    const hashData = {
        customer_id: String(customer_id || ""),
        products: sortedProducts.map(p => ({
            product_id: String(p.product_id || ""),
            quantity: Number(p.quantity || 0)
        }))
    };

    return crypto
        .createHash("sha256")
        .update(JSON.stringify(hashData))
        .digest("hex");
};
