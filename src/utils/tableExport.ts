export type ExportCell = string | number | null | undefined;

export function createCsvBlob(headers: string[], rows: ExportCell[][]): Blob {
  const csvCell = (value: ExportCell) => {
    let text = value == null ? "" : String(value);
    if (/^[\s]*[=+@\-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const csv =
    "\uFEFF" +
    [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  return new Blob([csv], { type: "text/csv;charset=utf-8" });
}

export async function createXlsxBlob(
  sheetName: string,
  headers: string[],
  rows: ExportCell[][],
  widths: number[],
): Promise<Blob> {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  workbook.creator = "DMAR";
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  worksheet.columns = headers.map((header, index) => ({
    header,
    key: `column_${index}`,
    width: widths[index] ?? 20,
  }));
  worksheet.addRows(rows.map((row) => row.map((value) => value ?? "")));
  worksheet.autoFilter = {
    from: "A1",
    to: `${columnName(headers.length)}1`,
  };
  const header = worksheet.getRow(1);
  header.height = 24;
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF166534" },
  };
  header.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) row.alignment = { vertical: "top", wrapText: true };
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function columnName(columnNumber: number): string {
  let name = "";
  let current = columnNumber;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
}
