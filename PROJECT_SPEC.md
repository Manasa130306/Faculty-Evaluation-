# Faculty Evaluation Management System - Project Specification & Data Mapping

## 1. System Overview & Core Directives
A full-stack Faculty Performance Appraisal & Evaluation Management System built for **N S Raju Institute of Engineering & Technology (NSRIET)**.

The system replaces manual trackers with a robust, role-based web application providing monthly self-appraisal for faculty, Head 1 entry and month-locking by IQAC Admin, real-time calculation of monthly and cumulative scores against the official 1000-mark annual framework, evidence document storage, and Excel exports.

---

## 2. Single Source of Truth: Evaluation Framework (1000 Marks)

### 2.1 The 8 Performance Appraisal Heads
1. **Head 1**: Pass % & IQAC Visit (Annual: 255 Marks)
2. **Head 2**: Mentoring & Backlogs (Annual: 85 Marks)
3. **Head 3**: Project Expo & Events (Annual: 115 Marks)
4. **Head 4**: Scopus/WoS Journals (Annual: 200 Marks)
5. **Head 5**: Patents & Chapters (Annual: 70 Marks)
6. **Head 6**: Ph.D. Status & Progress (Annual: 70 Marks)
7. **Head 7**: Organizing FDPs (Annual: 115 Marks)
8. **Head 8**: Attending FDPs/NPTEL (Annual: 90 Marks)
**Total Annual Maximum**: 1000 Marks

### 2.2 Official Monthly Distribution Matrix (July to June)

| Month | H1 (Pass & IQAC) | H2 (Mentoring) | H3 (Expo/Events) | H4 (Scopus/WoS) | H5 (Patents/Chapters) | H6 (Ph.D.) | H7 (Org FDP) | H8 (Att FDP/NPTEL) | Monthly Total |
|---|---|---|---|---|---|---|---|---|---|
| **July** | 20 | 10 | 10 | 15 | 0 | 10 | 5 | 0 | **70** |
| **August** | 20 | 10 | 15 | 15 | 0 | 0 | 10 | 10 | **80** |
| **September** | 25 | 10 | 15 | 15 | 0 | 0 | 15 | 10 | **90** |
| **October** | 25 | 10 | 15 | 10 | 10 | 10 | 10 | 0 | **90** |
| **November** | 45 | 10 | 5 | 20 | 0 | 0 | 5 | 15 | **100** |
| **December** | 0 | 0 | 5 | 20 | 20 | 15 | 15 | 15 | **90** |
| **January** | 20 | 10 | 5 | 15 | 0 | 10 | 5 | 5 | **70** |
| **February** | 20 | 10 | 15 | 15 | 0 | 0 | 10 | 10 | **80** |
| **March** | 25 | 10 | 15 | 15 | 0 | 10 | 5 | 10 | **90** |
| **April** | 45 | 5 | 15 | 10 | 15 | 0 | 10 | 10 | **110** |
| **May** | 0 | 0 | 0 | 25 | 15 | 0 | 15 | 5 | **60** |
| **June** | 10 | 0 | 0 | 25 | 10 | 15 | 10 | 0 | **70** |
| **Annual Total** | **255** | **85** | **115** | **200** | **70** | **70** | **115** | **90** | **1000** |

### 2.3 Detailed Monthly Metric Descriptions (Verbatim from Manual)

- **July (70 Marks Total)**:
  - **Head 1 (20 Marks)**: First monthly classroom observation score focusing on pedagogy, board work, and discipline.
  - **Head 2 (10 Marks)**: Mentee batch allocation and baseline backlog identification.
  - **Head 3 (10 Marks)**: Project domain selection and team formation with students.
  - **Head 4 (15 Marks)**: Target journal selection and outline framework submission.
  - **Head 6 (10 Marks)**: Semester research milestone plan submission to R&D.
  - **Head 7 (5 Marks)**: Event topic identification and committee formation.
  - **Head 8 (0 Marks)**: No weightage allocated this month.

- **August (80 Marks Total)**:
  - **Head 1 (20 Marks)**: Classroom observation on active learning methods and ICT usage.
  - **Head 2 (10 Marks)**: First formal mentoring records and slow learner identification.
  - **Head 3 (15 Marks)**: Proposals and abstract drafting for external state/national expos.
  - **Head 4 (15 Marks)**: Completing literature review and methodology sections.
  - **Head 7 (10 Marks)**: Resource person communication, budget approval, and brochure design.
  - **Head 8 (10 Marks)**: Registration and attendance in a short 5-day technical workshop.

