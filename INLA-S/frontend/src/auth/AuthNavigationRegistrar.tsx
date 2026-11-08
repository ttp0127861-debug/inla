import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerAuthNavigate } from "./authNavigation";
import { useAuth } from "./AuthContext";
import { registerSessionHandlers } from "./sessionPolicy";

export function AuthNavigationRegistrar() {
  const navigate = useNavigate();
  const { clearSession } = useAuth();

  useEffect(() => {
    registerAuthNavigate((to, options) => navigate(to, options));
  }, [navigate]);

  useEffect(() => {
    registerSessionHandlers({
      onUnauthorized: clearSession,
      onIdle: clearSession,
    });
  }, [clearSession]);

  return null;
}
