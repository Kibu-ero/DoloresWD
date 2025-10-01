import { motion } from "framer-motion";
import UserNavbar from "../components/UserNavbar";

const UserDashboard = () => {


  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white overflow-hidden">
      <UserNavbar />

      {/* Hero Section with Background Image */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden bg-transparent" style={{overflow: 'hidden'}}>
        <div className="absolute inset-0 bg-black/30 z-10"></div>
        <div 
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            backgroundImage: "url('/dolores.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></div>
        
        <motion.div 
          className="relative z-20 text-center px-6 max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight drop-shadow-lg tracking-wide" style={{color: '#e0f2ff', textShadow: '0 4px 24px rgba(0,0,0,0.7), 0 1px 0 #fff'}}>
            Pure Water, <span className="text-blue-400" style={{textShadow: '0 2px 8px rgba(0,0,0,0.5)'}}>Seamless Service</span>
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Revolutionizing your water experience with cutting-edge technology and unwavering reliability.
          </p>
        </motion.div>

      </section>

    </div>
  );
};

export default UserDashboard;