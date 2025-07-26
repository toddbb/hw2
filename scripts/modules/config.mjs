/*********************************************************************/
/*                           Config Module                              */
/*********************************************************************/

export const Config = {
   DEV_MODE: true,
   APP_NAME: "$",
   API_URL: BASE_URL(), // TO DO: change this for production
   SESSION_STORAGE_PREFIX: "myapp", // TO DO: Change this to a unique prefix for this app
   DefaultLesson: "SJ_A1_004", /// temp global; later, it can be selected
   DefaultSheetNum: 0, /// temp global; later, it can be selected
};

// Detect environment and set base URL
function BASE_URL() {
   const host = window.location.hostname;

   if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:5500"; // or whatever your local server port is
   } else if (host.endsWith("github.io")) {
      return "https://" + host + "/hw"; // replace with your actual GitHub repo name
   } else {
      return window.location.origin; // default fallback
   }
}
