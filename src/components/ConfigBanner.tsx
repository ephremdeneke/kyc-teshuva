import { Settings } from 'lucide-react'

export default function ConfigBanner() {
  return (
    <div className="card p-4 border-2 border-amber-300 bg-amber-50">
      <div className="flex items-start gap-3">
        <Settings size={20} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-amber-800">Setup Required</h3>
          <p className="text-xs text-amber-700 mt-1">
            Connect to Google Sheets to load participant data.
          </p>
          <ol className="text-xs text-amber-700 mt-2 space-y-1 list-decimal list-inside">
            <li>Deploy <code className="bg-amber-100 px-1 rounded">backend/Code.gs</code> as Google Apps Script Web App</li>
            <li>Create <code className="bg-amber-100 px-1 rounded">.env</code> in project root:</li>
          </ol>
          <pre className="bg-amber-100 rounded-lg p-2 mt-2 text-[11px] font-mono text-amber-900 overflow-x-auto">
{`VITE_API_URL=https://script.google.com/macros/s/YOUR_URL/exec`}
          </pre>
          <p className="text-xs text-amber-600 mt-2">Then restart the dev server.</p>
        </div>
      </div>
    </div>
  )
}
