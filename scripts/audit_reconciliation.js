const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./scripts/sar_dump.json', 'utf8'));
const sarFaculty = data.sarFaculty;
const srFaculty = data.srFaculty;

const normalizeName = (name) => {
  return name.toLowerCase().replace(/[^a-z]/g, '');
};

const knownMatches = {
  "p. sateesh kumar": "potunuru sateesh kumar",
  "d. soma sekhar": "dasari somasekhar",
  "hema sundari": "tammina hema sundari",
  "kala priya": "kosti kala priya",
};

const matched = [];
const needsConfirmation = [];
const srMatchedIds = new Set();

sarFaculty.forEach(sar => {
  let match = null;
  const normalizedSar = normalizeName(sar.sarName);
  const explicitMatch = knownMatches[sar.sarName.toLowerCase().trim()];

  for (const sr of srFaculty) {
    const normalizedSr = normalizeName(sr.srName);
    if (normalizedSr === normalizedSar || 
        (explicitMatch && normalizeName(explicitMatch) === normalizedSr) ||
        normalizedSr.includes(normalizedSar) ||
        normalizedSar.includes(normalizedSr)) {
        
        // Let's do a stricter check. If it includes, ensure it's a good match.
        if (normalizedSr.length > 5 && normalizedSar.length > 5) {
          match = sr;
          break;
        }
    }
  }

  if (match) {
    matched.push({
      sno: sar.sno,
      sarName: sar.sarName,
      sarDept: sar.sarDept,
      srName: match.srName,
      srEmpId: match.empId,
      status: 'Matched'
    });
    srMatchedIds.add(match.empId);
  } else {
    // Try to find candidates
    const candidates = srFaculty
      .filter(sr => normalizeName(sr.srName).substring(0, 3) === normalizedSar.substring(0, 3))
      .map(sr => `${sr.srName} (${sr.empId})`);

    needsConfirmation.push({
      sno: sar.sno,
      sarName: sar.sarName,
      sarDept: sar.sarDept,
      candidates,
      status: 'Needs Admin Confirmation'
    });
  }
});

const srOnly = srFaculty.filter(sr => !srMatchedIds.has(sr.empId));

console.log('==================================================');
console.log('SAR TRACKER + SERVICE REGISTER AUDIT SUMMARY');
console.log('==================================================\n');

console.log(`Total SAR faculty: ${sarFaculty.length}`);
console.log(`Matched with Service Register: ${matched.length}`);
console.log(`Needs confirmation: ${needsConfirmation.length}`);
console.log(`Service Register records not included in SAR population: ${srOnly.length}\n`);

console.log('--- A. MATCHED ---');
matched.forEach(m => {
  console.log(`${m.sno}. ${m.sarName} (${m.sarDept}) -> ${m.srName} [${m.srEmpId}]`);
});

console.log('\n--- B. NOT FOUND / NEEDS CONFIRMATION ---');
needsConfirmation.forEach(m => {
  console.log(`${m.sno}. ${m.sarName} (${m.sarDept})`);
  if (m.candidates.length > 0) {
    console.log(`   Possible candidates: ${m.candidates.join(', ')}`);
  } else {
    console.log(`   No candidates found`);
  }
});

console.log('\n--- C. SERVICE REGISTER ONLY (Sample) ---');
srOnly.slice(0, 10).forEach(sr => {
  console.log(`${sr.srName} [${sr.empId}] - ${sr.srDept}`);
});
if (srOnly.length > 10) console.log(`... and ${srOnly.length - 10} more.`);
