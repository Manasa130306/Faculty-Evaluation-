const fs = require('fs');

let ev = fs.readFileSync('src/app/actions/evaluation.ts', 'utf8');
ev = ev.replace(/const recordsToInsert = \[\]\.map\(/g, 'const recordsToInsert = ([] as any[]).map(');
ev = ev.replace(/const faculty = \[\]\.find\(/g, 'const faculty = ([] as any[]).find(');
fs.writeFileSync('src/app/actions/evaluation.ts', ev);

let ds = fs.readFileSync('src/lib/services/data-service.ts', 'utf8');
ds = ds.replace(/      \.\.\.\[\]\.map\(\(f: any\)/g, '      ...([] as any[]).map((f: any)');
ds = ds.replace(/const facultyList = storedFaculty\.filter\(\(f: any\)/g, 'const facultyList = storedFaculty.filter((f: any)');
ds = ds.replace(/const storedFaculty = getLocalData<FacultyRecord\[\]>\(STORAGE_KEYS\.FACULTY_MASTER, \[\]\);/g, 'const storedFaculty = getLocalData<FacultyRecord[]>(STORAGE_KEYS.FACULTY_MASTER, [] as any[]);');
fs.writeFileSync('src/lib/services/data-service.ts', ds);

console.log('Fixed');
