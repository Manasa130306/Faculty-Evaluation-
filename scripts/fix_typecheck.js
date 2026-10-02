const fs = require('fs');

let evContent = fs.readFileSync('src/app/actions/evaluation.ts', 'utf8');
evContent = evContent.replace(/SERVICE_REGISTER_FACULTY/g, '[]').replace(/\(f\) => f\.faculty_id === /g, '(f: any) => f.faculty_id === ');
fs.writeFileSync('src/app/actions/evaluation.ts', evContent);

let routeContent = fs.readFileSync('src/app/api/debug/route.ts', 'utf8');
routeContent = routeContent.replace(/SERVICE_REGISTER_FACULTY/g, '[]');
fs.writeFileSync('src/app/api/debug/route.ts', routeContent);

let dsContent = fs.readFileSync('src/lib/services/data-service.ts', 'utf8');
dsContent = dsContent.replace(/import \{ SERVICE_REGISTER_FACULTY, ADMIN_CONFIRMATION_IDS \} from '\.\.\/constants\/facultyData';/g, '');
dsContent = dsContent.replace(/\(f\) => \(\{\n        id: `prof_\$\{f\.faculty_id\}`/g, '(f: any) => ({\n        id: `prof_${f.faculty_id}`');
dsContent = dsContent.replace(/const facultyList = storedFaculty\.filter\(\(f\) => \!f\.faculty_id/g, 'const facultyList = storedFaculty.filter((f: any) => !f.faculty_id');
fs.writeFileSync('src/lib/services/data-service.ts', dsContent);