- **September (90 Marks Total)**:
  - **Head 1 (25 Marks)**: CAT-1 pass percentage targets (10 marks) + IQAC audit (15 marks).
  - **Head 2 (10 Marks)**: Post-CAT-1 counseling logs and parent updates.
  - **Head 3 (15 Marks)**: Project model design and competition portal registration.
  - **Head 4 (15 Marks)**: Department Research Committee (DRC) review presentation.
  - **Head 7 (15 Marks)**: Full execution and hosting of a major departmental FDP/Workshop.
  - **Head 8 (10 Marks)**: NPTEL assignment submissions and course activity tracking.

- **October (90 Marks Total)**:
  - **Head 1 (25 Marks)**: Syllabus coverage audit (10 marks) + Pre-exam quality visit (15 marks).
  - **Head 2 (10 Marks)**: Pre-exam counseling and attendance deficit recovery logs.
  - **Head 3 (15 Marks)**: Student team prototype testing and evaluation.
  - **Head 4 (10 Marks)**: Final paper submission receipt and manuscript ID.
  - **Head 5 (10 Marks)**: Patent draft specification or book chapter proposal filing.
  - **Head 6 (10 Marks)**: Progress report submission to guide or R&D committee.
  - **Head 7 (10 Marks)**: Post-event documentation, certificates distribution, and financial settlement.

- **November (100 Marks Total)**:
  - **Head 1 (45 Marks)**: Odd-semester university result pass % target (25 marks) + End-sem course file audit (20 marks).
  - **Head 2 (10 Marks)**: Odd-semester backlog reduction verification.
  - **Head 3 (5 Marks)**: Compilation of semester student participation achievements.
  - **Head 4 (20 Marks)**: Addressing reviewer queries or submitting revised manuscripts.
  - **Head 7 (5 Marks)**: Submitting complete organized event file to IQAC.
  - **Head 8 (15 Marks)**: NPTEL exam completion or participation in winter FDP.

- **December (90 Marks Total)**:
  - **Head 3 (5 Marks)**: Mentoring student teams for winter hackathons/competitions.
  - **Head 4 (20 Marks)**: Acceptance letter or final online publication in Scopus/WoS journal.
  - **Head 5 (20 Marks)**: Official patent application filing or copyright grant certificate.
  - **Head 6 (15 Marks)**: Doctoral RAC meeting completion or progress presentation.
  - **Head 7 (15 Marks)**: Planning and executing a winter STTP or national-level seminar.
  - **Head 8 (15 Marks)**: Winter industry immersion or advanced training certificate.

- **January (70 Marks Total)**:
  - **Head 1 (20 Marks)**: Even-semester class delivery and lesson plan compliance check.
  - **Head 2 (10 Marks)**: Target setting for Even-semester backlog clearing.
  - **Head 3 (5 Marks)**: Student project team allocation for Even semester.
  - **Head 4 (15 Marks)**: Topic selection and paper drafting for the second cycle.
  - **Head 6 (10 Marks)**: Setting Even-semester research targets.
  - **Head 7 (5 Marks)**: Planning proposal for Even-semester workshop/FDP.
  - **Head 8 (5 Marks)**: NPTEL/SWAYAM course enrollment proof.

- **February (80 Marks Total)**:
  - **Head 1 (20 Marks)**: IQAC audit on outcome-based education (OBE) practices.
  - **Head 2 (10 Marks)**: Attendance tracking and low-performer counseling.
  - **Head 3 (15 Marks)**: Submitting project abstracts to national-level expos.
  - **Head 4 (15 Marks)**: Internal peer review of the draft paper.
  - **Head 7 (10 Marks)**: Approval, guest speaker tie-ups, and promotion for upcoming FDP.
  - **Head 8 (10 Marks)**: Participation in a 5-day technical FDP.

- **March (90 Marks Total)**:
  - **Head 1 (25 Marks)**: CAT-1 evaluation (10 marks) + IQAC course file review (15 marks).
  - **Head 2 (10 Marks)**: Post-CAT-1 student counseling records.
  - **Head 3 (15 Marks)**: Guiding teams at external project expo venues.
  - **Head 4 (15 Marks)**: Submission receipt from target Scopus/WoS journal.
  - **Head 6 (10 Marks)**: Verified research work milestone progress.
  - **Head 7 (5 Marks)**: Final preparation for Even-semester conference/workshop.
  - **Head 8 (10 Marks)**: NPTEL assignments and workshop submission certificates.

