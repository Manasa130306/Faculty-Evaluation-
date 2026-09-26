const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./scripts/sar_dump.json', 'utf8'));
const sarFaculty = data.sarFaculty;
const srFaculty = data.srFaculty;

// Helper to normalize names by stripping titles, dots, extra spaces, special chars
function cleanTokens(name) {
  return name
    .toLowerCase()
    .replace(/\b(mr|mrs|ms|dr|prof|asst|assoc|smt|sri)\b/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0);
}

// Known exact matches with confirmed identity in Service Register
const manualVerifiedMap = {
  // SAR Name -> SR Emp ID
  "p. sateesh kumar": "25TS040053", // Mr POTUNURU SATEESH KUMAR (ECE)
  "d. soma sekhar": "24TS040031", // DASARI SOMASEKHAR (ECE)
  "hema sundari": "24TS040028", // TAMMINA HEMA SUNDARI (ECE)
  "kala priya": "24TS040040", // KOSTI KALA PRIYA (ECE)
  "jhansi rani": "24TS040045", // KADIYALA JHANSI RANI (ECE)
  "v. satyavathi": "25TS040051", // VALLY SATYAVATHI (ECE)
  "g. siva kumari": "25TS040052", // Mrs GORLI SIVA KUMARI (ECE)
  "p. kasturi": "25TS040065", // Mrs PENTAPALLI KASTURI (ECE)
  "a. prasada rao": "24TS020027", // Mr AKULA PRASADA RAO (EEE)
  "r. srujana sri": "23TS020019", // Mrs REDDI SUJANA SRI (EEE)
  "p. l. chandini": "24TS020033", // Mrs PATTI LAKSHMI CHANDINI (EEE)
  "u. sirisha": "24TS020044", // Mrs SHIRISHA UNDRAJAVARAPU (EEE)
  "ramanjaneyulu": "23TS030023", // BEELA RAMANJANEYULU (MECH)
  "dr. ravi teja": "24TS030041", // Dr TANKALA RAVITEJA (MECH)
  "suresh babu": "23TS030018", // Mr SURESH BABU TALLAPUDI (MECH)
  "padmaja": "26TS030066", // PADMAJA ANDAVARAPU (MECH)
  "sri devi": "26TS030072", // KALDARI SRIDEVI (MECH)
  "anhijit": "23TS510002", // Mr CHELLURU SRINIVAS UDAY ABHIJIT (English/MBA/BS&H)
  "sowjanya": "23TS520012", // Mrs N SOUJANYA (MBA)
  "srinivas": "23TS520008", // Mr SEKHARA MAHANTHI MADHUSUDANA RAO (MBA) / Srinivas
  "adibabu": "23TS050009", // Mr ADIBABU RIPARAGIRI (CSE)
  "m. asha": "24TS050032", // Mrs MUDADLA ASHA (CSE)
  "uma maheswara rao": "24TS050035", // Mr UMAMAHESWARARAO GOTTAPU (CSE)
  "deva raj": "24TS050037", // Mr DEVARAJU HANUMANTHU (CSE)
  "venkateswara rao": "25TS050047", // Mr GORLE VENKATESWARA RAO (CSE)
  "diwakar": "25TS050048", // Mr SUSARAPU DIVAKAR (CSE)
  "phani sekhar": "25TS050049", // Mr KOPPALA KASI VENKATA PHANI SEKHAR (CSE)
  "sravanti": "25TS050063", // Mrs CHIPURAPALLI SRAVANTHI (CSE)
  "dr. harihara santosh": "26TS050067", // Dr HARIHARA SANTOSH DADI (CSE)
  "p. chandra sekhar": "26TS050068", // CHANDRASEKHARARAO PAKKI (CSE)
  "k. shiva": "26TS050070", // KONA SIVA (CSE)
  "m. sai jyothi": "26TS050071", // MELETI SAI JYOTHI (CSE)
  "p. unnati aditya": "26TS030073", // PASUPULETI UNNATHI ADITHJYA (CSE)
  "rukmini": "25TS050064", // Mrs KOLLURI RUKMINI (CSE)
  "pavani": "24TS510030", // Mrs AMBATI PAVANI (BS&H/CSE)
  "prasad": "25TS050059", // Mr AMARA PRASAD (CSE)
  "nagamani naidu": "23TS510007", // Dr NAGAMANINAIDU BONNADA (BS&H)
  "mmk raju": "23TS510015", // M KRISHNA RAJU MUDUNURU (BS&H)
  "neelima": "24TS510036", // Mrs DANTHUMSETTY NEELIMA (BS&H)
  "dhana lakshni": "25TS510046", // Mrs KORADA DHANALAKSHMI (BS&H)
  "hariprasad": "23TS510003", // REGULAVALASA HARI PRASAD (BS&H)
  "sai sruthi": "26TS510069", // MULLU SAISRUTHI (BS&H)
  "y sharavan": "25TS510057", // Mr SRAVAN KUMAR YALLA (BS&H)
  "d. appa rao": "23TS510004", // Mr GUNTU APPA RAO (BS&H)
  "s. govinda": "23TS510010", // Mr SARIKA GOVIND (BS&H)
};

const matched = [];
const needsConfirmation = [];
const srMatchedIds = new Set();

sarFaculty.forEach(sar => {
  const normKey = sar.sarName.toLowerCase().trim();
  const srEmpId = manualVerifiedMap[normKey];
  
  if (srEmpId) {
    const srRecord = srFaculty.find(s => s.empId === srEmpId);
    if (srRecord) {
      matched.push({
        sno: sar.sno,
        sarName: sar.sarName,
        sarDept: sar.sarDept,
        srName: srRecord.srName,
        srEmpId: srRecord.empId,
        srDept: srRecord.srDept,
        status: 'Matched'
      });
      srMatchedIds.add(srRecord.empId);
      return;
    }
  }

  // If not in verified map, look for candidates in SR
  const sarTokens = cleanTokens(sar.sarName);
  const candidates = [];
  
  srFaculty.forEach(sr => {
    const srTokens = cleanTokens(sr.srName);
    const hasOverlap = sarTokens.some(st => st.length >= 3 && srTokens.some(srt => srt.includes(st) || st.includes(srt)));
    if (hasOverlap) {
      candidates.push(`${sr.srName} (${sr.empId} - ${sr.srDept})`);
    }
  });

  needsConfirmation.push({
    sno: sar.sno,
    sarName: sar.sarName,
    sarDept: sar.sarDept,
    candidates,
    status: 'Needs Admin Confirmation'
  });
});

const srOnly = srFaculty.filter(sr => !srMatchedIds.has(sr.empId));

console.log('Total SAR faculty:', sarFaculty.length);
console.log('Matched with Service Register:', matched.length);
console.log('Needs confirmation:', needsConfirmation.length);
console.log('Service Register records not included in SAR population:', srOnly.length);

console.log('\n--- Unmatched SAR Faculty ---');
needsConfirmation.forEach(nc => {
  console.log(`${nc.sno}. ${nc.sarName} (${nc.sarDept})`);
  if (nc.candidates.length > 0) {
    console.log(`   Possible SR Candidates: ${nc.candidates.join('; ')}`);
  } else {
    console.log(`   Possible SR Candidates: None`);
  }
});
