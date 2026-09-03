"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: { row: number; error: string }[];
}

export default function ImportQuestionsPage() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [csvText, setCsvText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const parseCsv = (text: string): Record<string, string>[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
    return lines.slice(1).map(line => {
      // Handle quoted CSV values
      const values: string[] = [];
      let inQuote = false;
      let current = "";
      for (const char of line + ",") {
        if (char === '"') { inQuote = !inQuote; continue; }
        if (char === "," && !inQuote) { values.push(current.trim()); current = ""; continue; }
        current += char;
      }
      return Object.fromEntries(headers.map((h, i) => [h, values[i] || ""]));
    });
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCsvText(e.target?.result as string || "");
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvText.trim()) { showToast("Please load a CSV file first", "error"); return; }
    const rows = parseCsv(csvText);
    if (rows.length === 0) { showToast("No valid rows found in CSV", "error"); return; }

    setImporting(true);
    try {
      const res = await fetch("/api/admin/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      setResult(data);
      if (data.successful > 0) showToast(`Successfully imported ${data.successful} questions`, "success");
      if (data.failed > 0) showToast(`${data.failed} questions failed to import`, "warning");
    } catch {
      showToast("Import failed", "error");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = `question,option_a,option_b,option_c,option_d,correct_answer,subject,topic,difficulty,marks,explanation
"What is 2 + 2?","3","4","5","6","B","Mathematics","Arithmetic","easy","1","2 + 2 = 4"
"What is the capital of Nigeria?","Lagos","Abuja","Kano","Port Harcourt","B","Government","Geography","easy","1","Abuja is the capital city"`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "questions_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/questions" className="text-gray-400 hover:text-[#1e3a5f]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-black text-[#1e3a5f]">Import Questions</h1>
      </div>

      <div className="space-y-5">
        {/* Template download */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <h2 className="font-bold text-[#1e3a5f] mb-2">CSV Format</h2>
          <p className="text-sm text-gray-600 mb-3">
            Download the template and fill in your questions. Required columns:
            <code className="bg-white px-1 rounded text-xs ml-1">question, option_a, option_b, option_c, option_d, correct_answer, subject</code>
          </p>
          <p className="text-sm text-gray-600 mb-3">
            Optional: <code className="bg-white px-1 rounded text-xs">topic, difficulty (easy/medium/hard), marks, explanation</code>
          </p>
          <button onClick={downloadTemplate}
            className="bg-[#1e3a5f] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#163050] transition-colors">
            ⬇ Download Template
          </button>
        </div>

        {/* File upload */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-bold text-[#1e3a5f] mb-4">Upload CSV File</h2>
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#1e3a5f] transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleFile(file);
            }}
          >
            <div className="text-4xl mb-3">📁</div>
            <p className="text-gray-600 font-medium">Drop CSV file here or click to browse</p>
            <p className="text-gray-400 text-sm mt-1">Supports .csv files</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>

          {csvText && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Preview ({parseCsv(csvText).length} rows found):
              </p>
              <textarea
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-[#1e3a5f] resize-none"
                rows={6}
              />
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <Button onClick={handleImport} loading={importing} disabled={!csvText} className="flex-1">
              {importing ? "Importing..." : "Import Questions"}
            </Button>
            {csvText && (
              <button onClick={() => { setCsvText(""); setResult(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="bg-gray-100 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-semibold">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h2 className="font-bold text-[#1e3a5f] mb-4">Import Results</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-gray-700">{result.total}</p>
                <p className="text-xs text-gray-500">Total Rows</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-green-600">{result.successful}</p>
                <p className="text-xs text-gray-500">Successful</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-red-500">{result.failed}</p>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-red-600 mb-2">Errors:</p>
                <div className="max-h-40 overflow-y-auto border border-red-100 rounded-xl divide-y divide-red-50">
                  {result.errors.map((e, i) => (
                    <div key={i} className="px-4 py-2 text-xs text-red-600">
                      Row {e.row}: {e.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
