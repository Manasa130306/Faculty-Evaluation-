const data = require('./sar_dump.json');
const sar = data.sarFaculty;
const sr = data.srFaculty;

// Let's check all 56 SAR faculty
sar.forEach((f, idx) => {
  console.log((idx + 1) + '. SAR Name: "' + f.sarName + '", Dept: "' + f.sarDept + '"');
});
