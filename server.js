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
						for(let i = 0; i < code_list.length; i++) {
							if (row.code == code_list[i]) {
								codes[key.concat(code_list[i])] = row.incident_type;
							}
						}
					}
					else {
						codes[key.concat(row.code)] = row.incident_type;
					}
				})
			}		
			resolve(codes);
		});
	})
	.then(data=>{

		if(req.query.hasOwnProperty("format") && req.query.format.toLowerCase() === "xml") {
			res.type("xml").send(json2xml.parse("codes", data)); 
		}
		else {
			res.type('json').send(codes);
			console.log(codes);
		} 
	})

});

app.get('/neighborhoods', (req, res, next) => {
	let neighborhoods = {};
	let key = "N";

	var myPromise = new Promise ((resolve, reject) => {
		db.all('SELECT * FROM Neighborhoods ORDER BY neighborhood_number', (err,rows) => {
			if (err) {
				reject (err);
			} 
			else {
				rows.forEach(function (row){
					if(req.query.hasOwnProperty("id")) {
						var neighborhoodNumber_list =  req.query.id.split(',');
						for(let i = 0; i < neighborhoodNumber_list.length; i++) {
							if(row.neighborhood_number == neighborhoodNumber_list[i]) {
								neighborhoods[key.concat(neighborhoodNumber_list[i])] = row.neighborhood_name;
							}
						}
					}
					else {
						neighborhoods[key.concat(row.neighborhood_number)] = row.neighborhood_name;
					}
				})
			}
			resolve(neighborhoods);
		});
	})
	.then(data => {
		if(req.query.hasOwnProperty("format") && req.query.format.toLowerCase() === "xml") {
			res.type("xml").send(json2xml.parse("neighborhood", data)); 
		}
		else {
			res.type('json').send(neighborhoods);
			console.log(neighborhoods);
		} 
	})
});

app.get('/incidents', (req, res) => {
	let incidents = {};
	let key = "I";
	
	//Set start_date
	var has_start_date = false;
	if(req.query.hasOwnProperty("start_date")) {
		has_start_date = true;
		var start = new Date(req.query.start_date);
	}
	
	//Set end_date
	var has_end_date = false;
	if(req.query.hasOwnProperty("end_date")) {
		has_end_date = true;
		var end = new Date(req.query.end_date);
	}
	
	//Set code
	var has_code = false;
	if(req.query.hasOwnProperty("code")) {
		has_code = true;
		var query_codes = req.query.code.split(",");
	}
	
	//Set grid
	var has_grid = false;
	if(req.query.hasOwnProperty("grid")) {
		has_grid = true;
		var query_grids = req.query.grid.split(",");
	}
	
	//Set id
	var has_id = false;
	if(req.query.hasOwnProperty("id")) {
		has_id = true;
		var query_ids = req.query.id.split(",");
	}

	//Set limit
	var limit;
	if(req.query.hasOwnProperty("limit")) {
		limit=parseInt(req.query.limit);
	} else {
		limit=10000;
	}
	
	
	var myPromise = new Promise ((resolve,reject) => {
		db.all('SELECT * FROM Incidents ORDER BY date_time DESC ',(err,rows)=>{
			if (err) {
				reject (err);
			} else {
				let num_rows=Object.keys(rows).length;
				for(let i = 0; i < num_rows; i++) {
					let id=key.concat("",rows[i].case_number);
					incidents[id] = {};
					incidents[id]["date"]=rows[i].date_time.split("T")[0];
					incidents[id]["time"]=rows[i].date_time.split("T")[1];
					incidents[id]["code"]=rows[i].code;
					incidents[id]["incident"]=rows[i].incident;
					incidents[id]["police_grid"]=rows[i].police_grid;
					incidents[id]["neighborhood_number"]=rows[i].neighborhood_number;
					incidents[id]["block"]=rows[i].block;
					
					//Flag indicating this row has been removed from JSON output
					let deleted_json = false;
					
					//start_date
					if(has_start_date){
						let row_date = new Date(incidents[id].date);
						if(start>row_date) {
							delete incidents[id];
							deleted_json=true;
						}
					}
					
					//end_date
					if(has_end_date && !deleted_json){
						let row_date = new Date(incidents[id].date);
						if(end<row_date) {
							delete incidents[id];
							deleted_json=true;
						}
					}
					
					//code
					if(has_code && !deleted_json){
						let contains_target = false;
						query_codes.forEach(function (this_code) {
							if(parseInt(this_code)===incidents[id].code) {
								contains_target=true;
							}
						})
						if(!contains_target) {
							delete incidents[id];
							deleted_json=true;
						}
					}
					
					//grid
					if(has_grid && !deleted_json){
						let contains_target = false;
						query_grids.forEach(function (this_grid) {
							if(parseInt(this_grid)===incidents[id].police_grid) {
								contains_target=true;
							}
						})
						if(!contains_target) {
							delete incidents[id];
							deleted_json=true;
						}
					}
					
					//id
					if(has_id && !deleted_json){
						let contains_target = false;
						query_ids.forEach(function (this_id) {
							if(parseInt(this_id)===incidents[id].neighborhood_number) {
								contains_target=true;
							}
						})
						if(!contains_target) {
							delete incidents[id];
							deleted_json=true;
						}
					}
					
					//Check if limit has been reached
					if(Object.keys(incidents).length === limit) {
						break;
					}
				}
			}
			resolve(incidents);
		});
	})
	.then(data=>{
		let formatter = "json";

		if(req.query.hasOwnProperty("format") && req.query.format.toLowerCase() === "xml")
		{
			res.type("xml").send(json2xml.parse("codes", data)); 
		}
		else{
			res.type('json').send(incidents);
			console.log(incidents);
		} 
		
	})
});

app.put('/new-incident',(req, res) => {
	let new_incident = {
		case_number: req.body.case_number
	}
	
	if(req.body.hasOwnProperty("date")) {
        new_incident["date_time"] = req.body.date;
    }
    if(req.body.hasOwnProperty("time")) {
        new_incident["date_time"] = new_incident.date_time + "T" + req.body.time;
    }
    if(req.body.hasOwnProperty("code")) {
        new_incident["code"] = parseInt(req.body.code);
    }
    if(req.body.hasOwnProperty("incident")) {
        new_incident["incident"] = req.body.incident;
    }
    if(req.body.hasOwnProperty("police_grid")) {
        new_incident["police_grid"] = parseInt(req.body.police_grid);
    }
    if(req.body.hasOwnProperty("neighborhood_number")) {
        new_incident["neighborhood_number"] = parseInt(req.body.neighborhood_number);
    }
    if(req.body.hasOwnProperty("block")) {
        new_incident["block"] = req.body.block;
	}
	
	db.all("SELECT * FROM Incidents WHERE case_number = ?", [new_incident.case_number], (err, row) => {
		if (row.length > 0) {
            res.status(500).send("The case number already exists");
        }
        else if (err) {
            res.status(500).send("Error. Can't access the database");
		}
		else {
			db.run("INSERT INTO incidents VALUES (?, ?, ?, ?, ?, ?, ?)", [new_incident.case_number, new_incident.date_time, new_incident.code, new_incident.incident, new_incident.police_grid, new_incident.neighborhood_number, new_incident.block], (err) => {
        		if(err) {
					res.status(500).send("Error. Can't insert value into the database. "+err);
				}
				else {
					res.send("New incident added to the database");
				}
    		});
		}
    });
});

function WriteHtml(res, html) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(html);
    res.end();
}

var server = app.listen(port);