/*************************************************************************************************/
/*                                UTILITIES Modules 				       									 */
/*************************************************************************************************/

/**********************************************************************************/
/****                               EVENTS                                    *****/
/**********************************************************************************/

/**
 * Event Handler
 * @param {*} el
 * @param {*} event
 * @param {*} handler
 */

export function _eventAdd(el, event, handler) {
   if (el instanceof NodeList || el instanceof HTMLCollection) {
      el.forEach((e) => e.addEventListener(event, handler));
   } else {
      el.addEventListener(event, handler);
   }
}

/**********************************************************************************/
/****                               DOM                                       *****/
/**********************************************************************************/

/**
 * Selects the first element matching the given CSS selector within the parent.
 * @param {string} selector - A CSS selector string.
 * @param {ParentNode} [parent=document] - The parent element/document to search within.
 * @returns {Element|null} - The first matched element, or null if no matches are found.
 */
export function _querySelector(selector, parent = document) {
   return parent.querySelector(selector);
}

/**
 * Selects all elements matching the given CSS selector within the parent.
 * @param {string} selector - A CSS selector string.
 * @param {ParentNode} [parent=document] - The parent element/document to search within.
 * @returns {NodeList} - A NodeList of matched elements. May be empty if no matches are found.
 */
export function _querySelectorAll(selector, parent = document) {
   return parent.querySelectorAll(selector);
}

/**
 * Checks if the provided value is a DOM element.
 * @param {*} el - The value to check.
 * @returns {boolean} - Returns true if el is a DOM element, otherwise false.
 */
export function _isElement(el) {
   return el instanceof Element;
}

/**
 * Utility export function to create and insert a new DOM element.
 *
 * @param {string} type - The type of element to create (e.g., 'div', 'span', 'p').
 * @param {Object} options - Options to customize the element.
 * @param {[string]} [options.classes] - Array of classes to add to the element.
 * @param {string} [options.id] - ID to assign to the element.
 * @param {HTMLElement} [options.parent] - The parent element to append/prepend the new element to.
 * @param {boolean} [options.prepend=false] - Whether to prepend the element instead of appending. Append by default.
 * @param {Object} [options.attributes] - Additional attributes to add to the element (e.g., { src: 'image.png', alt: 'Image description' }).
 * @param {String} [options.innerHTML] - innerHTML, if any
 * @param {string} [options.textContent] - Text content to set for the element.
 * @returns {HTMLElement} The created DOM element.
 */

export function _createElement(type, options = {}) {
   const element = document.createElement(type);

   // Add classes if provided
   if (options.classes) {
      element.classList.add(...options.classes);
   }

   // Add id if provided
   if (options.id) {
      element.id = options.id;
   }

   // Add additional attributes if provided
   if (options.attributes) {
      for (const [key, value] of Object.entries(options.attributes)) {
         element.setAttribute(key, value);
      }
   }

   // Set text content if provided
   if (options.textContent) {
      element.textContent = options.textContent;
   }

   // Set innerHtml if provided
   if (options.innerHTML) {
      element.innerHTML = options.innerHTML;
   }

   // Append or prepend to parent if provided
   if (options.parent) {
      if (options.prepend) {
         options.parent.prepend(element);
      } else {
         options.parent.append(element);
      }
   }

   return element;
}

/// subexport function for hide, show, etc.
function _$runMainFunction(el, string, func) {
   if (el instanceof HTMLCollection || el instanceof NodeList) {
      Array.from(el).forEach(func);
   } else {
      func(el);
   }
}

/// hide entire HTML collections, nodes, or single elements by adding class 'nodisplay'
export function _hide(el) {
   const func = (element) => {
      if (!element.classList.contains("nodisplay")) {
         element.classList.add("nodisplay");
      }
   };

   _$runMainFunction(el, null, func);
}

/// show entire HTML collections, nodes, or single elements by adding class 'nodisplay'
export function _show(el) {
   const func = (element) => {
      element.classList.remove("nodisplay");
   };

   _$runMainFunction(el, null, func);
}



