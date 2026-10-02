const fs = require('fs');

let ev = fs.readFileSync('src/app/actions/evaluation.ts', 'utf8');
ev = ev.replace(/const recordsToInsert = \[\]\.map\(\(f\) => \(\{\n      faculty_id: f\.faculty_id\.toUpperCase\(\),\n      name: f\.name,\n      designation: f\.designation,\n      department: f\.department,\n    \}\)\);/g, 'const recordsToInsert: any[] = [];');
ev = ev.replace(/const faculty = \[\]\.find\(\(f: any\) => f\.faculty_id === /g, 'const faculty: any = null; // ');
fs.writeFileSync('src/app/actions/evaluation.ts', ev);

let ds = fs.readFileSync('src/lib/services/data-service.ts', 'utf8');
ds = ds.replace(/import \{.*?\} from '\.\.\/constants\/facultyData';\n/g, '');
ds = ds.replace(/const facultyList = storedFaculty\.filter\(\(f: any\) => \!f\.faculty_id\.toUpperCase\(\)\.startsWith\('SAR_'\)\);/g, 'const facultyList: any[] = [];');
fs.writeFileSync('src/lib/services/data-service.ts', ds);

console.log('Fixed');
