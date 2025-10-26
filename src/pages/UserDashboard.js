import { motion } from "framer-motion";
import UserNavbar from "../components/UserNavbar";
import { FiMapPin, FiPhone, FiMail, FiHash } from "react-icons/fi";

const UserDashboard = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <UserNavbar />

      {/* Hero Section with Background Video */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <video 
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/Background.mp4" type="video/mp4" />
        </video>
      </section>

      {/* Contact Information Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Contact Information
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get in touch with us for reliable water services and support
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* CCC Number */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100"
            >
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiHash className="text-2xl text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">CCC Number</h3>
                <p className="text-3xl font-bold text-blue-600">456</p>
              </div>
            </motion.div>

            {/* Address */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100"
            >
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiMapPin className="text-2xl text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Address</h3>
                <p className="text-gray-600 leading-relaxed">
                  Poblacion, Dolores,<br />
                  Abra 2801
                </p>
              </div>
            </motion.div>

            {/* Telephone */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100"
            >
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiPhone className="text-2xl text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Telephone</h3>
                <p className="text-gray-600 font-medium">(074) 752-8478</p>
              </div>
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100"
            >
              <div className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiMail className="text-2xl text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">E-Mail Address</h3>
                <p className="text-gray-600 text-sm break-all">conniecalibuso310@gmail.com</p>
              </div>
            </motion.div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default UserDashboard;