- **April (110 Marks Total)**:
  - **Head 1 (45 Marks)**: Even-semester theory pass % targets (25 marks) + Final course file closure (20 marks).
  - **Head 2 (5 Marks)**: Annual net backlog reduction report submission.
  - **Head 3 (15 Marks)**: Hardware/Software model submission for annual college expo/awards.
  - **Head 4 (10 Marks)**: Proof submission (galley proofs/camera-ready copy).
  - **Head 5 (15 Marks)**: Publication proof of filed patent or published book chapter.
  - **Head 7 (10 Marks)**: Hosting annual technical event/national workshop.
  - **Head 8 (10 Marks)**: Course completion/exam proof for NPTEL/FDP.

- **May (60 Marks Total)**:
  - **Head 4 (25 Marks)**: Vacation period research paper drafting and journal targeting.
  - **Head 5 (15 Marks)**: Book chapter submission or patent specification filing.
  - **Head 7 (15 Marks)**: Organizing summer FDP / Short Term Training Program (STTP).
  - **Head 8 (5 Marks)**: Summer skill upgrade course certificate.

- **June (70 Marks Total)**:
  - **Head 1 (10 Marks)**: Annual IQAC academic audit clearance.
  - **Head 4 (25 Marks)**: Final annual review verifying publication target completion.
  - **Head 5 (10 Marks)**: Annual archiving of published IP content.
  - **Head 6 (15 Marks)**: Annual university progress report or continuation proof.
  - **Head 7 (10 Marks)**: Compiling and submitting the complete annual report of organized events.

---

## 3. Faculty Master Source: SERVICE REGISTER (72 Faculty)
Every faculty record is imported with their official `emp_id` as primary key.

