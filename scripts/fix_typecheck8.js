const fs = require('fs');

let ds = fs.readFileSync('src/lib/services/data-service.ts', 'utf8');
ds = ds.replace(/      \.\.\.\[\]\.map\(\(f\) => \(\{\n        id: `prof_\$\{f\?\.faculty_id\}`,\n        faculty_id: f\?\.faculty_id,\n        name: f\.name,\n        department: f\.department,\n        designation: f\.designation,\n        role: 'faculty' as const,\n      \}\)\),/g, '');
ds = ds.replace(/      \.\.\.\[\]\.map\(\(f\) => \(\{\n        id: `prof_\$\{f\.faculty_id\}`,\n        faculty_id: f\.faculty_id,\n        name: f\.name,\n        department: f\.department,\n        designation: f\.designation,\n        role: 'faculty' as const,\n      \}\)\),/g, '');
ds = ds.replace(/const storedFaculty = getLocalData<FacultyRecord\[\]>\(STORAGE_KEYS\.FACULTY_MASTER, \[\]\);/g, 'const storedFaculty: any[] = [];');
ds = ds.replace(/const storedFaculty = getLocalData<FacultyRecord\[\]>\(STORAGE_KEYS\.FACULTY_MASTER, \[\] as any\[\]\);/g, 'const storedFaculty: any[] = [];');

// fix lines 68-75 directly if needed
const lines = ds.split('\n');
const newLines = lines.filter((line, i) => {
  if (i >= 67 && i <= 74) {
    if (line.includes('...[].map') || line.includes('faculty_id') || line.includes('department') || line.includes('role: \'faculty\'') || line.includes('name: f.name')) {
      return false;
    }
  }
  return true;
});
ds = newLines.join('\n');
fs.writeFileSync('src/lib/services/data-service.ts', ds);

let ev = fs.readFileSync('src/app/actions/evaluation.ts', 'utf8');
ev = ev.replace(/const faculty = \[\]\.find\(\(f: any\) => f\.faculty_id === (.*?)\);/g, 'const faculty: any = null;');
ev = ev.replace(/const faculty = \(\[\] as any\[\]\)\.find\(\(f: any\) => f\.faculty_id === (.*?)\);/g, 'const faculty: any = null;');
ev = ev.replace(/const faculty: any = \{ faculty_id: (.*?), name: "Unknown", designation: "Unknown", department: "Unknown" \};/g, 'const faculty: any = null;');
fs.writeFileSync('src/app/actions/evaluation.ts', ev);

console.log('Fixed');
