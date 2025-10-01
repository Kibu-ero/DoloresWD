import { Link } from "react-router-dom";

const Sidebar = ({ userRole, onClose }) => {
  return (
    <div className="w-64 h-full bg-gray-900 text-white flex flex-col justify-between">
      {/* Top: Logo/App Name */}
      <div className="flex flex-col items-center mt-6">
        <img src="/logo192.png" alt="Billlink Logo" className="w-16 h-16 mb-2 rounded-full shadow" />
        <h2 className="text-xl font-bold mb-4">Billlink</h2>
      </div>
      {/* Middle: Navigation */}
      <nav className="flex-1 flex flex-col items-start px-4 mt-4">
        <ul className="w-full">
          {userRole === "admin" && (
            <>
              <li className="mb-2 w-full">
                <Link to="/dashboard" className="block p-2 rounded hover:bg-gray-700 w-full">Dashboard</Link>
              </li>
              <li className="mb-2 w-full">
                <Link to="/customers" className="block p-2 rounded hover:bg-gray-700 w-full">Customers</Link>
              </li>
              <li className="mb-2 w-full">
                <Link to="/billing" className="block p-2 rounded hover:bg-gray-700 w-full">Billing</Link>
              </li>
            </>
          )}
          {userRole === "cashier" && (
            <>
              <li className="mb-2 w-full">
                <Link to="/payments" className="block p-2 rounded hover:bg-gray-700 w-full">Payments</Link>
              </li>
              <li className="mb-2 w-full">
                <Link to="/reports" className="block p-2 rounded hover:bg-gray-700 w-full">Reports</Link>
              </li>
            </>
          )}
          {userRole === "finance" && (
            <>
              <li className="mb-2 w-full">
                <Link to="/finance-dashboard" className="block p-2 rounded hover:bg-gray-700 w-full">Finance Dashboard</Link>
              </li>
            </>
          )}
        </ul>
      </nav>
      {/* Bottom: Logout */}
      <div className="mb-6 px-4">
        <Link to="/logout" className="block p-2 rounded text-red-400 hover:bg-gray-800 hover:text-red-500 w-full text-center">Logout</Link>
      </div>
      {/* Close button for mobile */}
      {onClose && (
        <button className="md:hidden absolute top-4 right-4 text-white text-2xl" onClick={onClose} aria-label="Close sidebar">&times;</button>
      )}
    </div>
  );
};

export default Sidebar;
