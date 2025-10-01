import React, { useEffect, useState } from "react";
import axios from "../api"; // adjust if your axios instance is elsewhere

const AdminFileReview = () => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState("");

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/uploads/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(res.data);
    } catch (err) {
      setError("Failed to fetch files");
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleView = (file) => {
    setSelectedFile(file);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedFile(null);
  };

  const handleApprove = async () => {
    if (!selectedFile) return;
    setActionLoading(true);
    try {
      console.log('Approving payment for file:', selectedFile);
      
      // Update payment submission status to approved
      const response = await axios.put(`/uploads/file/${selectedFile.id}/status`, { status: "approved" });
      console.log('Approval response:', response.data);
      
      setNotification("Payment approved successfully!");
      
      // Remove the file from the list since it's no longer pending
      setFiles(files.filter(f => f.id !== selectedFile.id));
      handleCloseModal();
    } catch (err) {
      console.error('Error approving payment:', err);
      const errorMessage = err.response?.data?.error || err.message || "Failed to approve payment.";
      setNotification(`Failed to approve payment: ${errorMessage}`);
    } finally {
      setActionLoading(false);
      setTimeout(() => setNotification(""), 5000);
    }
  };

  const handleReject = async () => {
    if (!selectedFile) return;
    setActionLoading(true);
    try {
      console.log('Rejecting payment for file:', selectedFile);
      
      // Update payment submission status to rejected
      const response = await axios.put(`/uploads/file/${selectedFile.id}/status`, { status: "rejected" });
      console.log('Rejection response:', response.data);
      
      setNotification("Payment rejected successfully!");
      
      // Remove the file from the list since it's no longer pending
      setFiles(files.filter(f => f.id !== selectedFile.id));
      handleCloseModal();
    } catch (err) {
      console.error('Error rejecting payment:', err);
      const errorMessage = err.response?.data?.error || err.message || "Failed to reject payment.";
      setNotification(`Failed to reject payment: ${errorMessage}`);
    } finally {
      setActionLoading(false);
      setTimeout(() => setNotification(""), 5000);
    }
  };

  const handleDebug = async () => {
    try {
      const response = await axios.get('/uploads/debug/payment-submissions');
      console.log('Debug data:', response.data);
      setNotification('Debug data logged to console. Check browser console for details.');
    } catch (error) {
      console.error('Debug error:', error);
      setNotification('Debug failed: ' + (error.response?.data?.error || error.message));
    }
    setTimeout(() => setNotification(""), 5000);
  };

  return (
    <div className="mt-4 sm:mt-8 overflow-x-auto p-2 sm:p-0">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg md:text-xl font-bold">Pending Payment Proofs</h2>
        <div className="flex gap-2">
          <button
            onClick={handleDebug}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Debug
          </button>
          <button
            onClick={fetchFiles}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
      {notification && <div className="mb-4 text-center text-white bg-blue-600 rounded p-2">{notification}</div>}
      {error && <div className="text-red-500">{error}</div>}
      {files.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <div className="text-gray-500 text-lg mb-2">No pending payment proofs</div>
          <div className="text-gray-400 text-sm">All payment proofs have been reviewed</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 text-xs md:text-sm">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Customer</th>
                <th className="px-4 py-2 border">Email</th>
                <th className="px-4 py-2 border">File</th>
                <th className="px-4 py-2 border">Type</th>
                <th className="px-4 py-2 border">Uploaded</th>
                <th className="px-4 py-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {files.map(file => (
                <tr key={file.id}>
                  <td className="px-4 py-2 border">{file.first_name} {file.last_name}</td>
                  <td className="px-4 py-2 border">{file.email}</td>
                  <td className="px-4 py-2 border">{file.file_name}</td>
                  <td className="px-4 py-2 border">{file.file_type}</td>
                  <td className="px-4 py-2 border">{new Date(file.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2 border">
                    <button
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 mr-2"
                      onClick={() => handleView(file)}
                    >
                      View
                    </button>
                    <a
                      href={`http://localhost:3001/uploads/payment-proofs/${file.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      download
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Modal for viewing and confirming payment proof */}
      {modalOpen && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-0">
          <div className="bg-white rounded-xl p-4 sm:p-8 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              aria-label="Close modal"
            >
              ×
            </button>
            <h3 className="text-xl font-bold mb-4 text-blue-900">Payment Proof</h3>
            <div className="mb-4 flex flex-col items-center">
              <img
                src={`http://localhost:3001/uploads/${selectedFile.file_path}`}
                alt="Payment Proof"
                className="rounded-lg shadow border-2 border-blue-200 max-h-80 object-contain"
                style={{ background: '#f8fafc', maxWidth: '100%' }}
              />
            </div>
            <div className="mb-4">
              <div><span className="font-semibold">Customer:</span> {selectedFile.first_name} {selectedFile.last_name}</div>
              <div><span className="font-semibold">Email:</span> {selectedFile.email}</div>
              <div><span className="font-semibold">File Name:</span> {selectedFile.file_name}</div>
              <div><span className="font-semibold">Type:</span> {selectedFile.file_type}</div>
              <div><span className="font-semibold">Uploaded:</span> {new Date(selectedFile.created_at).toLocaleString()}</div>
              {/* Bill information will be fetched when needed */}
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFileReview;
