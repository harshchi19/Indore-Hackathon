import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

const SsoCallback = () => {
  return (
    <AuthenticateWithRedirectCallback
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    />
  );
};

export default SsoCallback;
