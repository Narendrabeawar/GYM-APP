const fs = require('fs');
const path = require('path');

// Read the setup SQL file
const setupSQL = fs.readFileSync(path.join(__dirname, 'db', 'setup.sql'), 'utf8');

console.log('Database Setup SQL:');
console.log('===================');
console.log('');
console.log('Please run the following SQL in your Supabase SQL editor:');
console.log('');
console.log(setupSQL);
console.log('');
console.log('===================');
console.log('After running this SQL, the enquiries table will be created and the error should be resolved.');
