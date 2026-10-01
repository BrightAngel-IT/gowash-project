const { Pool } = require('pg'); 
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'gowash', password: 'password', port: 5432 }); 
pool.query("SELECT * FROM orders WHERE status IN ('Pending', 'Ready')").then(res => { 
  console.log(JSON.stringify(res.rows, null, 2)); 
  pool.end(); 
});
