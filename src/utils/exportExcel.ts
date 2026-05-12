import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { PmSiteScheduleDto } from '../types/pmSchedule';
import mknLogo from '../assets/MKN.png';

const MONTHS_FULL = [
  "January", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const exportPmScheduleToExcel = async (year: number, sites: PmSiteScheduleDto[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`PM Schedule ${year}`);

  // Setup Columns (3 base + 24 weeks = 27 columns total -> A to AA)
  const columns = [
    { key: 'no', width: 5 },
    { key: 'site', width: 15 },
    { key: 'pm', width: 35 },
  ];
  for (let i = 0; i < 24; i++) {
    columns.push({ key: `w${i}`, width: 6 });
  }
  worksheet.columns = columns;

  // --- BIG HEADER BANNER ---
  // Merge A1 to AA4 for the big blue header
  worksheet.mergeCells('A1', 'AA4');
  const bannerCell = worksheet.getCell('A1');
  bannerCell.value = 'Jadwal Preventive Maintenance\nCommsroom, Radio Microwave, Radio Repeater Konvensional - Trunking, PABX dan CATV';
  bannerCell.font = { name: 'Arial', size: 12, bold: true };
  bannerCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  bannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B0F0' } };

  // Add Logo to the left side of the banner
  try {
    const response = await fetch(mknLogo);
    const blob = await response.blob();
    const base64data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    const imageId = workbook.addImage({
      base64: base64data,
      extension: 'png',
    });

    // Logo coordinates (tl = top-left, br = bottom-right)
    worksheet.addImage(imageId, {
      tl: { col: 0.5, row: 0.5 },
      br: { col: 4, row: 3.5 },
      editAs: 'absolute'
    } as any);
  } catch (error) {
    console.error('Failed to add logo to Excel', error);
  }

  // Helper to draw a semester table
  const drawSemesterTable = (startRow: number, semester: 1 | 2) => {
    const monthStartOffset = semester === 1 ? 0 : 6;
    
    // Title row
    worksheet.mergeCells(`A${startRow}:W${startRow}`);
    const titleCell = worksheet.getCell(`A${startRow}`);
    titleCell.value = `Semester ${semester}`;
    titleCell.font = { bold: true, size: 11 };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

    worksheet.mergeCells(`X${startRow}:AA${startRow}`);
    const yearCell = worksheet.getCell(`X${startRow}`);
    yearCell.value = `Tahun : ${year}`;
    yearCell.font = { bold: true, size: 10 };
    yearCell.alignment = { vertical: 'middle', horizontal: 'right' };
    
    worksheet.getRow(startRow).height = 20;

    const headerRow1 = worksheet.getRow(startRow + 1);
    const headerRow2 = worksheet.getRow(startRow + 2);
    headerRow1.height = 20;
    headerRow2.height = 20;

    // Merge No, Site, PM
    worksheet.mergeCells(`A${startRow + 1}:A${startRow + 2}`);
    worksheet.mergeCells(`B${startRow + 1}:B${startRow + 2}`);
    worksheet.mergeCells(`C${startRow + 1}:C${startRow + 2}`);

    headerRow1.getCell(1).value = 'No.';
    headerRow1.getCell(2).value = 'Site';
    headerRow1.getCell(3).value = 'PM';

    [1, 2, 3].forEach(col => {
      const cell = headerRow1.getCell(col);
      cell.font = { bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      headerRow2.getCell(col).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Month & Week Headers
    for (let m = 0; m < 6; m++) {
      const startCol = 4 + (m * 4);
      const endCol = startCol + 3;
      
      const getColLetter = (c: number) => {
        let temp = c;
        let letter = '';
        while (temp > 0) {
          let remainder = (temp - 1) % 26;
          letter = String.fromCharCode(65 + remainder) + letter;
          temp = Math.floor((temp - remainder) / 26);
        }
        return letter;
      };

      const startLetter = getColLetter(startCol);
      const endLetter = getColLetter(endCol);

      worksheet.mergeCells(`${startLetter}${startRow + 1}:${endLetter}${startRow + 1}`);
      const monthCell = headerRow1.getCell(startCol);
      monthCell.value = MONTHS_FULL[monthStartOffset + m];
      monthCell.font = { bold: true };
      monthCell.alignment = { vertical: 'middle', horizontal: 'center' };
      
      for(let i=startCol; i<=endCol; i++){
        headerRow1.getCell(i).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      }

      for (let w = 1; w <= 4; w++) {
        const weekCol = startCol + (w - 1);
        const weekCell = headerRow2.getCell(weekCol);
        weekCell.value = `Week${w}`;
        weekCell.font = { bold: true, size: 9 };
        weekCell.alignment = { vertical: 'middle', horizontal: 'center' };
        weekCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      }
    }

    let currentRow = startRow + 3;

    sites.forEach((site, index) => {
      const noDevice = site.devices.length === 0;
      const deviceCount = noDevice ? 1 : site.devices.length;
      const dStartRow = currentRow;
      const dEndRow = currentRow + deviceCount - 1;

      if (deviceCount > 1) {
        worksheet.mergeCells(`A${dStartRow}:A${dEndRow}`);
        worksheet.mergeCells(`B${dStartRow}:B${dEndRow}`);
      }

      const noCell = worksheet.getCell(`A${dStartRow}`);
      noCell.value = index + 1;
      noCell.alignment = { vertical: 'middle', horizontal: 'center' };
      noCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

      const siteCell = worksheet.getCell(`B${dStartRow}`);
      siteCell.value = site.siteName;
      siteCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      siteCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

      if (noDevice) {
        const row = worksheet.getRow(currentRow);
        row.getCell(3).value = 'Belum ada PM';
        row.getCell(3).font = { italic: true, color: { argb: 'FF888888' } };
        row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' };
        for (let c = 1; c <= 27; c++) {
          row.getCell(c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        }
        currentRow++;
      } else {
        site.devices.forEach((device) => {
          const row = worksheet.getRow(currentRow);
          row.height = 20;

          const pmCell = row.getCell(3);
          pmCell.value = device.deviceName;
          pmCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

          row.getCell(1).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          row.getCell(2).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          pmCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

          for (let m = 0; m < 6; m++) {
            for (let w = 1; w <= 4; w++) {
              const colIdx = 4 + (m * 4) + (w - 1);
              const cell = row.getCell(colIdx);
              cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

              const isScheduled = device.tasks.some(t => t.month === monthStartOffset + m + 1 && t.week === w);
              if (isScheduled) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } };
              }
            }
          }
          currentRow++;
        });
      }
    });

    return currentRow;
  };

  // Draw Semester 1
  const endOfSemester1 = drawSemesterTable(6, 1);
  
  // Draw Semester 2
  drawSemesterTable(endOfSemester1 + 3, 2);

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Jadwal_PM_${year}.xlsx`);
};
