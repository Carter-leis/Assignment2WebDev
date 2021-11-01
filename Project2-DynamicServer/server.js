// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');


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
        else
        {
            let response = template.replace("{{{YEAR}}}", req.params.selected_year);
            response = response.replace("{{{CONTENT HERE}}}", req.params.selected_year);

            db.all('select * from Consumption where year = ?', [req.params.selected_year], (err, rows) => {
                let i;
                let table_items = '';
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
                }
                response = response.replace("{{{TABLE HERE}}}", table_items);
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
        if(err)
        {
            res.status(404).send('Error: file not found');
        }
        else
        {
            let response = template.replace("{{{STATE}}}", req.params.selected_state);
            response = response.replace("{{{CONTENT HERE}}}", req.params.selected_state);

            db.all('select * from Consumption where state_abbreviation = ?', [req.params.selected_state], (err, rows) => {
                let i;
                let table_items = '';
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
                }
                response = response.replace("{{{TABLE HERE}}}", table_items);
                res.status(200).type('html').send(response); // <-- you may need to change this
            });
        }
    });
});

// GET request handler for '/energy/*'
app.get('/energy/:selected_energy_source', (req, res) => {
    console.log(req.params.selected_energy_source);
    fs.readFile(path.join(template_dir, 'energy.html'), "utf-8", (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database
        if(err)
        {
            res.status(404).send('Error: file not found');
        }
        else
        {
            let energy = req.params.selected_energy_source;
            if( energy == "coal")
            {
                let response = template.replace("{{{ENERGY TYPE}}}", req.params.selected_energy_source);
                response = response.replace("{{{CONTENT HERE}}}", req.params.selected_energy_source);
                
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
                    response = response.replace("{{{TABLE HERE}}}", table_items);
                    res.status(200).type('html').send(response); // <-- you may need to change this
                });
            }
        }
    });
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
