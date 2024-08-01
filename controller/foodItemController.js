const fs = require('fs');
const mysqlPool = require('../config/db');
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const createFoodItem = async (req, res) => {
    try {
        // Handle file upload
      upload.fields([
        { name: 'image', maxCount: 1 },
        
    ])(req, res, async function (err) {
        if (err) {
            return res.status(500).send({
                success: false,
                message: 'Error uploading images',
                error: err
            });
        }

            const { vendor_id, title, price, description } = req.body;
            const image_file = req.files['image'] ? req.files['image'][0] : null;

            if (!vendor_id || !title || !price) {
                return res.status(400).send({
                    success: false,
                    message: 'Please provide all required data'
                });
            }

            // Check the number of food items for the vendor
            const [rows] = await mysqlPool.query(
                'SELECT COUNT(*) as count FROM food_items WHERE vendor_id = ?',
                [vendor_id]
            );

            if (rows[0].count >= 50) {
                return res.status(400).send({
                    success: false,
                    message: 'You have exceeded the limit of 50 food items'
                });
            }

            // Convert image to Base64
            let imageBase64 = null;
            if (image_file) {
                imageBase64 = image_file.buffer.toString('base64');
            }

            const data = await mysqlPool.query(
                `INSERT INTO food_items (vendor_id, title, price, image_url, description) 
                VALUES (?, ?, ?, ?, ?)`,
                [vendor_id, title, price, imageBase64, description]
            );

            if (!data) {
                return res.status(501).send({
                    success: false,
                    message: 'Error in insert'
                });
            }

            res.status(200).send({
                success: true,
                message: 'Food item saved successfully'
            });
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error in create food item API',
            error
        });
    }
};


const getFoodItemsByVendor = async (req, res) => {
    try {
        const { vendor_id } = req.query; // Use req.query for query parameters

        if (!vendor_id) {
            return res.status(400).send({
                success: false,
                message: 'Vendor ID is required'
            });
        }

        const [rows] = await mysqlPool.query(
            'SELECT * FROM food_items WHERE vendor_id = ?',
            [vendor_id]
        );

        if (rows.length === 0) {
            return res.status(200).send({
                success: true,
                message: 'No food items found for this vendor',
                data: rows,
            });
        }

        res.status(200).send({
            success: true,
            message: 'Food items retrieved successfully',
            data: rows,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error in get food items API',
            error
        });
    }
};
const getVendorsByPriceRangeAndLocation = async (req, res) => {
    try {
        const { min_price, max_price, minLat, maxLat, minLon, maxLon } = req.query;

        // Validate that all required query parameters are present
        if (!min_price || !max_price || !minLat || !maxLat || !minLon || !maxLon) {
            return res.status(400).send({
                success: false,
                message: 'Please provide all required parameters: min_price, max_price, minLat, maxLat, minLon, maxLon'
            });
        }

        // Convert query parameters to appropriate types
        const minPrice = parseFloat(min_price);
        const maxPrice = parseFloat(max_price);
        const minLatitude = parseFloat(minLat);
        const maxLatitude = parseFloat(maxLat);
        const minLongitude = parseFloat(minLon);
        const maxLongitude = parseFloat(maxLon);

        const query = `
            SELECT DISTINCT v.* 
            FROM addvendor v
            JOIN food_items f ON v.id = f.vendor_id
            WHERE f.price BETWEEN ? AND ?
            AND v.latitude BETWEEN ? AND ?
            AND v.longitude BETWEEN ? AND ?
        `;

        const [rows] = await mysqlPool.query(query, [minPrice, maxPrice, minLatitude, maxLatitude, minLongitude, maxLongitude]);

        if (rows.length === 0) {
            return res.status(404).send({
                success: false,
                message: 'No vendors found in the specified price range and location'
            });
        }

        res.status(200).send({
            success: true,
            data: rows
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error in get vendors by price range and location API',
            error
        });
    }
};

const updateFoodItem = async (req, res) => {
    try {
        // Handle file upload
        upload.fields([
            { name: 'image', maxCount: 1 },
        ])(req, res, async function (err) {
            if (err) {
                return res.status(500).send({
                    success: false,
                    message: 'Error uploading images',
                    error: err
                });
            }

            const { food_item_id } = req.query;
            const { title, price, description } = req.body;
            const image_file = req.files['image'] ? req.files['image'][0] : null;

            if (!food_item_id) {
                return res.status(400).send({
                    success: false,
                    message: 'Please provide food_item_id'
                });
            }

            // Check if the food item exists
            const [rows] = await mysqlPool.query(
                'SELECT * FROM food_items WHERE id = ?',
                [food_item_id]
            );

            if (rows.length === 0) {
                return res.status(404).send({
                    success: false,
                    message: 'Food item not found'
                });
            }

            // Convert image to Base64 if provided
            let imageBase64 = null;
            if (image_file) {
                imageBase64 = image_file.buffer.toString('base64');
            }

            // Prepare the update query
            let updateQuery = 'UPDATE food_items SET ';
            let queryParams = [];
            
            if (title) {
                updateQuery += 'title = ?, ';
                queryParams.push(title);
            }
            
            if (price) {
                updateQuery += 'price = ?, ';
                queryParams.push(price);
            }
            
            if (description) {
                updateQuery += 'description = ?, ';
                queryParams.push(description);
            }
            
            if (imageBase64) {
                updateQuery += 'image_url = ?, ';
                queryParams.push(imageBase64);
            }
            
            // Remove trailing comma and space
            updateQuery = updateQuery.slice(0, -2);
            
            // Append the WHERE clause
            updateQuery += ' WHERE id = ?';
            queryParams.push(food_item_id);

            const [updateResult] = await mysqlPool.query(updateQuery, queryParams);

            if (updateResult.affectedRows === 0) {
                return res.status(501).send({
                    success: false,
                    message: 'Error in update'
                });
            }

            res.status(200).send({
                success: true,
                message: 'Food item updated successfully'
            });
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error in update food item API',
            error
        });
    }
};
const deleteFoodItem = async (req, res) => {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).send({
                success: false,
                message: 'Please provide the food item ID'
            });
        }

        const [result] = await mysqlPool.query(
            'DELETE FROM food_items WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).send({
                success: false,
                message: 'Food item not found'
            });
        }

        res.status(200).send({
            success: true,
            message: 'Food item deleted successfully'
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error in delete food item API',
            error
        });
    }
};



module.exports = {
    createFoodItem,
    getFoodItemsByVendor,getVendorsByPriceRangeAndLocation,updateFoodItem,deleteFoodItem
};
