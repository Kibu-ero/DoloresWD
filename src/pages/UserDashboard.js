import { motion } from "framer-motion";
import UserNavbar from "../components/UserNavbar";
import { FiMapPin, FiPhone, FiMail, FiHash } from "react-icons/fi";

const UserDashboard = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-brand-50 to-white">
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
          <source src="/dlrs.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay for better text readability - lighter overlay for clearer video */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-700/50 to-brand-400/10"></div>
        
        {/* Left Side Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Seamless Water Services
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
                Providing reliable and accessible water supply to the community of Dolores, Abra.
              </p>
              <div className="space-y-4 text-lg text-white">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>24/7 Water Supply</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Easy Online Billing</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Fast Payment Processing</span>
                </div>
                
              </div>
            </motion.div>
          </div>
        </div>
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
              className="bg-brand-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-brand-100"
            >
              <div className="text-center">
                <div className="bg-brand-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiHash className="text-2xl text-brand-700" />
                </div>
                <h3 className="text-xl font-semibold text-brand-700 mb-2">CCC Number</h3>
                <p className="text-3xl font-bold text-brand-700">456</p>
              </div>
            </motion.div>

            {/* Address */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-brand-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-brand-100"
            >
              <div className="text-center">
                <div className="bg-brand-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiMapPin className="text-2xl text-brand-700" />
                </div>
                <h3 className="text-xl font-semibold text-brand-700 mb-2">Address</h3>
                <p className="text-gray-700 leading-relaxed">
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
              className="bg-brand-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-brand-100"
            >
              <div className="text-center">
                <div className="bg-brand-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiPhone className="text-2xl text-brand-700" />
                </div>
                <h3 className="text-xl font-semibold text-brand-700 mb-2">Telephone</h3>
                <p className="text-gray-700 font-medium">(074) 752-8478</p>
              </div>
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-brand-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-brand-100"
            >
              <div className="text-center">
                  <div className="bg-brand-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiMail className="text-2xl text-brand-700" />
                </div>
                <h3 className="text-xl font-semibold text-brand-700 mb-2">E-Mail Address</h3>
                <p className="text-gray-700 text-sm break-all">conniecalibuso310@gmail.com</p>
              </div>
            </motion.div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default UserDashboard;

