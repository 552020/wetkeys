export default function Footer({ onWhoami, principal }) {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-6 flex flex-col items-center gap-2">
        <div className="text-center text-sm text-gray-600"></div>
        <div className="flex items-center gap-2 mt-2">
          <button onClick={onWhoami} className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100">
            Whoami
          </button>
          {principal && (
            <span className="text-xs text-blue-800 font-mono bg-blue-50 px-2 py-1 rounded border border-blue-200">
              Principal: {principal.slice(0, 8)}...
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
