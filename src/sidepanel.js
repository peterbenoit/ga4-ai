import { getGoogleAccessToken } from "./auth.js";
import { createAuthController } from "./auth-controller.js";

const controller = createAuthController({
  getAccessToken: getGoogleAccessToken,
  status: document.querySelector("#auth-status"),
  button: document.querySelector("#connect-google")
});

void controller.check();
