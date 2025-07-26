/**
 * Question Type Helpers
 * Utility functions for question types
 */

import { domManager } from "./domManager.mjs";
import * as Utils from "./utils.mjs";

export class QuestionTypeHelpers {
   /**
    * Create container for question type
    * @param {Object} data - Question data
    * @returns {HTMLElement}
    */
   static createContainer(data) {
      const questionType = data.info.type;

      return Utils._createElement("div", {
         classes: [`${questionType}-container`, "response-container", "flex-col"],
         attributes: {
            "data-qtype": questionType,
         },
         parent: domManager.getElement("homework.main.response.container"),
      });
   }

   /**
    * Get media type from data object
    * @param {Object} data - Data object
    * @param {Array<string>} mediaTypes - Array of media types to check
    * @returns {Object} Media type object with type and value
    */
   static getMediaType(data, mediaTypes) {
      for (const type of mediaTypes) {
         if (data[type] && data[type].trim() !== "") {
            return {
               type: type,
               value: data[type],
            };
         }
      }

      return { type: null, value: null };
   }

   /**
    * Extract specific keys from an object
    * @param {string} keyName - Key name to search for
    * @param {Object} data - Data object
    * @returns {Array} Array of extracted values
    */
   static extractKeys(keyName, data) {
      const responses = [];

      for (const key in data) {
         if (key.includes(keyName)) {
            responses.push(data[key]);
         }
      }

      return responses;
   }

   /**
    * Parse text with curly braces
    * @param {string} text - Text to parse
    * @returns {Array} Array of parsed items
    */
   static parseCurlyBraces(text) {
      return [...text.matchAll(/([^{]+)|{(.*?)}/g)].map((match) => {
         if (match[2] !== undefined) {
            return { type: "braced", value: match[2] }; // Content inside {}
         } else {
            return { type: "text", value: match[1].trim() }; // Content outside {}
         }
      });
   }

   /**
    * Fit text to container by adjusting font size
    * @param {HTMLElement} container - Container element
    * @param {number} minFontSize - Minimum font size in rem
    * @param {number} maxFontSize - Maximum font size in rem
    */
   static fitTextToContainer(container, minFontSize = 0.4, maxFontSize = 2) {
      const textElement = container.querySelector(".fit-text");
      if (!textElement) return;

      textElement.style.fontSize = `${maxFontSize}rem`;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      let fontSize = maxFontSize;

      while (fontSize > minFontSize) {
         const { scrollWidth, scrollHeight } = textElement;

         if (scrollWidth <= containerWidth && scrollHeight <= containerHeight) {
            break;
         }

         fontSize -= 0.02;
         textElement.style.fontSize = `${fontSize}rem`;
      }
   }

   /**
    * Unify widths of elements with the same class name
    * @param {string} className - CSS class name selector
    */
   static unifyWidths(className) {
      const elements = document.querySelectorAll(className);
      if (elements.length === 0) return;

      // Get the maximum width
      let maxWidth = 0;
      elements.forEach((element) => {
         const width = element.offsetWidth;
         if (width > maxWidth) {
            maxWidth = width;
         }
      });

      // Set all elements to the maximum width
      elements.forEach((element) => {
         element.style.width = `${maxWidth}px`;
      });
   }

   /**
    * Normalize strings for comparison
    * @param {string} str - String to normalize
    * @returns {string} Normalized string
    */
   static normalizeStringsToCompare(str) {
      if (typeof str !== "string") {
         console.error("normalizeStringsToCompare(): Input is not a string; str =", str);
         return "";
      }

      return str
         .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // Remove punctuation
         .toLowerCase()
         .trim();
   }

   /**
    * Get ordered item values from data object
    * @param {Object} obj - Data object
    * @returns {Array} Array of ordered values
    */
   static getItemOrderedValues(obj) {
      return Object.keys(obj)
         .filter((key) => key.startsWith("item "))
         .sort((a, b) => {
            const numA = parseInt(a.split(" ")[1]);
            const numB = parseInt(b.split(" ")[1]);
            return numA - numB;
         })
         .map((key) => obj[key]); // Return the actual values instead of keys
   }

   /**
    * Validate media type
    * @param {Object} mediaType - Media type object
    * @param {Array<string>} supportedTypes - Array of supported types
    * @returns {boolean}
    */
   static validateMediaType(mediaType, supportedTypes) {
      return mediaType && supportedTypes.includes(mediaType.type);
   }
}
