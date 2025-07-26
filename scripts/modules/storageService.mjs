/*********************************************************************/
/*            Local & Session Storage Services Module                */
/*********************************************************************/

import { Constants } from "./config.mjs";

/**
 * Storage service with TTL and key prefixing.
 */
export function AppStorage() {
   const isValidKey = (key) => typeof key === "string" && key.trim() !== "";

   const convertTTLConfigToMs = (config) => {
      if (typeof config !== "object" || config === null) return 0;
      const { days = 0, hours = 0, minutes = 0, seconds = 0 } = config;
      return days * 86400000 + hours * 3600000 + minutes * 60000 + seconds * 1000;
   };

   const createStorageHandler = (storageType) => {
      const storage = storageType === "local" ? localStorage : sessionStorage;

      const prefixKey = (key) => `${Constants.SESSION_STORAGE_PREFIX}_${key}`;

      return {
         set(key, value) {
            if (!isValidKey(key)) throw new Error("Invalid key");
            storage.setItem(prefixKey(key), JSON.stringify(value));
         },

         get(key) {
            if (!isValidKey(key)) throw new Error("Invalid key");
            const item = storage.getItem(prefixKey(key));
            try {
               return item ? JSON.parse(item) : null;
            } catch {
               return item;
            }
         },

         edit(key, newValue) {
            const fullKey = prefixKey(key);
            if (storage.getItem(fullKey)) {
               storage.setItem(fullKey, JSON.stringify(newValue));
            } else {
               console.warn(`Key "${fullKey}" does not exist in ${storageType}Storage.`);
            }
         },

         remove(key) {
            storage.removeItem(prefixKey(key));
         },

         clear() {
            storage.clear();
         },

         has(key) {
            return storage.getItem(prefixKey(key)) !== null;
         },

         keys() {
            return Object.keys(storage);
         },

         setWithTTL(key, value, ttl) {
            if (!isValidKey(key)) throw new Error("Invalid key");
            if (ttl === undefined || ttl === null) {
               throw new Error("TTL value is required.");
            }
            const ttlMs = typeof ttl === "number" ? ttl : convertTTLConfigToMs(ttl);
            const expiresAt = Date.now() + ttlMs;
            storage.setItem(prefixKey(key), JSON.stringify({ value, expiresAt }));
         },

         getWithTTL(key) {
            const item = storage.getItem(prefixKey(key));
            if (!item) return null;

            try {
               const { value, expiresAt } = JSON.parse(item);
               if (Date.now() > expiresAt) {
                  storage.removeItem(prefixKey(key));
                  return null;
               }
               return value;
            } catch {
               return null;
            }
         },
      };
   };

   return {
      local: createStorageHandler("local"),
      session: createStorageHandler("session"),
   };
}
