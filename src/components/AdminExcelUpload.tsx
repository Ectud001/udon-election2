import React, { useState } from 'react';
import * as XLSX from 'xlsx';

interface AdminExcelUploadProps {
  onSuccess?: () => void;
}

// ดึง API URL จากไฟล์ .env หรือ Environment Variable ของ Render
const API_URL = (import.meta as any).env?.VITE_API_URL || '';

export const AdminExcelUpload: React.FC<AdminExcelUploadProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!API_URL) {
      alert('⚠️ ไม่พบ VITE_API_URL กรุณาตั้งค่า Environment Variable บน Render ก่อน');
      return;
    }

    setLoading(true);
    setStatusMessage('⏳ กำลังอ่านข้อมูลจากไฟล์ Excel...');

    try {
      // 1. อ่านไฟล์ Excel
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // แปลงข้อมูล Sheet เป็น JSON Array
      const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

      if (!rawData || rawData.length === 0) {
        alert('❌ ไม่พบข้อมูลในไฟล์ Excel');
        setLoading(false);
        setStatusMessage('');
        return;
      }

      // 2. จัดฟิลด์ข้อมูลให้รองรับทั้งชื่อภาษาไทยและภาษาอังกฤษ
      const parsedUnits = rawData.map((row, index) => {
        return {
          id: row['id'] || row['ID'] || row['ลำดับ'] || index + 1,
          zone: row['zone'] || row['Zone'] || row['เขต'] || row['เขตเลือกตั้ง'] || '',
          amphoe: row['amphoe'] || row['Amphoe'] || row['อำเภอ'] || '',
          tambon: row['tambon'] || row['Tambon'] || row['ตำบล'] || '',
          unit_name: row['unit_name'] || row['Unit_Name'] || row['หน่วย'] || row['หน่วยเลือกตั้ง'] || row['ชื่อหน่วย'] || '',
          eligible_voters: Number(row['eligible_voters'] || row['Eligible_Voters'] || row['ผู้มีสิทธิ'] || row['จำนวนผู้มีสิทธิ'] || 0)
        };
      });

      setStatusMessage(`⏳ กำลังส่งข้อมูล ${parsedUnits.length} รายการ ไปยัง Google Sheets...`);

      // 3. ยิง API ไปหา Google Apps Script
      // 💡 ข้อสังเกต: ใช้ 'Content-Type': 'text/plain;charset=utf-8' เพื่อเลี่ยงปัญหา CORS Preflight
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: 'batch_add_units',
          units: parsedUnits
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        alert(`✅ นำเข้าข้อมูลสำเร็จทั้งหมด ${result.imported_count || parsedUnits.length} รายการ!`);
        setStatusMessage('✅ บันทึกข้อมูลเข้าชีทเรียบร้อยแล้ว');
        if (onSuccess) onSuccess();
      } else {
        alert(`❌ เกิดข้อผิดพลาดจาก Google Script: ${result.message}`);
        setStatusMessage(`❌ ล้มเหลว: ${result.message}`);
      }

    } catch (error: any) {
      console.error('Upload Error:', error);
      alert(`❌ เกิดข้อผิดพลาดในการเชื่อมต่อ: ${error.message || error}`);
      setStatusMessage('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
      event.target.value = ''; // เคลียร์ช่องเลือกไฟล์
    }
  };

  return (
    <div className="p-4 border border-emerald-500/30 rounded-xl bg-slate-900/80 text-white shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-emerald-400">📥 นำเข้าโครงสร้างหน่วยเลือกตั้งผ่านไฟล์ Excel (.xlsx)</h3>
          <p className="text-xs text-slate-400 mt-1">
            รองรับหัวข้อคอลัมน์: id, zone, amphoe, tambon, unit_name, eligible_voters
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className={`cursor-pointer px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
            loading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
          }`}>
            <span>{loading ? '⏳ กำลังประมวลผล...' : '📂 เลือกไฟล์ Excel เพื่อนำเข้า'}</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              disabled={loading}
              className="hidden"
            />
          </label>

          {statusMessage && (
            <span className="text-xs font-medium text-amber-300 bg-amber-950/40 px-3 py-1.5 rounded-md border border-amber-500/30">
              {statusMessage}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};