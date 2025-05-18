const mysql = require("mysql2");
require("dotenv").config();

const dbConfig = {
    host: process.env.MYSQL_HOSTNAME || "localhost",
    user: process.env.MYSQL_USERNAME || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DB_NAME || "makuch_cinema_app"
};

const db = mysql.createPool(dbConfig);

// Test database connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL Database:', err);
        process.exit(1);
    }
    console.log("Connected to MySQL Database");
    connection.release();
});

module.exports = db;