import { PublicClientApplication } from "@azure/msal-browser";

// Configuration from environment variables
const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: window.location.origin,
    navigateToLoginRequestUrl: true
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false
  }
};

// Create MSAL instance
export const msal = new PublicClientApplication(msalConfig);

// Login request configuration
export const loginRequest = {
  scopes: [import.meta.env.VITE_AZURE_API_SCOPE]
};

// Initialize MSAL - this must be called before any other MSAL operations
let msalInitialized = false;

export async function initializeMsal() {
  if (!msalInitialized) {
    try {
      await msal.initialize();
      
      // Handle redirect response if present
      const response = await msal.handleRedirectPromise();
      
      if (response) {
        // User just logged in via redirect
        msal.setActiveAccount(response.account);
      } else {
        // Check if user is already logged in
        const accounts = msal.getAllAccounts();
        if (accounts.length > 0) {
          msal.setActiveAccount(accounts[0]);
        }
      }
      
      msalInitialized = true;
      return true;
    } catch (error) {
      console.error("MSAL initialization failed:", error);
      throw error;
    }
  }
  return true;
}

// Helper function to get access token
export async function getAccessToken() {
  if (!msalInitialized) {
    throw new Error("MSAL not initialized. Call initializeMsal() first.");
  }

  const account = msal.getActiveAccount();
  if (!account) {
    throw new Error("No active account. User must login first.");
  }

  try {
    // Try silent token acquisition first
    const response = await msal.acquireTokenSilent({
      ...loginRequest,
      account
    });
    return response.accessToken;
  } catch (error) {
    // If silent acquisition fails, try popup
    if (error.name === "InteractionRequiredAuthError") {
      const response = await msal.acquireTokenPopup(loginRequest);
      return response.accessToken;
    }
    throw error;
  }
}