### Complete List of Faculty:
1. `23TS030001` - Mr M SATYANARAYANA | MECH | ASST. PROF. | DOJ: 19-05-2023 | DOR: 08-07-2025
2. `23TS510002` - Mr CHELLURU SRINIVAS UDAY ABHIJIT | BS&H | ASST. PROF. (ENGLISH) | DOJ: 26-05-2023 | DOR: NULL
3. `23TS510003` - REGULAVALASA HARI PRASAD | BS&H | ASST. PROF. (MATHEMATICS) | DOJ: 26-05-2023 | DOR: NULL
4. `23TS510004` - Mr GUNTU APPA RAO | BS&H | ASST. PROF. & PD | DOJ: 26-05-2023 | DOR: NULL
5. `23TS510005` - Mr GOTTIMUKKALA SURYANARAYANA RAJU | BS&H | ASST. PROF. (LIBRARIAN) | DOJ: 30-05-2023 | DOR: NULL
6. `23TS510006` - Mrs M BHAVANI | BS&H | ASST. PROF. | DOJ: 01-06-2023 | DOR: 29-05-2025
7. `23TS510007` - Dr NAGAMANINAIDU BONNADA | BS&H | ASST. PROF. (CHEMISTRY) & HOD | DOJ: 01-06-2023 | DOR: NULL
8. `23TS520008` - Mr SEKHARA MAHANTHI MADHUSUDANA RAO | MBA | ASST. PROF. | DOJ: 01-06-2023 | DOR: NULL
9. `23TS050009` - Mr ADIBABU RIPARAGIRI | CSE | ASST. PROF. & HOD | DOJ: 03-06-2023 | DOR: NULL
10. `23TS510010` - Mr SARIKA GOVIND | BS&H | ASST. PROF. (CHEMISTRY) | DOJ: 03-06-2023 | DOR: NULL
11. `23TS510011` - PRAMOD KUMAR NULAKAJODU | BS&H | ASST. PROF. (ASST. LIBRARIAN) | DOJ: 05-06-2023 | DOR: NULL
12. `23TS520012` - Mrs N SOUJANYA | MBA | ASST. PROF. | DOJ: 05-06-2023 | DOR: 08-07-2025
13. `23TS510013` - Mrs T LALITHA SIVA JYOTHI | BS&H | ASST. PROF. | DOJ: 07-06-2023 | DOR: 08-07-2025
14. `23TS510014` - Mr K BUJJI BABU | BS&H | ASST. PROF. (ENGLISH) | DOJ: 26-06-2023 | DOR: 08-07-2025
15. `23TS510015` - M KRISHNA RAJU MUDUNURU | BS&H | ASST. PROF. (MATHEMATICS) | DOJ: 01-07-2023 | DOR: NULL
16. `23TS050016` - Mrs T SOWJANYA KUMARI | CSE | ASST. PROF. | DOJ: 30-08-2023 | DOR: 25-06-2025
17. `23TS040017` - SURI V S LALITHA MADHURI | ECE | ASST. PROF. | DOJ: 12-09-2023 | DOR: NULL
18. `23TS030018` - Mr SURESH BABU TALLAPUDI | MECH | ASST. PROF. | DOJ: 25-09-2023 | DOR: NULL
19. `23TS020019` - Mrs REDDI SUJANA SRI | EEE | ASST. PROF. | DOJ: 04-10-2023 | DOR: NULL
20. `23TS010020` - TARUNI BANDARU | CIVIL | ASST. PROF. | DOJ: 05-10-2023 | DOR: NULL
21. `23TS050021` - Mrs K SWATHI | CSE | ASST. PROF. | DOJ: 27-10-2023 | DOR: 01-06-2024
22. `23TS510022` - Mrs NALLI MANI | BS&H | ASST. PROF. (PHYSICS) | DOJ: 23-11-2023 | DOR: NULL
23. `23TS030023` - BEELA RAMANJANEYULU | MECH | ASSOC. PROF. | DOJ: 27-11-2023 | DOR: NULL
24. `23TS040024` - Dr M A KHADAR BABA | ECE | PROFESSOR & PRINCIPAL | DOJ: 30-11-2023 | DOR: NULL
25. `24TS520025` - Mrs PUDIPEDDI DEVI PRASANTHI | MBA | ASST. PROF. | DOJ: 01-02-2024 | DOR: NULL
26. `24TS520026` - Mrs VEDULA UMA | MBA | ASST. PROF. | DOJ: 01-02-2024 | DOR: NULL
27. `24TS020027` - Mr AKULA PRASADA RAO | EEE | ASSOC. PROF. & HOD | DOJ: 14-02-2024 | DOR: NULL
28. `24TS040028` - TAMMINA HEMA SUNDARI | ECE | ASST. PROF. | DOJ: 30-05-2024 | DOR: NULL
29. `24TS050029` - Mr BOKAM GANESH | CSE | ASST. PROF. | DOJ: 01-06-2024 | DOR: NULL
30. `24TS510030` - Mrs AMBATI PAVANI | BS&H | ASST. PROF. (MATHEMATICS) | DOJ: 07-06-2024 | DOR: NULL
31. `24TS040031` - DASARI SOMASEKHAR | ECE | ASST. PROF. | DOJ: 13-06-2024 | DOR: NULL
32. `24TS050032` - Mrs MUDADLA ASHA | CSE | ASST. PROF. | DOJ: 24-06-2024 | DOR: NULL
33. `24TS020033` - Mrs PATTI LAKSHMI CHANDINI | EEE | ASST. PROF. | DOJ: 01-07-2024 | DOR: NULL
34. `24TS040034` - YANDI ANGELINA LIVINGSTON | ECE | ASST. PROF. | DOJ: 01-07-2024 | DOR: NULL
35. `24TS050035` - Mr UMAMAHESWARARAO GOTTAPU | CSE | ASST. PROF. | DOJ: 18-07-2024 | DOR: NULL
36. `24TS510036` - Mrs DANTHUMSETTY NEELIMA | BS&H | ASST. PROF. (MATHEMATICS) | DOJ: 05-08-2024 | DOR: NULL
37. `24TS050037` - Mr DEVARAJU HANUMANTHU | CSE | ASST. PROF. | DOJ: 19-08-2024 | DOR: NULL
38. `24TS520038` - Mr RAYAVARAPU PRAKASH | MBA | ASST. PROF. | DOJ: 09-09-2024 | DOR: NULL
39. `24TS510039` - Mr P LATCHAYYA | BS&H | ASST. PROF. (PD) | DOJ: 24-09-2024 | DOR: 08-07-2025
40. `24TS040040` - KOSTI KALA PRIYA | ECE | ASST. PROF. | DOJ: 25-11-2024 | DOR: NULL
41. `24TS030041` - Dr TANKALA RAVITEJA | MECH | ASST. PROF. | DOJ: 28-11-2024 | DOR: NULL
42. `24TS030042` - MEDICHERLA VENKATA BALESWARI | MECH | ASST. PROF. | DOJ: 03-12-2024 | DOR: 25.04.2026
43. `24TS520043` - Mrs NEELAMSETTI NAVYA | MBA | ASST. PROF. | DOJ: 04-12-2024 | DOR: 25.04.2026
44. `24TS020044` - Mrs SHIRISHA UNDRAJAVARAPU | EEE | ASST. PROF. | DOJ: 06-12-2024 | DOR: NULL
45. `24TS040045` - KADIYALA JHANSI RANI | ECE | ASST. PROF. | DOJ: 09-12-2024 | DOR: NULL
46. `25TS510046` - Mrs KORADA DHANALAKSHMI | BS&H | ASST. PROF. (PHYSICS) | DOJ: 29-05-2025 | DOR: NULL
47. `25TS050047` - Mr GORLE VENKATESWARA RAO | CSE | ASST. PROF. | DOJ: 02-06-2025 | DOR: NULL
48. `25TS050048` - Mr SUSARAPU DIVAKAR | CSE | ASST. PROF. | DOJ: 02-06-2025 | DOR: NULL
49. `25TS050049` - Mr KOPPALA KASI VENKATA PHANI SEKHAR | CSE | ASST. PROF. | DOJ: 02-06-2025 | DOR: NULL
50. `25TS050050` - Mr KENGAM TIRUMALA KOTESWARA RAO | CSE | ASST. PROF. | DOJ: 02-06-2025 | DOR: NULL
51. `25TS040051` - VALLY SATYAVATHI | ECE | ASST. PROF. | DOJ: 06-06-2025 | DOR: NULL
52. `25TS040052` - Mrs GORLI SIVA KUMARI | ECE | ASST. PROF. | DOJ: 18-06-2025 | DOR: NULL
53. `25TS040053` - Mr POTUNURU SATEESH KUMAR | ECE | ASST. PROF. | DOJ: 23-06-2025 | DOR: NULL
54. `25TS520054` - Dr PENKI RAVI KUMAR | MBA | PROF. & HOD | DOJ: 27-06-2025 | DOR: NULL
55. `25TS520055` - Mrs KAKARLAPUDI SOUJANYA | MBA | ASST. PROF. | DOJ: 01-07-2025 | DOR: NULL
56. `25TS510056` - Mr A AJAY KUMAR | BS&H | PROF. (ENGLISH) | DOJ: 11-07-2025 | DOR: -10-2025
57. `25TS510057` - Mr SRAVAN KUMAR YALLA | BS&H | ASST. PROF. (ENGLISH) | DOJ: 16-07-2025 | DOR: NULL
58. `25TS510058` - Mr PAIDI LAKSHMI NARAYANA | BS&H | ASST. PROF. (PD) | DOJ: 19-07-2025 | DOR: NULL
59. `25TS050059` - Mr AMARA PRASAD | CSE | ASST. PROF. | DOJ: 09-09-2025 | DOR: NULL
60. `25TS520060` - Mr SATYASEKHAR BALIVADA | MBA | ASST. PROF. | DOJ: 14-10-2025 | DOR: NULL
61. `25TS040061` - Mr MARUPALLI NARAYANA GANGADHAR | ECE | ASST. PROF. | DOJ: 29-10-2025 | DOR: NULL
62. `25TS510062` - Mrs MASA PUSHPALATHA | BS&H | ASST. PROF. (ENGLISH) | DOJ: 29-10-2025 | DOR: NULL
63. `25TS050063` - Mrs CHIPURAPALLI SRAVANTHI | CSE | ASST. PROF. | DOJ: 31-10-2025 | DOR: NULL
64. `25TS050064` - Mrs KOLLURI RUKMINI | CSE | ASST. PROF. | DOJ: 01-11-2025 | DOR: NULL
65. `25TS040065` - Mrs PENTAPALLI KASTURI | ECE | ASST. PROF. | DOJ: 03-11-2025 | DOR: NULL
66. `26TS030066` - PADMAJA ANDAVARAPU | MECH | ASST. PROF. | DOJ: 19-01-2026 | DOR: NULL
67. `26TS050067` - Dr HARIHARA SANTOSH DADI | CSE | PROFESSOR | DOJ: 05-05-2026 | DOR: NULL
68. `26TS050068` - CHANDRASEKHARARAO PAKKI | CSE | ASST. PROF. | DOJ: 06-05-2026 | DOR: NULL
69. `26TS510069` - MULLU SAISRUTHI | BS&H | ASST. PROF. (PHYSICS) | DOJ: 11-05-2026 | DOR: NULL
70. `26TS050070` - KONA SIVA | CSE | ASST. PROF. | DOJ: 15-05-2026 | DOR: NULL
71. `26TS050071` - MELETI SAI JYOTHI | CSE | ASST. PROF. | DOJ: 15-05-2026 | DOR: NULL
72. `26TS030072` - KALDARI SRIDEVI | MECH | ASST. PROF. | DOJ: 18-05-2026 | DOR: NULL
*(PASUPULETI UNNATHI ADITHJYA in CSE is 26TS030073 in sheet)*

