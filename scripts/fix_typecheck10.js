const fs = require('fs');

let ds = fs.readFileSync('src/lib/services/data-service.ts', 'utf8');

// I need to replace lines 68 and 69 with empty strings.
// Right now they are:
//         designation: f.designation,
//       })),
//     ];

ds = ds.replace(/        designation: f\.designation,\n      \}\)\),\n/g, '');

fs.writeFileSync('src/lib/services/data-service.ts', ds);
console.log('Fixed line 68');