/// hide entire HTML collections, nodes, or single elements by adding class 'nodisplay'
export function _notVisible(el) {
   const func = (element) => {
      if (!element.classList.contains("novisible")) {
         element.classList.add("novisible");
      }
   };

   _$runMainFunction(el, null, func);
}

/// show entire HTML collections, nodes, or single elements by adding class 'nodisplay'
export function _visible(el) {
   const func = (element) => {
      element.classList.remove("novisible");
   };

   _$runMainFunction(el, null, func);
}

/// add class 'string' to HTML collections, nodes, or single elements
export function _addClass(el, string) {
   const func = (element) => {
      if (!element.classList.contains(string)) {
         element.classList.add(string);
      }
   };

   _$runMainFunction(el, string, func);
}

/// remove a class 'string' to HTML collections, nodes, or single elements
export function _removeClass(el, string) {
   const func = (element) => {
      element.classList.remove(string);
   };

   _$runMainFunction(el, string, func);
}

/// toggle class 'string' of HTML collections, nodes, or single elements
export function _toggleClass(el, string) {
   const func = (element) => {
      element.classList.toggle(string);
   };

   _$runMainFunction(el, string, func);
}

// disable HTML collections, nodes, or single elements
export const _disable = (el) => {
   const func = (element) => {
      element.disabled = true;
   };

   _$runMainFunction(el, null, func);
};

// enable HTML collections, nodes, or single elements
export const _enable = (el) => {
   const func = (element) => {
      element.disabled = false;
   };

   _$runMainFunction(el, null, func);
};

// prepend HTML to HTML collections, nodes, or single elements
export const _prepend = (el, html, position) => {
   position = position || "afterbegin";
   if (position === "beforebegin" || position === "afterbegin") {
      const func = (element) => {
         element.insertAdjacentHTML(position, html);
      };
      if (HTMLCollection.prototype.isPrototypeOf(el)) {
         [...el].forEach((element) => func(element));
      } else if (Array.isArray(el) || NodeList.prototype.isPrototypeOf(el)) {
         el.forEach((element) => func(element));
      } else {
         func(el);
      }
   } else {
      _error(`Error: prepend() -- could not recognize position '${position}'.`);
   }
};

// append HTML to HTML collections, nodes, or single elements
export const _append = (el, html, position) => {
   position = position || "beforeend";
   if (position === "beforeend" || position === "afterend") {
      const func = (element) => {
         element.insertAdjacentHTML(position, html);
      };
      if (HTMLCollection.prototype.isPrototypeOf(el)) {
         [...el].forEach((element) => func(element));
      } else if (Array.isArray(el) || NodeList.prototype.isPrototypeOf(el)) {
         el.forEach((element) => func(element));
      } else {
         func(el);
      }
   } else {
      _error(`Error: append() -- could not recognize position '${position}'.`);
   }
};

/**
 * Checks if an element has a specific class.
 * @param {Element} el - The element to check.
 * @param {string} className - The class name to check for.
 * @returns {boolean} - True if the element has the class, otherwise false.
 */
export function _hasClass(el, className) {
   if (!(el instanceof Element)) {
      throw new Error("_hasClass: Provided element is not a valid DOM element.");
   }
   return el.classList.contains(className);
}

/**
 * Sets an attribute on an element.
 * @param {Element} el - The element on which to set the attribute.
 * @param {string} key - The name of the attribute.
 * @param {string} value - The value of the attribute.
 */
export function _setAttribute(el, key, value) {
   if (!(el instanceof Element)) {
      throw new Error("_setAttribute: Provided element is not a valid DOM element.");
   }
   el.setAttribute(key, value);
}

/**
 * Removes an attribute from an element.
 * @param {Element} el - The element from which to remove the attribute.
 * @param {string} attributeName - The name of the attribute to remove.
 */
export function _removeAttribute(el, attributeName) {
   if (!(el instanceof Element)) {
      throw new Error("_removeAttribute: Provided element is not a valid DOM element.");
   }
   el.removeAttribute(attributeName);
}

