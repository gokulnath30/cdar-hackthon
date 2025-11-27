import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, MapPin, ShoppingBag, LogOut, Mic, User, Volume2, VolumeX } from "lucide-react";
import { Button } from "../components/ui/button";
import { useVoiceAssistant } from "../hooks/useVoiceAssistant";
import VoiceOverlay from "./VoiceOverlay";

const navItems = [
  { to: "/dashboard", label: "Home", Icon: Home },
  { to: "/store_page", label: "Stores", Icon: MapPin },
  { to: "/products", label: "Products", Icon: ShoppingBag },
  { to: "/profile", label: "Profile", Icon: User },
];

const BottomNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  
  // 1. Initialize the custom hook
  // This contains all the recording, transcribing, and LLM logic
  const voice = useVoiceAssistant();

  // Standard navigation logic
  if (pathname === "/" || pathname === "/logout") return null;

  const handleLogout = () => {
    localStorage.removeItem("audit_app_current_user");
    navigate("/");
  };

  return (
    <>
      {/* 2. Connect the Overlay Component */}
      {/* We spread {...voice} to pass all state variables (transcript, isRecording, etc.) as props */}
      <VoiceOverlay {...voice} />

      {/* 3. Standard Navigation Bar UI */}
      <nav className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-lg px-3 bg-card/100 backdrop-blur shadow-lg z-[100] md:hidden">
        <ul className="flex justify-around items-center py-2">
          {navItems.map(({ to, label, Icon }) => (
            <li key={`${to}-${label}`} className="flex-none">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                    isActive
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
                aria-label={label}
              >
                <Icon className="w-5 h-5" />
                <span className="select-none">{label}</span>
              </NavLink>
            </li>
          ))}

          <li className="flex-none">
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-full text-xs text-red-500 hover:text-red-600 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
              <span className="select-none">Logout</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Mute Button */}
      <Button
        size="icon"
        className={`fixed bottom-40 right-8 rounded-full shadow-lg w-10 h-10 z-50 transition-all md:hidden ${
          voice.isMuted 
            ? "bg-gray-200 text-gray-600 hover:bg-gray-300" 
            : "bg-white text-primary hover:bg-gray-50"
        }`}
        onClick={voice.toggleMute}
        aria-label={voice.isMuted ? "Unmute AI" : "Mute AI"}
      >
        {voice.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </Button>

      {/* 4. Floating Action Button (FAB) */}
      {/* Connected to the hook's state (isRecording) and handler (handleMicClick) */}
      <Button
        size="icon"
        className={`fixed bottom-24 right-6 rounded-full shadow-xl w-14 h-14 z-50 transition-transform hover:scale-105 md:hidden ${
          voice.isRecording
            ? "bg-red-600 hover:bg-red-700"
            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        }`}
        onClick={voice.handleMicClick}
        aria-label={voice.isRecording ? "Stop recording" : "Start recording"}
      >
        <Mic className={`w-6 h-6 ${voice.isRecording ? "animate-pulse" : ""}`} />
      </Button>
    </>
  );
};

export default BottomNav;