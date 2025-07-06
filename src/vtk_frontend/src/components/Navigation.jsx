export default function Navigation({ currentView, setCurrentView }) {
  return (
    <nav className="flex space-x-8 border-b border-gray-200 mb-8">
      <button
        onClick={() => setCurrentView("files")}
        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
          currentView === "files"
            ? "border-blue-500 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }`}
      >
        Files
      </button>
      <button
        onClick={() => setCurrentView("profile")}
        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
          currentView === "profile"
            ? "border-blue-500 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }`}
      >
        Profile
      </button>
      <button
        onClick={() => setCurrentView("users")}
        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
          currentView === "users"
            ? "border-blue-500 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        }`}
      >
        Users
      </button>
    </nav>
  );
}
