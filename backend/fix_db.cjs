const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'gowash',
  password: '1234',
  port: 5432,
});
client.connect()
  .then(() => client.query("UPDATE ride_assignments SET status = 'cancelled' WHERE order_id IN (31, 30, 29, 28, 27)"))
  .then(res => { console.log('Updated', res.rowCount); client.end(); })
  .catch(err => { console.error(err); client.end(); });
