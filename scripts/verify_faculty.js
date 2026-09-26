const fs = require('fs');
const XLSX = require('xlsx');

const sarWb = XLSX.readFile('C:/Users/killi/Downloads/NSRIET_FACULTY_SAR_TRACKER _MODIFIED.xlsx');
const srWb = XLSX.readFile('C:/Users/killi/Downloads/SERVICE REGISTER.xlsx');

const julySheet = sarWb.Sheets['July'];
const julyData = XLSX.utils.sheet_to_json(julySheet, { header: 1 });

const sarFaculty = [];
for (let i = 2; i < julyData.length; i++) {
  const row = julyData[i];
  if (row && row[0] && String(row[0]).trim() !== '') {
    sarFaculty.push({
      sno: i - 1,
      sarName: String(row[0]).trim(),
      sarDept: String(row[1] || '').trim(),
      julyMarks: {
        h1: row[2] ?? null,
        h2: row[3] ?? null,
        h3: row[4] ?? null,
        h4: row[5] ?? null,
        h5: row[6] ?? null,
        h6: row[7] ?? null,
        h7: row[8] ?? null,
        h8: row[9] ?? null,
        total: row[10] ?? null
      }
    });
  }
}

// August marks
const augSheet = sarWb.Sheets['August'];
const augData = XLSX.utils.sheet_to_json(augSheet, { header: 1 });
sarFaculty.forEach((f, idx) => {
  const row = augData[idx + 2];
  if (row) {
    f.augMarks = {
      h1: row[2] ?? null,
      h2: row[3] ?? null,
      h3: row[4] ?? null,
      h4: row[5] ?? null,
      h5: row[6] ?? null,
      h6: row[7] ?? null,
      h7: row[8] ?? null,
      h8: row[9] ?? null,
      total: row[10] ?? null
    };
  }
});

// Service Register
const srSheet = srWb.Sheets['EMP IDs'];
const srData = XLSX.utils.sheet_to_json(srSheet, { header: 1 });
const srFaculty = [];
for (let i = 7; i < srData.length; i++) {
  const row = srData[i];
  if (row && (row[1] || row[5])) {
    srFaculty.push({
      srName: String(row[1] || '').trim(),
      designation: String(row[2] || '').trim(),
      srDept: String(row[3] || '').trim(),
      doj: String(row[4] || '').trim(),
      empId: String(row[5] || '').trim(),
      dor: String(row[6] || '').trim()
    });
  }
}

console.log('Total SAR Faculty:', sarFaculty.length);
console.log('Total SR Faculty:', srFaculty.length);

fs.writeFileSync('scripts/sar_dump.json', JSON.stringify({ sarFaculty, srFaculty }, null, 2));
console.log('Dumped to scripts/sar_dump.json');
