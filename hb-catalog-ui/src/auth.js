import { PublicClientApplication } from "@azure/msal-browser";

export const msal = new PublicClientApplication({
  auth: {
    clientId: "763dfb3f-4c23-4b49-aa28-9cf7d78b6c4a", // SPA App ID
    authority: "https://login.microsoftonline.com/189b9eeb-67cc-4fea-bcb2-eedd06da0730", // Tenant ID
    redirectUri: window.location.origin
  },
  cache: { cacheLocation: "sessionStorage" }
});

export const loginRequest = {
  scopes: ["api://2b18b55b-cf19-41e3-ae23-c17aa8411e75/access_as_user"] // API App ID URI + Scope
};
