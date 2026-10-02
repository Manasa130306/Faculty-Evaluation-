const fs = require('fs');

let content = fs.readFileSync('src/lib/services/data-service.ts', 'utf8');

// 1. Remove import
content = content.replace(/import \{ SERVICE_REGISTER_FACULTY, ADMIN_CONFIRMATION_IDS \} from '\.\.\/constants\/facultyData';\n/, '');

// 2. Remove FACULTY_MASTER from STORAGE_KEYS
content = content.replace(/  FACULTY_MASTER: 'nsriet_faculty_master_v3',\n/, '');

// 3. Remove initDefaultStorage logic
content = content.replace(/\/\/ Initialize Faculty Master \(56 authoritative faculty\)\n  if \(\!localStorage\.getItem\(STORAGE_KEYS\.FACULTY_MASTER\)\) \{\n    localStorage\.setItem\(STORAGE_KEYS\.FACULTY_MASTER, JSON\.stringify\(SERVICE_REGISTER_FACULTY\)\);\n  \}\n/, '');

// 4. Update init profiles
content = content.replace(/      \.\.\.SERVICE_REGISTER_FACULTY\.map\(\(f\) => \(\{\n        id: `prof_\$\{f\.faculty_id\}`,[\s\S]*?      \}\)\),\n/, '');

// 5. PRODUCTION_FACULTY_ID_SET
content = content.replace(/const PRODUCTION_FACULTY_ID_SET = new Set\(\n  SERVICE_REGISTER_FACULTY\.map\(\(f\) => f\.faculty_id\.toUpperCase\(\)\)\n\);/, 'const PRODUCTION_FACULTY_ID_SET = new Set<string>();');

// 6. Remove localStorage fallbacks in getallFaculty
content = content.replace(/\/\/ Only fallback if Supabase is NOT configured \([\s\S]*?const storedFaculty = getLocalData<FacultyRecord\[\]>\(STORAGE_KEYS\.FACULTY_MASTER, SERVICE_REGISTER_FACULTY\);\n    const facultyList = storedFaculty\.filter\(\(f\) => \!f\.faculty_id\.toUpperCase\(\)\.startsWith\('SAR_'\)\);\n    \n    if \(facultyList\.length > 0\) \{\n      cachedFaculty = facultyList;\n      cachedFacultyTime = Date\.now\(\);\n    \}\n    return facultyList;/, '// No local fallback\\n    if (cachedFaculty && cachedFaculty.length > 0) return cachedFaculty;\\n    return [];');

// 7. Remove all occurrences of getting/setting FACULTY_MASTER
content = content.replace(/    const facultyMaster = getLocalData<FacultyRecord\[\]>\(STORAGE_KEYS\.FACULTY_MASTER, SERVICE_REGISTER_FACULTY\);\n[\s\S]*?setLocalData\(STORAGE_KEYS\.FACULTY_MASTER, (.*?)\);\n/g, '');

// 8. Remove getLocalData for FACULTY_MASTER without set
content = content.replace(/    const facultyList = getLocalData<FacultyRecord\[\]>\(STORAGE_KEYS\.FACULTY_MASTER, SERVICE_REGISTER_FACULTY\);\n/g, '    const facultyList: FacultyRecord[] = [];\n');

// 9. Remove setLocalData for FACULTY_MASTER alone
content = content.replace(/    setLocalData\(STORAGE_KEYS\.FACULTY_MASTER, .*?\);\n/g, '');

// 10. SarAuditLogs
content = content.replace(/    const allFaculty = await this\.getAllFaculty\(\);\n    \n    const pendingConfirmation = allFaculty\.filter\(f => \n      ADMIN_CONFIRMATION_IDS\.includes\(f\.faculty_id\.toUpperCase\(\)\)\n    \);/g, '    const pendingConfirmation: FacultyRecord[] = [];');

fs.writeFileSync('src/lib/services/data-service.ts', content);
console.log('Fixed data-service.ts');
