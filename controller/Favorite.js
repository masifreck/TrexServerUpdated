const mysqlPool = require('../config/db');




const addFavoriteVendor = async (req, res) => {
    try {
        const { userId, vendorId } = req.body;

        if (!userId || !vendorId) {
            return res.status(400).send({
                success: false,
                message: 'Please provide user ID and vendor ID'
            });
        }

        // Check if the user already marked this vendor as favorite
        const [existingFavorite] = await mysqlPool.query('SELECT * FROM favorites WHERE user_id = ? AND vendor_id = ?', [userId, vendorId]);

        if (existingFavorite.length > 0) {
            return res.status(200).send({
                success: false,
                message: 'Vendor is already in favorites'
            });
        }

        // Insert the favorite vendor for the user
        const [result] = await mysqlPool.query('INSERT INTO favorites (user_id, vendor_id) VALUES (?, ?)', [userId, vendorId]);

        if (result.affectedRows === 0) {
            return res.status(500).send({
                success: false,
                message: 'Error while adding favorite vendor'
            });
        }

        res.status(200).send({
            success: true,
            message: 'Favorite vendor added successfully'
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error in adding favorite vendor',
            error
        });
    }
};



const removeFavoriteVendor = async (req, res) => {
    try {
        const { userId, vendorId } = req.body;

        if (!userId || !vendorId) {
            return res.status(400).send({
                success: false,
                message: 'Please provide user ID and vendor ID'
            });
        }

        // Delete the favorite vendor for the user
        const data = await mysqlPool.query('DELETE FROM favorites WHERE user_id = ? AND vendor_id = ?', [userId, vendorId]);

        if (!data) {
            return res.status(500).send({
                success: false,
                message: 'Error while removing favorite vendor'
            });
        }

        res.status(200).send({
            success: true,
            message: 'Favorite vendor removed successfully'
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error in removing favorite vendor',
            error
        });
    }
};

const getFavoriteVendors = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).send({
                success: false,
                message: 'Please provide user ID'
            });
        }

        // Retrieve the favorite vendors for the user
        const [favorites] = await mysqlPool.query('SELECT vendor_id FROM favorites WHERE user_id = ?', [userId]);

        // Log the raw query result for debugging
        console.log('Query result:', favorites);

        if (favorites.length === 0) {
            return res.status(404).send({
                success: false,
                message: 'No favorite vendors found for the user'
            });
        }

        const vendorIds = favorites.map(favorite => favorite.vendor_id);

        // Retrieve vendor details from the addvendor table
        const [vendors] = await mysqlPool.query('SELECT * FROM addvendor WHERE id IN (?)', [vendorIds]);

        res.status(200).send({
            success: true,
            message: 'Favorite vendors retrieved successfully',
            data: vendors
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error in retrieving favorite vendors',
            error
        });
    }
};


module.exports ={addFavoriteVendor,removeFavoriteVendor,getFavoriteVendors}