---

## 4. Historical Evaluation Data Mapping (SAR Tracker Analysis)

### 4.1 Identified Historical Evaluations
- **Available Historical Months with Scores**: **July** and **August**.
- **Historical Months with All Zeros**: January, February, March, April, May, June, September, October, November, December.
- **Reference Documents**: None required for historical imported records.

### 4.2 Verified Mappings: SAR Names to Service Register Faculty IDs

| # | SAR Tracker Name | SAR Dept | Service Register Match | Matched EMP ID | SR Dept | Status | Rationale / Matching Rule |
|---|---|---|---|---|---|---|---|
| 1 | P. Sateesh Kumar | ECE | Mr POTUNURU SATEESH KUMAR | 25TS040053 | ECE | **Verified Match** | P. Sateesh Kumar = Potunuru Sateesh Kumar |
| 2 | D. Soma Sekhar | ECE | DASARI SOMASEKHAR | 24TS040031 | ECE | **Verified Match** | D. Soma Sekhar = Dasari Somasekhar |
| 3 | Hema Sundari | ECE | TAMMINA HEMA SUNDARI | 24TS040028 | ECE | **Verified Match** | Hema Sundari = Tammina Hema Sundari |
| 4 | Kala Priya | ECE | KOSTI KALA PRIYA | 24TS040040 | ECE | **Verified Match** | Kala Priya = Kosti Kala Priya |
| 5 | Jhansi Rani | ECE | KADIYALA JHANSI RANI | 24TS040045 | ECE | **Verified Match** | Jhansi Rani = Kadiyala Jhansi Rani |
| 6 | V. Satyavathi | ECE | VALLY SATYAVATHI | 25TS040051 | ECE | **Verified Match** | V. Satyavathi = Vally Satyavathi |
| 7 | G. Siva Kumari | ECE | Mrs GORLI SIVA KUMARI | 25TS040052 | ECE | **Verified Match** | G. Siva Kumari = Gorli Siva Kumari |
| 8 | P. Kasturi | ECE | Mrs PENTAPALLI KASTURI | 25TS040065 | ECE | **Verified Match** | P. Kasturi = Pentapalli Kasturi |
| 9 | R. K. A. Nageswari | ECE | *None in Service Register* | - | - | **Unmatched / Review** | Not listed in Service Register |
| 10 | U. pradeep Kumar | ECE | *None in Service Register* | - | - | **Unmatched / Review** | Not listed in Service Register |
| 11 | R. Mahesh | ECE | *None in Service Register* | - | - | **Unmatched / Review** | Not listed in Service Register |
| 12 | V. Sindhu Bhargavi | ECE | *None in Service Register* | - | - | **Unmatched / Review** | Not listed in Service Register |
| 13 | A. Prasada Rao | EEE | Mr AKULA PRASADA RAO | 24TS020027 | EEE | **Verified Match** | A. Prasada Rao = Akula Prasada Rao |
| 14 | R. Srujana sri | EEE | Mrs REDDI SUJANA SRI | 23TS020019 | EEE | **Verified Match** | R. Srujana sri = Reddi Sujana Sri |
| 15 | P. L. Chandini | EEE | Mrs PATTI LAKSHMI CHANDINI | 24TS020033 | EEE | **Verified Match** | P. L. Chandini = Patti Lakshmi Chandini |
| 16 | U. Sirisha | EEE | Mrs SHIRISHA UNDRAJAVARAPU | 24TS020044 | EEE | **Verified Match** | U. Sirisha = Shirisha Undrajavarapu |
| 17 | R. Anuradha | EEE | *None in Service Register* | - | - | **Unmatched / Review** | Not listed in Service Register |
| 18 | Ramanjaneyulu | MECH | BEELA RAMANJANEYULU | 23TS030023 | MECH | **Verified Match** | Ramanjaneyulu = Beela Ramanjaneyulu |
| 19 | Dr. Ravi Teja | MECH | Dr TANKALA RAVITEJA | 24TS030041 | MECH | **Verified Match** | Dr. Ravi Teja = Tankala Raviteja |
| 20 | Suresh Babu | MECH | Mr SURESH BABU TALLAPUDI | 23TS030018 | MECH | **Verified Match** | Suresh Babu = Suresh Babu Tallapudi |
| 21 | Padmaja | MECH | PADMAJA ANDAVARAPU | 26TS030066 | MECH | **Verified Match** | Padmaja = Padmaja Andavarapu |
| 22 | Sri Devi | MECH | KALDARI SRIDEVI | 26TS030072 | MECH | **Verified Match** | Sri Devi = Kaldari Sridevi |
| 23 | Anhijit | MBA | *Ambiguous / Check SR* | - | - | **Unmatched / Review** | In SR, CHELLURU SRINIVAS UDAY ABHIJIT is BS&H English (23TS510002). SAR lists MBA. Needs review. |
| 24 | Sowjanya | MBA | Mrs N SOUJANYA or Mrs KAKARLAPUDI SOUJANYA | 23TS520012 / 25TS520055 | MBA | **Ambiguous / Review** | Two Soujanyas in MBA. Must be resolved by Admin. |
| 25 | Srinivas | MBA | *None in MBA in SR* | - | - | **Unmatched / Review** | No Srinivas in MBA in SR (Only S. M. Madhusudana Rao, Ravi Kumar, Rayavarapu Prakash, Satyasekhar, etc.) |
| 26 | Adibabu | CSE | Mr ADIBABU RIPARAGIRI | 23TS050009 | CSE | **Verified Match** | Adibabu = Adibabu Riparagiri |
| 27 | M. Asha | CSE | Mrs MUDADLA ASHA | 24TS050032 | CSE | **Verified Match** | M. Asha = Mudadla Asha |
| 28 | Uma Maheswara Rao | CSE | Mr UMAMAHESWARARAO GOTTAPU | 24TS050035 | CSE | **Verified Match** | Uma Maheswara Rao = Umamaheswararao Gottapu |
| 29 | Deva Raj | CSE | Mr DEVARAJU HANUMANTHU | 24TS050037 | CSE | **Verified Match** | Deva Raj = Devaraju Hanumanthu |
| 30 | Venkateswara Rao | CSE | Mr GORLE VENKATESWARA RAO | 25TS050047 | CSE | **Verified Match** | Venkateswara Rao = Gorle Venkateswara Rao |
| 31 | Diwakar | CSE | Mr SUSARAPU DIVAKAR | 25TS050048 | CSE | **Verified Match** | Diwakar = Susarapu Divakar |
| 32 | Phani Sekhar | CSE | Mr KOPPALA KASI VENKATA PHANI SEKHAR | 25TS050049 | CSE | **Verified Match** | Phani Sekhar = Koppala Kasi Venkata Phani Sekhar |
| 33 | Sravanti | CSE | Mrs CHIPURAPALLI SRAVANTHI | 25TS050063 | CSE | **Verified Match** | Sravanti = Chipurapalli Sravanthi |
| 34 | Dr. Harihara Santosh | CSE | Dr HARIHARA SANTOSH DADI | 26TS050067 | CSE | **Verified Match** | Dr. Harihara Santosh = Harihara Santosh Dadi |
| 35 | P. Chandra Sekhar | CSE | CHANDRASEKHARARAO PAKKI | 26TS050068 | CSE | **Verified Match** | P. Chandra Sekhar = Chandrasekhararao Pakki |
| 36 | K. Shiva | CSE | KONA SIVA | 26TS050070 | CSE | **Verified Match** | K. Shiva = Kona Siva |
| 37 | M. Sai Jyothi | CSE | MELETI SAI JYOTHI | 26TS050071 | CSE | **Verified Match** | M. Sai Jyothi = Meleti Sai Jyothi |
| 38 | P. Unnati Aditya | CSE | PASUPULETI UNNATHI ADITHJYA | 26TS030073 | CSE | **Verified Match** | P. Unnati Aditya = Pasupuleti Unnathi Adithjya |
| 39 | S. V. Meena | CSE | *None in Service Register* | - | - | **Unmatched / Review** | Not in Service Register |
| 40 | I. Siva Santosh | CSE | *None in Service Register* | - | - | **Unmatched / Review** | Not in Service Register |
| 41 | Shaik Nagur Vali | CSE | *None in Service Register* | - | - | **Unmatched / Review** | Not in Service Register |
| 42 | P. Prashanth | CSE | *None in Service Register* | - | - | **Unmatched / Review** | Not in Service Register |
| 43 | Rukmini | CSE | Mrs KOLLURI RUKMINI | 25TS050064 | CSE | **Verified Match** | Rukmini = Kolluri Rukmini |
| 44 | Pavani | CSE | *Ambiguous / Review* | - | - | **Ambiguous / Review** | In SR, Mrs AMBATI PAVANI is BS&H (24TS510030), SAR lists CSE. Needs review. |
| 45 | Prasad | CSE | Mr AMARA PRASAD | 25TS050059 | CSE | **Verified Match** | Prasad = Amara Prasad |
| 46 | Nagamani Naidu | Bs&H | Dr NAGAMANINAIDU BONNADA | 23TS510007 | BS&H | **Verified Match** | Nagamani Naidu = Nagamaninaidu Bonnada |
| 47 | MMK Raju | Bs&H | M KRISHNA RAJU MUDUNURU | 23TS510015 | BS&H | **Verified Match** | MMK Raju = M Krishna Raju Mudunuru |
| 48 | Neelima | Bs&H | Mrs DANTHUMSETTY NEELIMA | 24TS510036 | BS&H | **Verified Match** | Neelima = Danthumsetty Neelima |
| 49 | Dhana Lakshni | Bs&H | Mrs KORADA DHANALAKSHMI | 25TS510046 | BS&H | **Verified Match** | Dhana Lakshni = Korada Dhanalakshmi |
| 50 | Hariprasad | Bs&H | REGULAVALASA HARI PRASAD | 23TS510003 | BS&H | **Verified Match** | Hariprasad = Regulavalasa Hari Prasad |
| 51 | P.V.Ramana | Bs&H | *None in Service Register* | - | - | **Unmatched / Review** | Not in Service Register |
| 52 | Sai Sruthi | Bs&H | MULLU SAISRUTHI | 26TS510069 | BS&H | **Verified Match** | Sai Sruthi = Mullu Saisruthi |
| 53 | Y Sharavan | Bs&H | Mr SRAVAN KUMAR YALLA | 25TS510057 | BS&H | **Verified Match** | Y Sharavan = Sravan Kumar Yalla |
| 54 | Dr. Krishna | Bs&H | *None in Service Register* | - | - | **Unmatched / Review** | Not in Service Register |
| 55 | D. Appa Rao | Bs&H | Mr GUNTU APPA RAO | 23TS510004 | BS&H | **Verified Match** | Appa Rao in BS&H = Guntu Appa Rao |
| 56 | S. Govinda | Bs&H | Mr SARIKA GOVIND | 23TS510010 | BS&H | **Verified Match** | S. Govinda = Sarika Govind |