/**
 * Debounce: Returns a function that delays invoking `fn` until after `delay` milliseconds
 * have elapsed since the last time it was invoked.
 * @param {Function} fn - The function to debounce.
 * @param {number} delay - The number of milliseconds to wait.
 * @returns {Function} - The debounced function.
 */
export function _debounce(fn, delay) {
   let timeoutId;
   return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
   };
}

/**
 * Throttle: Returns a function that only invokes `fn` at most once every `limit` milliseconds.
 * @param {Function} fn - The function to throttle.
 * @param {number} limit - The minimum number of milliseconds between calls.
 * @returns {Function} - The throttled function.
 */
export function _throttle(fn, limit) {
   let inThrottle = false;
   let lastArgs, lastThis;

   return function (...args) {
      if (!inThrottle) {
         fn.apply(this, args);
         inThrottle = true;
         setTimeout(() => {
            inThrottle = false;
            if (lastArgs) {
               fn.apply(lastThis, lastArgs);
               lastArgs = lastThis = null;
            }
         }, limit);
      } else {
         lastArgs = args;
         lastThis = this;
      }
   };
}

/**********************************************************************************/
/****                               MATH                                      *****/
/**********************************************************************************/
export function _getRandomInclusive(min, max) {
   return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function _getRandomExclusive(min, max) {
   if (max - min <= 2) {
      throw new Error("Range is too small to exclude min and max.");
   }
   return Math.floor(Math.random() * (max - min - 1)) + min + 1;
}

export function _summation(start, end, termFunction = (n) => n) {
   if (start > end) {
      throw new Error("Start value must be less than or equal to the end value.");
   }

   let sum = 0;
   for (let i = start; i <= end; i++) {
      sum += termFunction(i);
   }
   return sum;
}

/**********************************************************************************/
/****                             TIME/DATE                                   *****/
/**********************************************************************************/
export function _getCurrentDateTime() {
   return new Date();
}

export function _addDays(date, days) {
   const result = new Date(date);
   result.setDate(result.getDate() + days);
   return result;
}

export function _dateDifferenceInDays(date1, date2) {
   const oneDay = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds
   return Math.round((date2 - date1) / oneDay);
}

// YYYY-MM-DD
export function _parseDate(dateString) {
   const [year, month, day] = dateString.split("-").map(Number);
   return new Date(year, month - 1, day);
}

/**
 * Formats a given date according to a specified format and locale.
 *
 * Supported Formats:
 * - "YYYY-MM-DD" (default)
 * - "DD/MM/YYYY"
 * - "MM/DD/YYYY"
 * - "MonthName Day, Year"
 *
 * @param {Date} date - The date to format.
 * @param {Object} [options={}] - Formatting options.
 * @param {string} [options.format="YYYY-MM-DD"] - The desired format.
 * @param {string} [options.locale="en-US"] - The locale to use for month and other locale-sensitive fields.
 * @returns {string} - The formatted date string.
 */
export function _formatDate(date, { format = "YYYY-MM-DD", locale = "en-US" } = {}) {
   if (!(date instanceof Date) || isNaN(date)) {
      throw new Error("Invalid date object provided to formatDate.");
   }

   const year = date.getFullYear();
   const month = String(date.getMonth() + 1).padStart(2, "0");
   const day = String(date.getDate()).padStart(2, "0");

   // For month names, we can leverage toLocaleString with the specified locale.
   const monthName = date.toLocaleString(locale, { month: "long" });

   switch (format) {
      case "YYYY-MM-DD":
         return `${year}-${month}-${day}`;
      case "DD/MM/YYYY":
         return `${day}/${month}/${year}`;
      case "MM/DD/YYYY":
         return `${month}/${day}/${year}`;
      case "MonthName Day, Year":
         // Example: October 15, 2024
         return `${monthName} ${day}, ${year}`;
      default:
         // If the format is not recognized, default to ISO-like "YYYY-MM-DD"
         return `${year}-${month}-${day}`;
   }
}

/**
 * Formats a date using Intl.DateTimeFormat, allowing more flexibility with locales and date styles.
 *
 * This can be used if a user wants a quick way to apply locale, along with a predefined date style
 * (e.g., "full", "long", "medium", "short").
 *
 * @param {Date} date - The date to format.
 * @param {Object} [options={}] - Intl formatting options.
 * @param {string} [options.locale="en-US"] - The locale to use.
 * @param {string} [options.dateStyle="medium"] - The dateStyle (e.g., "full", "long", "medium", "short").
 * @param {string} [options.timeStyle] - The timeStyle (e.g., "short", "medium") if you want time included.
 * @returns {string} - The formatted date string according to the locale and styles.
 */
export function _formatDateLocale(date, { locale = "en-US", dateStyle = "medium", timeStyle } = {}) {
   if (!(date instanceof Date) || isNaN(date)) {
      throw new Error("Invalid date object provided to formatDateLocale.");
   }

   const options = { dateStyle };
   if (timeStyle) {
      options.timeStyle = timeStyle;
   }

   return new Intl.DateTimeFormat(locale, options).format(date);
}

/**********************************************************************************/
/****                         ARRAYS AND OBJECTS                              *****/
/**********************************************************************************/

// shuffle an array
export function _shuffleArray(array) {
   for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // Swap elements
   }
   return array;
}

