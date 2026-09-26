const fs = require('fs');
const data = require('./sar_dump.json');
const sar = data.sarFaculty;
const sr = data.srFaculty;

console.log('=== SERVICE REGISTER (All 73) ===');
sr.forEach((s, idx) => {
  console.log(`[${s.empId}] ${s.srName} | Dept: ${s.srDept} | Desig: ${s.designation}`);
});

console.log('\n=== SAR FACULTY (All 56) ===');
sar.forEach((s, idx) => {
  console.log(`${idx + 1}. [${s.sarDept}] "${s.sarName}"`);
});
