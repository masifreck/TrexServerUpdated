const mysqlPool = require('../config/db');


const safety = async (req, res) => {
    try {
        const { description, location, contact, userid } = req.body;

        // Validate mandatory fields
        if (!description || !contact || !userid) {
            return res.status(400).send({
                success: false,
                message: 'Please provide all mandatory fields: description, contact information, and userid'
            });
        }

        // Insert safety information into the database
        const query = 'INSERT INTO safety (description, location, contact, userid) VALUES (?, ?, ?, ?)';
        const values = [description, location, contact, userid];
        await mysqlPool.query(query, values);

        res.status(201).send({
            success: true,
            message: 'Safety information posted successfully'
        });
    } catch (error) {
        console.error('Error posting safety information:', error);
        res.status(500).send({
            success: false,
            message: 'Error while posting safety information',
            error: error.message
        });
    }
};



const getSafety = async (req, res) => {
    try {
        const { userid } = req.query;

        let query = 'SELECT * FROM safety';
        let values = [];

        if (userid) {
            query += ' WHERE userid = ?';
            values.push(userid);
        }

        const [rows] = await mysqlPool.query(query, values);

        res.status(200).send({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching safety information:', error);
        res.status(500).send({
            success: false,
            message: 'Error while fetching safety information',
            error: error.message
        });
    }
};

module.exports = { safety, getSafety };
