const fs = require('fs');

// Fix evaluation.ts
let evContent = fs.readFileSync('src/app/actions/evaluation.ts', 'utf8');
evContent = evContent.replace(/SERVICE_REGISTER_FACULTY\.find\(\(f\) => f\.faculty_id === (.*?)\)/g, 'null'); // Placeholder, or replace with DB fetch. Actually, this is Server Action, it should query DB.
fs.writeFileSync('src/app/actions/evaluation.ts', evContent);

// Fix route.ts
let routeContent = fs.readFileSync('src/app/api/debug/route.ts', 'utf8');
routeContent = routeContent.replace(/const localCount = SERVICE_REGISTER_FACULTY\.length;/g, 'const localCount = 0;');
fs.writeFileSync('src/app/api/debug/route.ts', routeContent);

// Fix data-service.ts
let dsContent = fs.readFileSync('src/lib/services/data-service.ts', 'utf8');
dsContent = dsContent.replace(/import \{ SERVICE_REGISTER_FACULTY, ADMIN_CONFIRMATION_IDS \} from '\.\.\/constants\/facultyData';\n/g, '');
dsContent = dsContent.replace(/const PRODUCTION_FACULTY_ID_SET = new Set\(\n  SERVICE_REGISTER_FACULTY\.map\(\(f\) => f\.faculty_id\.toUpperCase\(\)\)\n\);/g, 'const PRODUCTION_FACULTY_ID_SET = new Set<string>();');
dsContent = dsContent.replace(/      \.\.\.SERVICE_REGISTER_FACULTY\.map\(\(f\) => \(\{\n        id: `prof_\$\{f\.faculty_id\}`,[\s\S]*?      \}\)\),\n/g, '');

dsContent = dsContent.replace(/\/\/ Only fallback if Supabase is NOT configured \([\s\S]*?const storedFaculty = getLocalData<FacultyRecord\[\]>\(STORAGE_KEYS\.FACULTY_MASTER, SERVICE_REGISTER_FACULTY\);\n    const facultyList = storedFaculty\.filter\(\(f\) => \!f\.faculty_id\.toUpperCase\(\)\.startsWith\('SAR_'\)\);\n    \n    if \(facultyList\.length > 0\) \{\n      cachedFaculty = facultyList;\n      cachedFacultyTime = Date\.now\(\);\n    \}\n    return facultyList;/, '// No local fallback\\n    if (cachedFaculty && cachedFaculty.length > 0) return cachedFaculty;\\n    return [];');
dsContent = dsContent.replace(/    const facultyMaster = getLocalData<FacultyRecord\[\]>\(STORAGE_KEYS\.FACULTY_MASTER, SERVICE_REGISTER_FACULTY\);\n/g, '    const facultyMaster: FacultyRecord[] = [];\n');
dsContent = dsContent.replace(/    const facultyList = getLocalData<FacultyRecord\[\]>\(STORAGE_KEYS\.FACULTY_MASTER, SERVICE_REGISTER_FACULTY\);\n/g, '    const facultyList: FacultyRecord[] = [];\n');

fs.writeFileSync('src/lib/services/data-service.ts', dsContent);
