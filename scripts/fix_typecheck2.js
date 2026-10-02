const fs = require('fs');

let ev = fs.readFileSync('src/app/actions/evaluation.ts', 'utf8');
ev = ev.replace(/\[\]\.find\(\(f: any\) => f\.faculty_id ===/g, '([] as any[]).find((f: any) => f.faculty_id ===');
fs.writeFileSync('src/app/actions/evaluation.ts', ev);

let ds = fs.readFileSync('src/lib/services/data-service.ts', 'utf8');
ds = ds.replace(/import \{.*?\} from '\.\.\/constants\/facultyData';\n/g, '');
ds = ds.replace(/\(\(f\) => \(\{\n        id/g, '((f: any) => ({\n        id');
ds = ds.replace(/\(f\) => \!f\.faculty_id\.toUpperCase\(\)\.startsWith\('SAR_'\)/g, '(f: any) => !f.faculty_id.toUpperCase().startsWith(\'SAR_\')');
fs.writeFileSync('src/lib/services/data-service.ts', ds);

console.log('Fixed');
