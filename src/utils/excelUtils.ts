import * as XLSX from 'xlsx';

export interface LocationExcelRow {
  zoneName: string;
  districtName: string;
  subDistrictName: string;
  stationName: string;
  totalEligibleVoters: number;
}

// 1. Generate & Download Official Excel Template
export const downloadLocationExcelTemplate = (filename = 'แบบฟอร์มนำเข้าหน่วยเลือกตั้ง.xlsx') => {
  const sampleData = [
    {
      'เขตเลือกตั้ง': 'เขตเลือกตั้งที่ 1',
      'อำเภอ': 'อำเภอเพ็ญ',
      'ตำบล': 'ตำบลเพ็ญ',
      'หน่วยเลือกตั้ง': 'หน่วยที่ 1',
      'ผู้มีสิทธิเลือกตั้ง': 1200,
    },
    {
      'เขตเลือกตั้ง': 'เขตเลือกตั้งที่ 1',
      'อำเภอ': 'อำเภอเพ็ญ',
      'ตำบล': 'ตำบลเพ็ญ',
      'หน่วยเลือกตั้ง': 'หน่วยที่ 2',
      'ผู้มีสิทธิเลือกตั้ง': 1150,
    },
    {
      'เขตเลือกตั้ง': 'เขตเลือกตั้งที่ 1',
      'อำเภอ': 'อำเภอเพ็ญ',
      'ตำบล': 'ตำบลบ้านธาตุ',
      'หน่วยเลือกตั้ง': 'หน่วยที่ 1',
      'ผู้มีสิทธิเลือกตั้ง': 980,
    },
    {
      'เขตเลือกตั้ง': 'เขตเลือกตั้งที่ 2',
      'อำเภอ': 'อำเภอสร้างคอม',
      'ตำบล': 'ตำบลสร้างคอม',
      'หน่วยเลือกตั้ง': 'หน่วยที่ 1',
      'ผู้มีสิทธิเลือกตั้ง': 1050,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  worksheet['!cols'] = [
    { wch: 22 }, // เขตเลือกตั้ง
    { wch: 20 }, // อำเภอ
    { wch: 20 }, // ตำบล
    { wch: 20 }, // หน่วยเลือกตั้ง
    { wch: 20 }, // ผู้มีสิทธิเลือกตั้ง
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายชื่อหน่วยเลือกตั้ง');

  XLSX.writeFile(workbook, filename);
};

// 2. Unmerge merged cells in worksheet to ensure every cell in a merged range gets the value
const unmergeSheetCells = (worksheet: XLSX.WorkSheet) => {
  if (!worksheet['!merges']) return;

  worksheet['!merges'].forEach((range) => {
    const startCellRef = XLSX.utils.encode_cell(range.s);
    const startCell = worksheet[startCellRef];
    if (!startCell) return;

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellRef]) {
          worksheet[cellRef] = { ...startCell };
        }
      }
    }
  });
};

// 3. Helper to test if a row looks like a table header row
const isHeaderRow = (rowArray: any[]): boolean => {
  if (!rowArray || !Array.isArray(rowArray)) return false;
  const str = rowArray.map((cell) => String(cell || '').toLowerCase()).join(' ');
  const keywords = ['อำเภอ', 'ตำบล', 'หน่วย', 'เขต', 'ผู้มีสิทธิ', 'voter', 'station', 'district', 'subdistrict', 'สถานที่', 'ลำดับ'];
  let matches = 0;
  keywords.forEach((kw) => {
    if (str.includes(kw)) matches++;
  });
  return matches >= 1;
};

