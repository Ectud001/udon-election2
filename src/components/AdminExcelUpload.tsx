import React, { useState } from 'react';
import * as XLSX from 'xlsx';

interface AdminExcelUploadProps {
  onSuccess?: () => void;
}

// 🔴 Web App URL ของ Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycby0jj12DRFqG-oEmanlzj5m4JxsMd3ltLqAle6W9SdYsrr--dHjxDZHwJTAxlQEH8RDCQ/exec";

export const AdminExcelUpload: React.FC<AdminExcelUploadProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMessage('กำลังอ่านไฟล์ Excel...');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // ดึงข้อมูลจาก Sheet แรก
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // แปลงเป็น JSON
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          alert('ไม่พบข้อมูลในไฟล์ Excel');
          setLoading(false);
          return;
        }

        setStatusMessage(`กำลังส่งข้อมูล ${jsonData.length} รายการ ไปยัง Google Sheets...`);

        // แปลงโครงสร้างข้อมูลให้ตรงกับ Google Apps Script
        const unitsData = jsonData.map((row: any, index: number) => ({
          id: row.id || row.ID || (index + 1),
          zone: row.zone || row['เขต'] || row['เขตเลือกตั้ง'] || '',
          amphoe: row.amphoe || row['อำเภอ'] || '',
          tambon: row.tambon || row['ตำบล'] || '',
          unit_name: row.unit_name || row['หน่วย'] || row['ชื่อหน่วยเลือกตั้ง'] || '',
          eligible_voters: row.eligible_voters || row['ผู้มีสิทธิ'] || row['จำนวนผู้มีสิทธิเลือกตั้ง'] || 0
        }));

        // 🚀 ส่งข้อมูลไปยัง Google Apps Script (หลบ CORS ด้วย text/plain)
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            action: 'batch_add_units',
            units: unitsData
          }),
        });

        const result = await response.json();

        if (result.status === 'success') {
          alert(`✅ นำเข้าข้อมูลสำเร็จเรียบร้อยแล้ว (${result.imported_count || unitsData.length} รายการ)`);
          if (onSuccess) onSuccess();
        } else {
          alert(`❌ เกิดข้อผิดพลาดจากเซิร์ฟเวอร์: ${result.message}`);
        }

      } catch (err: any) {
        console.error("Upload error:", err);
        alert(`❌ เกิดข้อผิดพลาดในการประมวลผล: ${err.message || err}`);
      } finally {
        setLoading(false);
        setStatusMessage('');
        event.target.value = ''; // Reset input file
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 text-white">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">นำเข้าโครงสร้างหน่วยเลือกตั้งผ่านไฟล์ Excel (.xlsx)</h3>
          <p className="text-sm text-slate-400">
            ออกแบบมาสำหรับการสร้าง/อัปเดตข้อมูล อำเภอ ตำบล หน่วยเลือกตั้ง ครั้งละหลายหน่วย
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className={`cursor-pointer px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 font-semibold text-sm transition-all flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {loading ? '⏳ กำลังประมวลผล...' : '📁 เลือกไฟล์ Excel เพื่อนำเข้า'}
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleFileUpload}
              disabled={loading}
            />
          </label>
        </div>
      </div>
      {statusMessage && (
        <p className="mt-2 text-sm text-amber-400 animate-pulse">{statusMessage}</p>
      )}
    </div>
  );
};