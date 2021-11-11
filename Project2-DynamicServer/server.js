// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');
const { table } = require('console');


let public_dir = path.join(__dirname, 'public');
let template_dir = path.join(__dirname, 'templates');
let db_filename = path.join(__dirname, 'db', 'usenergy.sqlite3');

let app = express();
let port = 8000;

// Open usenergy.sqlite3 database
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

// Serve static files from 'public' directory
app.use(express.static(public_dir));


// GET request handler for home page '/' (redirect to /year/2018)
app.get('/', (req, res) => {
    res.redirect('/year/2018');
});

// GET request handler for '/year/*'
app.get('/year/:selected_year', (req, res) => {
    fs.readFile(path.join(template_dir, 'year.html'), "utf-8", (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database
        if(err)
        {
            res.status(404).send('Error: file not found');
        }
        if(req.params.selected_year < 1960 || req.params.selected_year > 2018)
        {
            res.status(404).send('Error: No data for year: '+req.params.selected_year);
        }
        else
        {
            let response = template.replace("{{{YEAR}}}", req.params.selected_year);
            response = response.replace("{{{CONTENT HERE}}}", req.params.selected_year);

            db.all('select * from Consumption where year = ?', [req.params.selected_year], (err, rows) => {
                let i;
                let table_items = '';
                let totalCoal = 0;
                let totalNatural_gas = 0;
                let totalNuclear = 0;
                let totalPetroleum = 0;
                let totalRenewable = 0;
                for(i=0; i <= 50; i++)
                {
                    table_items += '<tr>\n';
                    table_items += '<td>' + rows[i].state_abbreviation + '</td>\n';
                    table_items += '<td>' + rows[i].coal + '</td>\n';
                    table_items += '<td>' + rows[i].natural_gas+ '</td>\n';
                    table_items += '<td>' + rows[i].nuclear + '</td>\n';
                    table_items += '<td>' + rows[i].petroleum+ '</td>\n';
                    table_items += '<td>' + rows[i].renewable + '</td>\n';
                    table_items += '<td>' + (parseInt(rows[i].coal) + parseInt(rows[i].natural_gas) + parseInt(rows[i].nuclear) + parseInt(rows[i].petroleum) + parseInt(rows[i].renewable)) + '</td>\n';
                    table_items += '</tr>\n';

                    totalCoal += parseInt(rows[i].coal);
                    totalNatural_gas += parseInt(rows[i].natural_gas);
                    totalNuclear += parseInt(rows[i].nuclear);
                    totalPetroleum += parseInt(rows[i].petroleum);
                    totalRenewable += parseInt(rows[i].renewable);
                }
                response = response.replace("{{{TABLE HERE}}}", table_items);
                response = response.replace("{{{COAL_COUNT}}}", totalCoal);
                response = response.replace("{{{NATURAL_GAS_COUNT}}}", totalNatural_gas);
                response = response.replace("{{{NUCLEAR_COUNT}}}", totalNuclear);
                response = response.replace("{{{PETROLEUM_COUNT}}}", totalPetroleum);
                response = response.replace("{{{RENEWABLE_COUNT}}}", totalRenewable);
                console.log(response);
                res.status(200).type('html').send(response); // <-- you may need to change this
            });
        }
        
    });
});

