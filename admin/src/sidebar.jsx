import {
  FaThLarge,
  FaCalendarAlt,
  FaFileAlt,
  FaCamera,
  FaCompass,
  FaHeadset,
  FaQuestionCircle,
} from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: <FaThLarge />, path: '/' },
    { name: 'Important Dates', icon: <FaCalendarAlt />, path: '/important-dates' },
    { name: 'News', icon: <FaFileAlt />, path: '/news' },
    { name: 'Services', icon: <FaCamera />, path: '/services' },
    // { name: 'Navigation', icon: <FaCompass />, path: '/navigation' },
    { name: 'Help & Support', icon: <FaHeadset />, path: '/help-support' },
    { name: 'About Us', icon: <FaQuestionCircle />, path: '/about-us' },
  ];

  return (
    <div className="w-[250px] h-screen bg-[#13274F] text-white flex flex-col items-center py-6 fixed left-0 top-0">
      {/* Profile Section */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-full bg-gray-300 mb-2" />
        <h1 className="text-base font-semibold">UMConvo Admin</h1>
      </div>

      {/* Search */}
      <div className="w-[85%] mb-6">
        <input
          type="text"
          placeholder="Search"
          className="w-full px-4 py-2 text-sm rounded-full bg-[#E5E5E5] text-black placeholder-gray-500 focus:outline-none"
        />
      </div>

      {/* Menu Items */}
      <nav className="w-full px-4 flex flex-col gap-2">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-150 ${
              location.pathname === item.path
                ? 'bg-white text-[#13274F] font-semibold'
                : 'hover:bg-white hover:text-[#13274F]'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;