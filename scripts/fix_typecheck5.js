const fs = require('fs');

let ds = fs.readFileSync('src/lib/services/data-service.ts', 'utf8');
ds = ds.replace(/import \{.*?\} from '\.\.\/constants\/facultyData';\n?/g, '');
ds = ds.replace(/import \{ \} from '\.\.\/constants\/facultyData';\n?/g, '');
ds = ds.replace(/import \{\s*\} from '\.\.\/constants\/facultyData';\n?/g, '');

fs.writeFileSync('src/lib/services/data-service.ts', ds);

console.log('Fixed');
