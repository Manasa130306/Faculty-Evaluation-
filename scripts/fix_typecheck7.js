const fs = require('fs');

let ev = fs.readFileSync('src/app/actions/evaluation.ts', 'utf8');
ev = ev.replace(/const faculty = \(\[\] as any\[\]\)\.find\(\(f: any\) => f\.faculty_id === (.*?)\);/g, 'const faculty: any = { faculty_id: $1, name: "Unknown", designation: "Unknown", department: "Unknown" };');
ev = ev.replace(/const faculty = \[\]\.find\(\(f: any\) => f\.faculty_id === (.*?)\);/g, 'const faculty: any = { faculty_id: $1, name: "Unknown", designation: "Unknown", department: "Unknown" };');
fs.writeFileSync('src/app/actions/evaluation.ts', ev);

let ds = fs.readFileSync('src/lib/services/data-service.ts', 'utf8');
ds = ds.replace(/const facultyList: FacultyRecord\[\] = \[\];/g, 'const facultyList: any[] = [];');
ds = ds.replace(/const storedFaculty = getLocalData<FacultyRecord\[\]>\(STORAGE_KEYS\.FACULTY_MASTER, \[\] as any\[\]\);/g, 'const storedFaculty: any[] = [];');
fs.writeFileSync('src/lib/services/data-service.ts', ds);

console.log('Fixed');
