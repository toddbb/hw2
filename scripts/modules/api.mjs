/*********************************************************************/
/*                           API Module                              */
/*********************************************************************/

/********************************************/
/**********        GET              *********/
/********************************************/
export async function Get(url, settings = {}) {
   const options = {
      method: "GET",
   };

   const timeout = settings.timeout;
   const responseType = settings.responseType || "json";
   const ignore404 = settings.ignore404 || false;

   return _fetchWithTimeout(url, options, timeout).then((response) => {
      if (!response.ok) {
         if (ignore404 && response.status === 404) {
            return null;
         }
         throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return _parseResponse(response, responseType);
   });
}

/********************************************/
/**********       POST              *********/
/********************************************/

export async function Post(url, payload, settings) {
   /// default settings to null if it doesn't exist
   settings = settings || {};

   /// create options object; set defaults, if not set
   let options = {
      method: "POST",
      headers: settings.headers || typeof payload === "object" ? { "Content-type": "application/json" } : { "Content-type": "text/xml" },
      body: typeof payload === "object" ? JSON.stringify(payload) : payload,
   };

   /// for readability, create variable for functions and any other data
   const timeout = settings.timeout;
   const responseType = settings.responseType || "json";

   return _fetchWithTimeout(url, options, timeout)
      .then((response) => {
         if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
         }
         return _parseResponse(response, responseType);
      })
      .then((data) => data)
      .catch((error) => {
         throw error;
      });
}

/********************************************/
/*******   API HELPER FUNCTIONS     *********/
/********************************************/

/// Helper function to parse response based on type
async function _parseResponse(response, responseType) {
   switch (responseType.toLowerCase()) {
      case "json":
         return response.json();
      case "text":
         return response.text();
      case "blob":
         return response.blob();
      case "arraybuffer":
         return response.arrayBuffer();
      case "formdata":
         return response.formData();
      case "stream":
         return response.body;
      default:
         /// fallback to json for unsupported types
         console.warn(`Unsupported response type: ${responseType}. Falling back to JSON.`);
         return response.json();
   }
}

/// Implement _fetchWithTimeout function (optional)
function _fetchWithTimeout(url, options, timeout = 5000) {
   return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
         controller.abort();
         reject(new Error("Request timeout"));
      }, timeout);

      fetch(url, { ...options, signal: controller.signal })
         .then((response) => {
            clearTimeout(timeoutId);
            resolve(response);
         })
         .catch((error) => {
            clearTimeout(timeoutId);
            reject(error);
         });
   });
}
