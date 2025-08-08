import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  HomeIcon,
  StethoscopeIcon,
  FileTextIcon,
  LayersIcon,
  FolderIcon,
  SearchIcon,
  UserIcon,
  SettingsIcon,
  FlaskIcon
} from '../icons/MedicalIcons';


const SideNav = () => {
  const { logout } = useAuth();

  return (
    <nav className="side-nav">
      <div className="side-nav-header">
        <div className="logo">LumiPath</div>
      </div>
      <ul className="side-nav-links">
        <li><NavLink to="/" end><HomeIcon size={20} /><span>Home</span></NavLink></li>
        <li><NavLink to="/protocol"><FlaskIcon size={20} /><span>Protocol & Study Design Generator</span></NavLink></li>
        <li><NavLink to="/diagnosis"><StethoscopeIcon size={20} /><span>Disease Diagnosis</span></NavLink></li>
        <li><NavLink to="/unified-regulatory"><FileTextIcon size={20} /><span>Regulatory Documents</span></NavLink></li>
        <li><NavLink to="/enhanced-analysis"><LayersIcon size={20} /><span>Enhanced Medical Analysis</span></NavLink></li>
        <li><NavLink to="/clinical-dossier"><FolderIcon size={20} /><span>Clinical Dossier Compiler</span></NavLink></li>
        <li><NavLink to="/query"><SearchIcon size={20} /><span>Query Assistant</span></NavLink></li>
      </ul>
      <div className="side-nav-footer">
        <NavLink to="/profile"><UserIcon size={20} /><span>Profile</span></NavLink>
        <NavLink to="/settings"><SettingsIcon size={20} /><span>Settings</span></NavLink>
        <button onClick={logout} className="logout-button">
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default SideNav;