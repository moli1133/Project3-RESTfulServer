var fs = require('fs');
var path = require('path');

var express = require('express');
var bodyParser = require('body-parser');
var sqlite3 = require('sqlite3')


var public_dir = path.join(__dirname, 'public');
var db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');
// open usenergy.sqlite3 database
var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});


//universal JSON object representing the codes table
var codes=convertCodes();

//universal JSON object representing the neighborhoods table
var neighborhoods;

//universal JSON object representing the incidents table
var incidents;

var app = express();
var port = 8000;
app.use(bodyParser.urlencoded({extended: true}));

//codes handler
app.get('/codes', (req, res) => {
    
});

//neighborhoods handler
app.get('/neighborhoods', (req, res) => {
    
});

//incidents handler
app.get('/incidents', (req, res) => {
    
});

//Converts Codes table into JSON object
function convertCodes (rows) {
	let sql = "SELECT * FROM Codes";
	db.all(sql, [], (err, rows) => {
		if (err) {
			throw err;
		}
		var converted_rows={};
		for(i=0; i<Object.keys(rows).length; i++) {
			converted_rows["C"+JSON.stringify(rows[i].code)]=JSON.stringify(rows[i].incident_type).replace(/\"/g, '');
		}
		console.log(JSON.stringify(converted_rows,null,2));
		return converted_rows;
		
	});
}
var server=app.listen(8000)
console.log("Now listening on port: "+port);