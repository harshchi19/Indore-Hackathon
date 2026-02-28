import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";

export function AuthHeader() {
  const { user } = useUser();

  return (
    <div className="flex items-center gap-3">
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button variant="default" size="sm">
            Sign Up
          </Button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <span className="text-sm text-muted-foreground hidden sm:inline">
          Welcome, <span className="font-medium text-foreground">{user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "User"}</span>
        </span>
        <UserButton 
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-8 h-8"
            }
          }}
        />
      </SignedIn>
    </div>
  );
}

export default AuthHeader;
