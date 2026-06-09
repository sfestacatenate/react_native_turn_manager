import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { calculateShiftHours, formatHours, formatWeekRange, getWeekDays, toISODate } from './date';
import { Employee, Location, Shift } from '../types';

function escapeHtml(value: string | number | null | undefined): string {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

interface ExportPayload {
  businessName: string;
  employees: Employee[];
  locations: Location[];
  shifts: Shift[];
  weekStart: Date;
}

function buildWeeklyScheduleHtml({ businessName, employees, locations, shifts, weekStart }: ExportPayload): string {
  const days = getWeekDays(weekStart);
  const activeEmployees = employees.filter((employee) => employee.active !== false);

  const rows = activeEmployees.map((employee) => {
    const total = shifts
      .filter((shift) => shift.employeeId === employee.id)
      .reduce((sum, shift) => sum + calculateShiftHours(shift), 0);

    const cells = days.map((day) => {
      const date = toISODate(day);
      const employeeShifts = shifts
        .filter((shift) => shift.employeeId === employee.id && shift.date === date)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      if (employeeShifts.length === 0) return '<td class="muted">-</td>';

      const content = employeeShifts.map((shift) => {
        const location = locations.find((item) => item.id === shift.locationId);
        return `<div class="shift"><strong>${escapeHtml(shift.startTime)}-${escapeHtml(shift.endTime)}</strong><br/><span>${escapeHtml(location?.name || 'Sede')}</span></div>`;
      }).join('');

      return `<td>${content}</td>`;
    }).join('');

    return `
      <tr>
        <td class="employee"><strong>${escapeHtml(employee.name)}</strong><br/><span>${escapeHtml(employee.role)}</span></td>
        ${cells}
        <td class="total">${escapeHtml(formatHours(total))}</td>
      </tr>
    `;
  }).join('');

  const headerDays = days.map((day) => {
    const label = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(day);
    return `<th>${escapeHtml(label)}</th>`;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { size: A4 landscape; margin: 22px; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; }
          h1 { margin: 0 0 4px; font-size: 24px; }
          p { margin: 0 0 18px; color: #4b5563; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #f3f4f6; text-align: left; padding: 8px; border: 1px solid #d1d5db; }
          td { vertical-align: top; padding: 8px; border: 1px solid #d1d5db; min-height: 42px; }
          .employee { width: 140px; }
          .employee span { color: #6b7280; }
          .shift { margin-bottom: 6px; line-height: 1.25; }
          .shift span { color: #4b5563; }
          .muted { color: #9ca3af; text-align: center; }
          .total { font-weight: 700; white-space: nowrap; }
          .footer { margin-top: 14px; font-size: 10px; color: #6b7280; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(businessName || 'Turni')}</h1>
        <p>Turnazione settimanale: ${escapeHtml(formatWeekRange(weekStart))}</p>
        <table>
          <thead>
            <tr>
              <th>Dipendente</th>
              ${headerDays}
              <th>Totale</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">PDF generato offline dall'app Turni Offline.</div>
      </body>
    </html>
  `;
}

export async function exportWeeklyPdf(payload: ExportPayload): Promise<{ uri: string; shared: boolean }> {
  const html = buildWeeklyScheduleHtml(payload);
  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    return { uri, shared: false };
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Condividi turnazione',
    UTI: 'com.adobe.pdf'
  });

  return { uri, shared: true };
}
