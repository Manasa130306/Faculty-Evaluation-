const fs = require('fs');
let ds = fs.readFileSync('src/lib/services/data-service.ts', 'utf8');
ds = ds.replace(/        designation: f\.designation,\n      \}\)\),/g, '');
fs.writeFileSync('src/lib/services/data-service.ts', ds);
console.log('Fixed');
