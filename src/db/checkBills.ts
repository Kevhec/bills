import db from './index.js';

const bills = db.prepare('SELECT * FROM bills').all();
console.log(`Total bills: ${bills.length}`);
console.table(bills);