**Audit Rule Compliance**:
- Unmatched or ambiguous records are strictly tagged for Admin Mapping Review in database & UI.
- No marks are assigned to a Faculty ID without explicit verified mapping or admin resolution.
- The original SAR Name is preserved in the database audit log.

---

## 5. System Architecture & Workflows

### 5.1 Authentication & RBAC
- **Roles**:
  - `admin`: IQAC / Evaluator Admin
  - `faculty`: Individual Faculty Member
- **Faculty Login Identifier**: Permanent NSRIET Faculty ID (e.g. `23TS050009`) + secure password.
- **Admin Access**: Dedicated role with exclusive access to Admin Dashboard, Faculty Management, Month Records, and Lock Month.

### 5.2 Monthly Evaluation Lifecycle
1. **Selection**: User selects Academic Year & Month.
2. **Head 1 (Pass % & IQAC Visit)**:
   - Admin enters Head 1 marks (0 to monthly maximum).
   - Faculty can view Head 1 in read-only mode.
   - Head 1 never requires a document upload.
3. **Heads 2–8 (Self-Appraisal)**:
   - Faculty enters marks bounded by `[0, monthly_max_marks]`.
   - Any Head with monthly weightage = 0 is rendered as `Not Applicable (0 Marks)` and disabled (no file upload required).
   - Any Head with monthly weightage > 0 allows entering marks and uploading reference evidence (PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG).