// GET request handler for '/state/*'
app.get('/state/:selected_state', (req, res) => {
    fs.readFile(path.join(template_dir, 'state.html'), "utf-8", (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database
        var statesAval = ['AK','AL','AR','AZ','CA','CO','CT','DC','DE','FL','GA','HI','IA','ID','IL','IN','KS','KY','LA','MA','MD','ME','MI','MN','MO','MS','MT','NC','ND','NE','NH','NJ','NM','NV','NY','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VA','VT','WA','WI','WV','WY'];
        for(var i = 0; i<statesAval.length; i++){
            if(statesAval[i] == req.params.selected_state){
                var nextState = statesAval[i+1];
                var prevState = statesAval[i-1];
            }
        }
        if(err)
        {
            res.status(404).send('Error: file not found');
        }
        else
        {
            if(req.params.selected_state.length > 2) {
                db.get('SELECT * from States where UPPER(state_name) = ?',[req.params.selected_state.toUpperCase()],(err,row) => {
                    if(row === undefined){
                        res.status(404).send('ERROR: State ' + req.params.selected_state + ' does not exist');
                    } else {
                        let state_name = row.state_name;
                        let response = template.replace('{{{STATE}}}', state_name);
                        response = response.replace('{{{CONTENT HERE}}}', state_name);
                        var imgStr = "<img src= '../css/pictures/" + row.state_abbreviation + ".png' alt='" + state_name +"'>";
                        response = response.replace("{{{INSERT PIC}}}", imgStr);
                        db.all('SELECT * FROM Consumption WHERE state_abbreviation = ? ORDER BY year', [row.state_abbreviation], (err,rows) => {
                            if(err) {
                                res.status(404).send('ERROR: A mistake was made!');
                            } else {
                                let i;
                                let table_items = '';
                                let totalCoal = [];
                                let totalNatural_gas = [];
                                let totalNuclear = [];
                                let totalPetroleum = [];
                                let totalRenewable = [];
                                for(i=0; i <= 58; i++)
                                {
                                    table_items += '<tr>\n';
                                    table_items += '<td>' + rows[i].year + '</td>\n';
                                    table_items += '<td>' + rows[i].coal + '</td>\n';
                                    table_items += '<td>' + rows[i].natural_gas+ '</td>\n';
                                    table_items += '<td>' + rows[i].nuclear + '</td>\n';
                                    table_items += '<td>' + rows[i].petroleum+ '</td>\n';
                                    table_items += '<td>' + rows[i].renewable + '</td>\n';
                                    table_items += '<td>' + (parseInt(rows[i].coal) + parseInt(rows[i].natural_gas) + parseInt(rows[i].nuclear) + parseInt(rows[i].petroleum) + parseInt(rows[i].renewable)) + '</td>\n';
                                    table_items += '</tr>\n';
                
                                    totalCoal.push(parseInt(rows[i].coal));
                                    totalNatural_gas.push(parseInt(rows[i].natural_gas));
                                    totalNuclear.push(parseInt(rows[i].nuclear));
                                    totalPetroleum.push(parseInt(rows[i].petroleum));
                                    totalRenewable.push(parseInt(rows[i].renewable));
                                }
                                response = response.replace("{{{TABLE HERE}}}", table_items);
                                response = response.replace("{{{COAL_COUNTS}}}", totalCoal);
                                response = response.replace("{{{NATURAL_GAS_COUNTS}}}", totalNatural_gas);
                                response = response.replace("{{{NUCLEAR_COUNTS}}}", totalNuclear);
                                response = response.replace("{{{PETROLEUM_COUNTS}}}", totalPetroleum);
                                response = response.replace("{{{RENEWABLE_COUNTS}}}", totalRenewable);
                                response = response.replace("{{{NEXT}}}", nextState);
                                response = response.replace("{{{PREV}}}", prevState);
                                res.status(200).type('html').send(response);
                            }
                        });
                    }
                });
            } else {
                let state_abbr = req.params.selected_state.toUpperCase();
                db.all('select * from Consumption where state_abbreviation = ? order by year', [state_abbr], (err, rows) => {
                    if (!statesAval.includes(state_abbr)) {
                        res.status(404).send('ERROR: State ' + state_abbr + ' does not exist!');
                    } else {
                        let i;
                        let table_items = '';
                        let totalCoal = [];
                        let totalNatural_gas = [];
                        let totalNuclear = [];
                        let totalPetroleum = [];
                        let totalRenewable = [];
                        for(i=0; i <= 58; i++)
                        {
                            table_items += '<tr>\n';
                            table_items += '<td>' + rows[i].year + '</td>\n';
                            table_items += '<td>' + rows[i].coal + '</td>\n';
                            table_items += '<td>' + rows[i].natural_gas+ '</td>\n';
                            table_items += '<td>' + rows[i].nuclear + '</td>\n';
                            table_items += '<td>' + rows[i].petroleum+ '</td>\n';
                            table_items += '<td>' + rows[i].renewable + '</td>\n';
                            table_items += '<td>' + (parseInt(rows[i].coal) + parseInt(rows[i].natural_gas) + parseInt(rows[i].nuclear) + parseInt(rows[i].petroleum) + parseInt(rows[i].renewable)) + '</td>\n';
                            table_items += '</tr>\n';
                
                            totalCoal.push(parseInt(rows[i].coal));
                            totalNatural_gas.push(parseInt(rows[i].natural_gas));
                            totalNuclear.push(parseInt(rows[i].nuclear));
                            totalPetroleum.push(parseInt(rows[i].petroleum));
                            totalRenewable.push(parseInt(rows[i].renewable));
                        }
                        let response = template.replace("{{{TABLE HERE}}}", table_items);
                        response = response.replace("{{{COAL_COUNTS}}}", totalCoal);
                        response = response.replace("{{{NATURAL_GAS_COUNTS}}}", totalNatural_gas);
                        response = response.replace("{{{NUCLEAR_COUNTS}}}", totalNuclear);
                        response = response.replace("{{{PETROLEUM_COUNTS}}}", totalPetroleum);
                        response = response.replace("{{{RENEWABLE_COUNTS}}}", totalRenewable);
                        response = response.replace("{{{NEXT}}}", nextState);
                        response = response.replace("{{{PREV}}}", prevState);
                        var imgStr = "<img src= '../css/pictures/" + state_abbr + ".png' alt='" + state_abbr + "'>";
                        response = response.replace("{{{INSERT PIC}}}", imgStr);
                        db.get('SELECT state_name from States where state_abbreviation = ?', [state_abbr], (err,row) => {
                            if(err) {
                                res.status(404).send('ERROR: This code doesn\'t work properly!');
                            } else {
                                response = response.replace("{{{STATE}}}", row.state_name);
                                response = response.replace("{{{CONTENT HERE}}}", row.state_name);
                                res.status(200).type('html').send(response); // <-- you may need to change this
                            }
                        });
                    }
                });
            }
        }
    });
});