/**
 * Returns a new array containing only the unique elements from the original array.
 * @param {Array} array - The array to filter for unique elements.
 * @returns {Array} - A new array with unique elements.
 */
export function _uniqueArray(array) {
   return Array.from(new Set(array));
}

/**
 * Splits an array into chunks of a given size.
 * @param {Array} array - The array to split into chunks.
 * @param {number} size - The size of each chunk.
 * @returns {Array[]} - An array of arrays, each representing a chunk.
 */
export function _chunkArray(array, size) {
   if (!Array.isArray(array)) {
      throw new Error("First argument to _chunkArray must be an array.");
   }
   if (typeof size !== "number" || size <= 0) {
      throw new Error("Second argument to _chunkArray must be a positive integer.");
   }

   const result = [];
   for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
   }

   return result;
}

/**********************************************************************************/
/****                  VALIDATION & RESILIENCE CHECKS                         *****/
/**********************************************************************************/
/**
 * Normalizes various element inputs (Element, NodeList, HTMLCollection, Array of elements) into an array of elements.
 * This function can be used internally by other utilities that operate on multiple elements.
 * @param {Element|NodeList|HTMLCollection|Array<Element>} el - The input to normalize.
 * @param {boolean} [throwOnError=true] - If true, throws an error on invalid input. If false, returns an empty array.
 * @returns {Element[]} - An array of elements.
 */
function _ensureElements(el, throwOnError = true) {
   if (el instanceof Element) {
      return [el];
   } else if (NodeList.prototype.isPrototypeOf(el) || HTMLCollection.prototype.isPrototypeOf(el)) {
      return Array.from(el);
   } else if (Array.isArray(el)) {
      // Check if all items are elements
      if (el.every((item) => item instanceof Element)) {
         return el;
      } else {
         if (throwOnError) {
            throw new Error("_ensureElements: Array contains non-element items.");
         } else {
            return [];
         }
      }
   } else if (el == null) {
      // If null or undefined
      if (throwOnError) {
         throw new Error("_ensureElements: Provided input is null or undefined.");
      } else {
         return [];
      }
   } else {
      // Unsupported type
      if (throwOnError) {
         throw new Error("_ensureElements: Unsupported input type.");
      } else {
         return [];
      }
   }
}

/**********************************************************************************/
/****                          DEV ONLY                                       *****/
/**********************************************************************************/

// log, using the module name
export const _log = (msg, val) => {
   if (typeof msg === "array" || typeof msg === "object") {
      for (let i = 0; i < msg.length; i++) {
         if (i % 2 != 0) {
            console.log(`[${MY_APP}] ${msg[i - 1]} = ${msg[i]}`);
         }
      }
   } else if (val) {
      console.log(`[${MY_APP}] ${msg} = ${val}`);
   } else {
      console.log(`[${MY_APP}] ${msg}`);
   }
};

const _error = (msg) => {
   console.error(`[${MY_APP}] ${msg}`);
};
