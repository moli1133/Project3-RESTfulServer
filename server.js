// Built-in Node.js modules
var fs = require('fs')
var path = require('path')
var url = require('url')

// NPM modules
var express = require('express');
var sqlite3 = require('sqlite3');
var bodyParser = require('body-parser');
var json2xml = require("js2xmlparser");


var public_dir = path.join(__dirname, 'public');
var db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

var app = express();
var port = 8000;

app.use(express.static(public_dir));
app.use(bodyParser.urlencoded({extended: true}));

var db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

app.get('/codes', (req, res, next) => {
	let codes = {};
	let key = "C";

	var myPromise = new Promise ((resolve, reject) => {
		db.all('SELECT * FROM Codes ORDER BY code', (err,rows) => {
			if (err) {
				reject(err);
			}
			else {
				rows.forEach(function (row) {                
					if (req.query.hasOwnProperty("code")) {				
						var code_list =  req.query.code.split(',');
						for(let i =0; i < code_list.length; i ++)
						{
							if (row.code == code_list[i]) {
								console.log("row code is:" + row.code);
								codes[key.concat("",code_list[i])] = row.incident_type;
							}
						}
					}
					else {
						codes[key.concat("",row.code)] = row.incident_type;
					}
				})
			}		
			resolve(codes);
		});
	})
	.then(data=>{

		if(req.query.hasOwnProperty("format") && req.query.format.toLowerCase() === "xml")
		{
			res.type("xml").send(json2xml.parse("codes", data)); 
		}
		else{
			res.type('json').send(codes);
			console.log(codes);
		} 
	})

});

app.get('/neighborhoods', (req, res, next) => {
	let neighborhoods = {};
	let key = "N";

	var myPromise = new Promise ((resolve,reject) => {
		db.all('SELECT * FROM Neighborhoods ORDER BY neighborhood_number',(err,rows)=>{
			if (err) {
				reject (err);
			} else {
				rows.forEach(function (row){
					if(req.query.hasOwnProperty("neighborhoodNumber")){
							
						var neighborhoodNumber_list =  req.query.code.split(',');
						for(let i =0; i < neighborhoodNumber_list.length; i ++)
						{
							if(row.neighborhood_number == neighborhoodNumber_list[i])
							{
								neighborhoods[key.concat("", neighborhoodNumber_list[i])] = row.neighborhood_name;
							}
						}
					}
					else{
						neighborhoods[key.concat("",row.neighborhood_number)] = row.neighborhood_name;
					}
	
				})
			}
			resolve(neighborhoods);
		});
	})
	.then(data=>{

		if(req.query.hasOwnProperty("format") && req.query.format.toLowerCase() === "xml")
		{
			res.type("xml").send(json2xml.parse("codes", data)); 
		}
		else{
			res.type('json').send(neighborhoods);
			console.log(neighborhoods);
		} 
	})
});

app.get('/incidents', (req, res, next) => {

});

app.put('/new-incident',(req,res) => {

});

function WriteHtml(res, html) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(html);
    res.end();
}

var server = app.listen(port);