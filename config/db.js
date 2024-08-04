const mysql = require('mysql2/promise');

const mysqlPool = mysql.createPool({
    host: 'mysql-3d845bb1-masif854380-f879.d.aivencloud.com',
    user: 'avnadmin',
    password: 'AVNS_oGWsXc87Z1-DuqIMGGE',
    port: 13683,
    database: 'trex'
});

module.exports = mysqlPool;
