const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const app = express();
const path = require('path');

require('dotenv').config();

const server = require('http').createServer(app);

module.exports.openDb = async () => {
    return open({
        filename: './db/geo_database.db',
        driver: sqlite3.Database
    })
}


const publicPath = path.resolve(__dirname, 'public');
app.use(express.json());
app.use(express.static(publicPath));


app.use('/api', require('./routes/dijkstra'));



server.listen(process.env.PORT, (err) => {
    if (err) throw new Error(err);
    console.log('Server running on port', process.env.PORT);
})