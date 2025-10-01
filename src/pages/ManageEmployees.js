import React, { useState } from "react";
import axios from "axios";

const ManageEmployees = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    role: "cashier",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await axios.post("http://localhost:3001/api/employees", formData);
      setMessage(response.data.message);
      setFormData({
        firstName: "",
        lastName: "",
        username: "",
        password: "",
        role: "cashier",
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "An error occurred. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] p-2 sm:p-4 md:p-8">
      <div className="bg-white/80 rounded-2xl shadow-xl border border-gray-200 w-full p-4 sm:p-8">
        <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-blue-900">Create Employee Account</h2>

        {message && (
          <p className={`mb-4 text-center text-sm font-semibold ${
            message.includes("success") 
              ? "text-green-700 bg-green-100 p-2 rounded" 
              : "text-red-700 bg-red-100 p-2 rounded"
          }`}>
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">First Name</label>
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="border border-gray-300 p-2 w-full rounded bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Last Name</label>
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="border border-gray-300 p-2 w-full rounded bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Username</label>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              className="border border-gray-300 p-2 w-full rounded bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="border border-gray-300 p-2 w-full rounded bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="border border-gray-300 p-2 w-full rounded bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="cashier">Cashier</option>
              <option value="encoder">Encoder</option>
              <option value="finance_officer">Finance Officer</option>
            </select>
          </div>
          <button 
            type="submit" 
            className="bg-blue-600 text-white py-2 px-4 rounded w-full font-semibold hover:bg-blue-700 transition shadow-md hover:shadow-lg"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManageEmployees;