// GET request handler for '/energy/*'
app.get('/energy/:selected_energy_source', (req, res) => {
    console.log(req.params.selected_energy_source);
    fs.readFile(path.join(template_dir, 'energy.html'), "utf-8", (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database
        var energy = ['nuclear', 'renewable', 'coal', 'petroleum', 'natural gas'];
        for(var i = 0; i<energy.length; i++){
            if(energy[i] == req.params.selected_energy_source){
                var nextEnergy = energy[i+1];
                var prevEnergy = energy[i-1];
            }
        }
        if(err)
        {
            res.status(404).send('Error: file not found');
        }
        if(!energy.includes(req.params.selected_energy_source.toLowerCase()))
        {
            res.status(404).send('Error: No data for energy source: '+ req.params.selected_energy_source);
        }
        else
        {
            let energy = req.params.selected_energy_source;
            let energy_table = '';
            var imgStr = "<img src= '../css/pictures/" + energy.toLowerCase() + ".png' alt='" + energy + "'>";
            let response = template.replace("{{{INSERT PIC}}}", imgStr);
            response = response.replace("{{{NEXT}}}", nextEnergy);
            response = response.replace("{{{PREV}}}", prevEnergy);
            if( energy.toLowerCase() == "coal")
            {
                response = response.replace("{{{ENERGY_TYPE}}}", req.params.selected_energy_source);
                response = response.replace("{{{CONTENT HERE}}}", "Coal");
                
                db.all('select state_abbreviation,year,coal from Consumption order by year, state_abbreviation', (err, rows) => {
                    let i;
                    let table_items = '';
                    
                    table_items += '<tr>\n' +'<th> year </th>\n';
                    for(i=0; i <= 50; i++)
                    {
                        table_items += '<th>' + rows[i].state_abbreviation + '</th>\n';
                    }
                    table_items += '<tr>\n';
                    for(i=0; i<=58; i++)
                    {
                        table_items += '<tr>\n';
                        table_items += '<td>' + rows[i*51].year + '</td>\n';
                        for(j=0; j<=50;j++) {
                            table_items += '<td>' + rows[i*51+j].coal+ '</td>\n';
                        }
                        table_items += '</tr>\n'
                    }
                    
                    energy_table += '{';
                    for(i=0; i<=50; i++) {
                        energy_table +=  rows[i].state_abbreviation + ': ['
                        for(j=0;j<=58;j++){
                            energy_table += rows[i+j*51].coal;
                            if(j !=58) {
                                energy_table += ', '
                            } else {
                                energy_table += ']'
                            }
                        }
                        if(i != 50) {
                            energy_table += ', '
                        } else {
                            energy_table += '}'
                        }
                    }
                    response = response.replace("{{{TABLE HERE}}}", table_items);
                    response = response.replace("{{{ENERGY_COUNTS}}}",energy_table);
                    res.status(200).type('html').send(response); // <-- you may need to change this
                });
            }
            if( energy.toLowerCase() == "natural gas")
            {
                response = response.replace("{{{ENERGY_TYPE}}}", req.params.selected_energy_source);
                response = response.replace("{{{CONTENT HERE}}}", "Natural Gas");
                
                db.all('select state_abbreviation,year,natural_gas from Consumption order by year, state_abbreviation', (err, rows) => {
                    let i;
                    let table_items = '';
                    
                    table_items += '<tr>\n' +'<th> year </th>\n';
                    for(i=0; i <= 50; i++)
                    {
                        table_items += '<th>' + rows[i].state_abbreviation + '</th>\n';
                    }
                    table_items += '<tr>\n';
                    for(i=0; i<=58; i++)
                    {
                        table_items += '<tr>\n';
                        table_items += '<td>' + rows[i*51].year + '</td>\n';
                        for(j=0; j<=50;j++) {
                            table_items += '<td>' + rows[i*51+j].natural_gas+ '</td>\n';
                        }
                        table_items += '</tr>\n'
                    }
                    
                    energy_table += '{';
                    for(i=0; i<=50; i++) {
                        energy_table +=  rows[i].state_abbreviation + ': ['
                        for(j=0;j<=58;j++){
                            energy_table += rows[i+j*51].natural_gas;
                            if(j !=58) {
                                energy_table += ', '
                            } else {
                                energy_table += ']'
                            }
                        }
                        if(i != 50) {
                            energy_table += ', '
                        } else {
                            energy_table += '}'
                        }
                    }
                    response = response.replace("{{{TABLE HERE}}}", table_items);
                    response = response.replace("{{{ENERGY_COUNTS}}}",energy_table);
                    res.status(200).type('html').send(response); // <-- you may need to change this
                });
            }
            if( energy.toLowerCase() == "nuclear")
            {
                response = response.replace("{{{ENERGY_TYPE}}}", req.params.selected_energy_source);
                response = response.replace("{{{CONTENT HERE}}}", "Nuclear");
                
                db.all('select state_abbreviation,year,nuclear from Consumption order by year, state_abbreviation', (err, rows) => {
                    let i;
                    let table_items = '';
                    
                    table_items += '<tr>\n' +'<th> year </th>\n';
                    for(i=0; i <= 50; i++)
                    {
                        table_items += '<th>' + rows[i].state_abbreviation + '</th>\n';
                    }
                    table_items += '<tr>\n';
                    for(i=0; i<=58; i++)
                    {
                        table_items += '<tr>\n';
                        table_items += '<td>' + rows[i*51].year + '</td>\n';
                        for(j=0; j<=50;j++) {
                            table_items += '<td>' + rows[i*51+j].nuclear+ '</td>\n';
                        }
                        table_items += '</tr>\n'
                    }
                    
                    energy_table += '{';
                    for(i=0; i<=50; i++) {
                        energy_table +=  rows[i].state_abbreviation + ': ['
                        for(j=0;j<=58;j++){
                            energy_table += rows[i+j*51].nuclear;
                            if(j !=58) {
                                energy_table += ', '
                            } else {
                                energy_table += ']'
                            }
                        }
                        if(i != 50) {
                            energy_table += ', '
                        } else {
                            energy_table += '}'
                        }
                    }
                    response = response.replace("{{{TABLE HERE}}}", table_items);
                    response = response.replace("{{{ENERGY_COUNTS}}}",energy_table);
                    res.status(200).type('html').send(response); // <-- you may need to change this
                });
            }
            if( energy.toLowerCase() == "petroleum")
            {
                response = response.replace("{{{ENERGY_TYPE}}}", req.params.selected_energy_source);
                response = response.replace("{{{CONTENT HERE}}}", "Petroleum");
                
                db.all('select state_abbreviation,year,petroleum from Consumption order by year, state_abbreviation', (err, rows) => {
                    let i;
                    let table_items = '';
                    
                    table_items += '<tr>\n' +'<th> year </th>\n';
                    for(i=0; i <= 50; i++)
                    {
                        table_items += '<th>' + rows[i].state_abbreviation + '</th>\n';
                    }
                    table_items += '<tr>\n';
                    for(i=0; i<=58; i++)
                    {
                        table_items += '<tr>\n';
                        table_items += '<td>' + rows[i*51].year + '</td>\n';
                        for(j=0; j<=50;j++) {
                            table_items += '<td>' + rows[i*51+j].petroleum+ '</td>\n';
                        }
                        table_items += '</tr>\n'
                    }
                    
                    energy_table += '{';
                    for(i=0; i<=50; i++) {
                        energy_table +=  rows[i].state_abbreviation + ': ['
                        for(j=0;j<=58;j++){
                            energy_table += rows[i+j*51].petroleum;
                            if(j !=58) {
                                energy_table += ', '
                            } else {
                                energy_table += ']'
                            }
                        }
                        if(i != 50) {
                            energy_table += ', '
                        } else {
                            energy_table += '}'
                        }
                    }
                    response = response.replace("{{{TABLE HERE}}}", table_items);
                    response = response.replace("{{{ENERGY_COUNTS}}}",energy_table);
                    res.status(200).type('html').send(response); // <-- you may need to change this
                });
            }
            if( energy.toLowerCase() == "renewable")
            {
                response = response.replace("{{{ENERGY_TYPE}}}", req.params.selected_energy_source);
                response = response.replace("{{{CONTENT HERE}}}", "Renewable");
                
                db.all('select state_abbreviation,year,renewable from Consumption order by year, state_abbreviation', (err, rows) => {
                    let i;
                    let table_items = '';
                    
                    table_items += '<tr>\n' +'<th> year </th>\n';
                    for(i=0; i <= 50; i++)
                    {
                        table_items += '<th>' + rows[i].state_abbreviation + '</th>\n';
                    }
                    table_items += '<tr>\n';
                    for(i=0; i<=58; i++)
                    {
                        table_items += '<tr>\n';
                        table_items += '<td>' + rows[i*51].year + '</td>\n';
                        for(j=0; j<=50;j++) {
                            table_items += '<td>' + rows[i*51+j].renewable+ '</td>\n';
                        }
                        table_items += '</tr>\n'
                    }
                    
                    energy_table += '{';
                    for(i=0; i<=50; i++) {
                        energy_table +=  rows[i].state_abbreviation + ': ['
                        for(j=0;j<=58;j++){
                            energy_table += rows[i+j*51].renewable;
                            if(j !=58) {
                                energy_table += ', '
                            } else {
                                energy_table += ']'
                            }
                        }
                        if(i != 50) {
                            energy_table += ', '
                        } else {
                            energy_table += '}'
                        }
                    }
                    response = response.replace("{{{TABLE HERE}}}", table_items);
                    response = response.replace("{{{ENERGY_COUNTS}}}",energy_table);
                    res.status(200).type('html').send(response); // <-- you may need to change this
                });
            }
        }
    });
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
