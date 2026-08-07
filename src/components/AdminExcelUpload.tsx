import React, { useState } from 'react';
import * as XLSX from 'xlsx';

// 1. กำหนด Structure ของข้อมูลหน่วยเลือกตั้ง
export interface UnitData {
  id?: number | string;
  zone: string;
  amphoe: string;
  tambon: string;
  unit_name: string;
  eligible_voters: number;
}

interface AdminExcelUploadProps {
  onSuccess?: () => void;
}

export const AdminExcelUpload: React.FC<AdminExcelUploadProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // ดึง API Web App URL จาก Environment Variable (Render / .env)
  const API_URL = (import.meta as any).env?.VITE_API_URL || '';

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!API_URL) {
      alert('⚠️ ไม่พบ VITE_API_URL กรุณาตั้งค่า Environment Variable บน Render หรือในไฟล์ .env ก่อนครับ');
      return;
    }

    setLoading(true);
    setStatusMessage('⌛ กำลังอ่านข้อมูลจากไฟล์ Excel...');

    try {
      // 1. อ่านไฟล์ Excel ผ่าน XLSX Library
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // แปลงข้อมูลใน Sheet เป็น JSON Array
      const rawData = XLSX.utils.sheet_to_json<any>(worksheet);

      if (!rawData || rawData.length === 0) {
        alert('❌ ไม่พบข้อมูลในไฟล์ Excel');
        setLoading(false);
        return;
      }

      setStatusMessage(`🔄 อ่านข้อมูลสำเร็จ ${rawData.length} รายการ กำลังบันทึกลง Google Sheets...`);

      // 2. Mapping คอลัมน์ภาษาไทยใน Excel ให้ตรงกับ Key ที่ Google Apps Script รองรับ
      const formattedUnits: UnitData[] = rawData.map((row: any, index: number) => ({
        id: Date.now() + index,
        zone: String(row['เขตเลือกตั้ง'] || row['zone'] || ''),
        amphoe: String(row['อำเภอ'] || row['amphoe'] || ''),
        tambon: String(row['ตำบล'] || row['tambon'] || ''),
        unit_name: String(row['หน่วยเลือกตั้ง'] || row['unit_name'] || ''),
        eligible_voters: Number(row['ผู้มีสิทธิเลือกตั้ง'] || row['eligible_voters'] || 0),
      }));

      // 3. ยิง Request ไปยัง Google Apps Script API
      // 💡 ใช้ Content-Type: 'text/plain;charset=utf-8' เพื่อข้ามปัญหา CORS ของ Google Apps Script
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'batch_add_units',
          units: formattedUnits,
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        setStatusMessage(`✅ นำเข้าหน่วยเลือกตั้ง ${formattedUnits.length} รายการ เข้า Google Sheets สำเร็จ!`);
        alert(`🎉 นำเข้าข้อมูลหน่วยเลือกตั้งสำเร็จ ${formattedUnits.length} รายการ!`);
        
        if (onSuccess) onSuccess();
        
        // รีเฟรชหน้าเว็บเพื่อโหลดข้อมูลใหม่จาก Google Sheets
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(result.message || 'เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์');
      }
    } catch (error: any) {
      console.error('Excel Upload Error:', error);
      alert(`❌ เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ${error.message || error}`);
      setStatusMessage('❌ นำเข้าข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
      // เคลียร์ค่า Input File เพื่อให้เลือกไฟล์เดิมซ้ำได้
      event.target.value = '';
    }
  };

  return (
    <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 shadow-xl mb-6 backdrop-blur-md">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30">
              EXCEL BATCH IMPORT
            </span>
            <span className="text-xs text-slate-400">ลำดับชั้น: เขตเลือกตั้ง &gt; อำเภอ &gt; ตำบล &gt; หน่วยเลือกตั้ง</span>
          </div>
          <h3 className="text-xl font-bold text-white mt-2 flex items-center gap-2">
            📊 นำเข้าโครงสร้างหน่วยเลือกตั้งผ่านไฟล์ Excel (.xlsx)
          </h3>
          <p className="text-sm text-slate-300 mt-1">
            คอลัมน์ใน Excel: <code className="text-emerald-300 font-mono">เขตเลือกตั้ง</code>, <code className="text-emerald-300 font-mono">อำเภอ</code>, <code className="text-emerald-300 font-mono">ตำบล</code>, <code className="text-emerald-300 font-mono">หน่วยเลือกตั้ง</code>, <code className="text-emerald-300 font-mono">ผู้มีสิทธิเลือกตั้ง</code>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label
            htmlFor="excel-upload-input"
            className={`cursor-pointer px-6 py-3 rounded-xl font-bold text-white transition-all duration-200 flex items-center gap-2 shadow-lg ${
              loading
                ? 'bg-slate-700 cursor-not-allowed opacity-75'
                : 'bg-emerald-500 hover:bg-emerald-400 active:scale-95 shadow-emerald-950/50'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>กำลังบันทึกข้อมูล...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>เลือกไฟล์ Excel เพื่อนำเข้า</span>
              </>
            )}
          </label>
          <input
            id="excel-upload-input"
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            disabled={loading}
            className="hidden"
          />
        </div>
      </div>

      {statusMessage && (
        <div className="mt-4 p-3 bg-slate-900/80 rounded-xl text-sm font-medium text-emerald-400 border border-emerald-500/20 flex items-center gap-2">
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
};

export default AdminExcelUpload;