// 4. Parse uploaded Excel / CSV File with auto-unmerge, header detection, column mapping & carry-forward
export const parseLocationExcelFile = async (file: File): Promise<LocationExcelRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('ไม่พบข้อมูลในไฟล์'));
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
          reject(new Error('ไม่พบ sheet ในไฟล์'));
          return;
        }

        // Unmerge merged cells first so merged range cells inherit values
        unmergeSheetCells(worksheet);

        // Convert worksheet to 2D array matrix
        const matrix = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });

        if (!matrix || matrix.length === 0) {
          resolve([]);
          return;
        }

        // Find header row index (check first 15 rows)
        let headerRowIdx = 0;
        for (let r = 0; r < Math.min(15, matrix.length); r++) {
          if (isHeaderRow(matrix[r])) {
            headerRowIdx = r;
            break;
          }
        }

        const headerRow = matrix[headerRowIdx] || [];

        // Identify column indices for each field
        let zoneColIdx = -1;
        let distColIdx = -1;
        let subColIdx = -1;
        let stationColIdx = -1;
        let votersColIdx = -1;

        headerRow.forEach((cellVal: any, colIdx: number) => {
          const colName = String(cellVal || '').trim().toLowerCase();
          if (!colName) return;

          if (zoneColIdx === -1 && (colName.includes('เขต') || colName.includes('zone'))) {
            zoneColIdx = colIdx;
          }
          if (distColIdx === -1 && (colName.includes('อำเภอ') || colName.includes('อ.') || colName.includes('district'))) {
            distColIdx = colIdx;
          }
          if (subColIdx === -1 && (colName.includes('ตำบล') || colName.includes('ต.') || colName.includes('แขวง') || colName.includes('subdistrict'))) {
            subColIdx = colIdx;
          }
          if (
            stationColIdx === -1 &&
            (colName.includes('หน่วย') ||
              colName.includes('station') ||
              colName.includes('สถานที่') ||
              colName.includes('ลำดับ') ||
              colName === 'ที่' ||
              colName.includes('ชุดที่'))
          ) {
            stationColIdx = colIdx;
          }
          if (
            votersColIdx === -1 &&
            (colName.includes('ผู้มีสิทธิ') || colName.includes('จำนวน') || colName.includes('voter') || colName.includes('ประชากร'))
          ) {
            votersColIdx = colIdx;
          }
        });

        const parsedRows: LocationExcelRow[] = [];

        // Carry-forward state variables (forward filling across empty merged/repeating rows)
        let lastZone = 'เขตเลือกตั้งที่ 1';
        let lastDistrict = '';
        let lastSubDistrict = '';

        for (let r = headerRowIdx + 1; r < matrix.length; r++) {
          const rowArr = matrix[r];
          if (!rowArr || rowArr.length === 0) continue;

          let zoneVal = zoneColIdx >= 0 ? String(rowArr[zoneColIdx] || '').trim() : '';
          let distVal = distColIdx >= 0 ? String(rowArr[distColIdx] || '').trim() : '';
          let subVal = subColIdx >= 0 ? String(rowArr[subColIdx] || '').trim() : '';
          let stationVal = stationColIdx >= 0 ? String(rowArr[stationColIdx] || '').trim() : '';
          let rawVoters = votersColIdx >= 0 ? rowArr[votersColIdx] : null;

          // Forward filling (carry-forward)
          if (zoneVal) {
            lastZone = zoneVal;
          } else {
            zoneVal = lastZone;
          }

          if (distVal) {
            if (distVal !== lastDistrict) {
              lastDistrict = distVal;
              if (!subVal) lastSubDistrict = '';
            }
          } else {
            distVal = lastDistrict;
          }

          if (subVal) {
            lastSubDistrict = subVal;
          } else {
            subVal = lastSubDistrict;
          }

          // Format station name if it's purely a number e.g. "1" -> "หน่วยที่ 1"
          if (stationVal && /^\d+$/.test(stationVal)) {
            stationVal = `หน่วยที่ ${stationVal}`;
          }

          // Parse voters
          let totalEligibleVoters = 1000;
          if (rawVoters !== null && rawVoters !== undefined && String(rawVoters).trim() !== '') {
            const parsedV = parseInt(String(rawVoters).replace(/,/g, ''), 10);
            if (!isNaN(parsedV) && parsedV > 0) {
              totalEligibleVoters = parsedV;
            }
          }

          // Skip completely empty rows
          if (!stationVal && !subVal && !distVal) continue;

          if (!stationVal) {
            if (subVal.includes('หน่วย')) {
              stationVal = subVal;
              subVal = lastSubDistrict;
            } else {
              continue;
            }
          }

          parsedRows.push({
            zoneName: zoneVal || 'เขตเลือกตั้งที่ 1',
            districtName: distVal,
            subDistrictName: subVal,
            stationName: stationVal,
            totalEligibleVoters,
          });
        }

        // Secondary fallback if matrix parser produced 0 rows
        if (parsedRows.length === 0) {
          const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
          let fbZone = 'เขตเลือกตั้งที่ 1';
          let fbDist = '';
          let fbSub = '';

          rawRows.forEach((row) => {
            const zKey = Object.keys(row).find((k) => k.includes('เขต') || k.toLowerCase().includes('zone'));
            const dKey = Object.keys(row).find((k) => k.includes('อำเภอ') || k.toLowerCase().includes('district'));
            const sKey = Object.keys(row).find((k) => k.includes('ตำบล') || k.includes('แขวง') || k.toLowerCase().includes('subdistrict'));
            const stKey = Object.keys(row).find((k) => k.includes('หน่วย') || k.includes('สถานที่') || k.includes('ลำดับ') || k.toLowerCase().includes('station'));
            const vKey = Object.keys(row).find((k) => k.includes('ผู้มีสิทธิ') || k.includes('จำนวน') || k.toLowerCase().includes('voter'));

            let zVal = zKey ? String(row[zKey] || '').trim() : '';
            let dVal = dKey ? String(row[dKey] || '').trim() : '';
            let subVal = sKey ? String(row[sKey] || '').trim() : '';
            let stVal = stKey ? String(row[stKey] || '').trim() : '';
            let vVal = vKey ? row[vKey] : 1000;

            if (zVal) fbZone = zVal; else zVal = fbZone;
            if (dVal) fbDist = dVal; else dVal = fbDist;
            if (subVal) fbSub = subVal; else subVal = fbSub;

            if (stVal && /^\d+$/.test(stVal)) stVal = `หน่วยที่ ${stVal}`;

            if (stVal) {
              parsedRows.push({
                zoneName: zVal || 'เขตเลือกตั้งที่ 1',
                districtName: dVal,
                subDistrictName: subVal,
                stationName: stVal,
                totalEligibleVoters: parseInt(String(vVal).replace(/,/g, ''), 10) || 1000,
              });
            }
          });
        }

        resolve(parsedRows);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

