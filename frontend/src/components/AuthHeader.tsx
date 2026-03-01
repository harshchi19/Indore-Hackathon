import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function AuthHeader() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="flex items-center gap-3">
      {!isAuthenticated ? (
        <>
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="default" size="sm">
              Sign Up
            </Button>
          </Link>
        </>
      ) : (
        <>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Welcome, <span className="font-medium text-foreground">{user?.full_name || user?.email?.split("@")[0] || "User"}</span>
          </span>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary cursor-pointer" onClick={logout}>
            {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        </>
      )}
    </div>
  );
}

export default AuthHeader;
