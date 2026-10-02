const fs = require('fs');

let ds = fs.readFileSync('src/lib/services/data-service.ts', 'utf8');
ds = ds.replace(/import \{ SERVICE_REGISTER_FACULTY, SAR_AUDIT_LOGS \} from '\.\.\/constants\/facultyData';\n/g, '');
ds = ds.replace(/SERVICE_REGISTER_FACULTY/g, '[]');
ds = ds.replace(/SAR_AUDIT_LOGS/g, '[]');
ds = ds.replace(/f\.faculty_id/g, 'f?.faculty_id');
fs.writeFileSync('src/lib/services/data-service.ts', ds);

let ev = fs.readFileSync('src/app/actions/evaluation.ts', 'utf8');
ev = ev.replace(/const faculty = \[\]\.find\(\(f: any\) => f\.faculty_id === (.*?)\);/g, 'const faculty: any = { faculty_id: $1, name: "Unknown", designation: "Unknown", department: "Unknown" };');
ev = ev.replace(/const faculty = \(\[\] as any\[\]\)\.find\(\(f: any\) => f\.faculty_id === (.*?)\);/g, 'const faculty: any = { faculty_id: $1, name: "Unknown", designation: "Unknown", department: "Unknown" };');
ev = ev.replace(/const faculty = \[\]\.find\(\(f: any\) => f\.faculty_id === (.*?)\) \/\/ /g, 'const faculty: any = { faculty_id: $1, name: "Unknown", designation: "Unknown", department: "Unknown" };');
fs.writeFileSync('src/app/actions/evaluation.ts', ev);

console.log('Fixed');
