import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

declare global {
  interface Window {
    navigate: (path: string) => void;
  }
}

export function RouterController() {
  const navigate = useNavigate();
  useEffect(() => {
    window.navigate = (path: string) => navigate(path);
  }, [navigate]);
  return null;
}