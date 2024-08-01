const fs = require('fs');
const path = require('path'); 
const mysqlPool = require('./db'); // Ensure you have this file properly set up

const loadSchema = async () => {
    try {
        const schemaPath = path.join(__dirname, './schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        const connection = await mysqlPool.getConnection();

        // Split the schema by the semicolon, ensuring each command is executed individually
        const schemaCommands = schema.split(';').map(cmd => cmd.trim()).filter(cmd => cmd);

        for (const command of schemaCommands) {
            await connection.query(command);
        }

        connection.release();

        console.log('Schema loaded successfully');
    } catch (err) {
        console.error('Error loading schema:', err);
    }
};

loadSchema();