4. **Draft vs Final Submission**:
   - Faculty can save drafts and freely edit.
   - Single preview of all 8 heads with total calculation before submission.
   - On final submit: Status changes to `Submitted`, displaying one clean confirmation modal (no intermediate disruptive popups).
5. **Month Lock Mechanism**:
   - Admin can Lock a month.
   - Locked months prevent editing marks or altering documents in backend RLS / API rules.

### 5.3 Admin Navigation (Strict Scope)
Sidebar contains strictly 4 items:
1. **Dashboard**: Metrics (Total Faculty, Submitted, Pending, Department breakdown) + Pending Faculty List (EMP ID, Name, Dept).
2. **Faculty Management**: Complete Service Register table (EMP ID, Name, Designation, Department, DOJ, DOR).
3. **Month Records**: Filter by Year, Month, Faculty Name, Department, EMP ID. Open detailed 8-head monthly evaluation modal/drawer.
4. **Lock Month**: Month status management with toggle lock/unlock and audit timestamp.

### 5.4 Excel Export
- Generates `Faculty_Evaluation_[Month]_[Year].xlsx`.
- Columns: `Faculty ID`, `Name`, `Department`, `H1`, `H2`, `H3`, `H4`, `H5`, `H6`, `H7`, `H8`, `Total`, `Status`.
- Respects active Year, Month, and Department filters.
