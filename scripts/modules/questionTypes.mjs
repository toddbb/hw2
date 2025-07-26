/**
 * Question Types Module
 * Unified interface for all question type functionality
 */

import { QuestionTypeEvents } from "./questionEvents.mjs";
import { QuestionTypeHelpers } from "./questionHelpers.mjs";
import { QuestionTypeLoaders } from "./questionLoaders.mjs";
import { QuestionTypeResults } from "./questionResults.mjs";

/**
 * Main Question Types class
 * Provides a clean API for question type operations
 */
export class QuestionTypes {
   /**
    * Load a specific question type
    * @param {string} type - Question type
    * @param {Object} data - Question data
    */
   static load(type, data) {
      const loader = this.getLoader(type);

      if (!loader) {
         console.warn(`No loader defined for question type: "${type}"`);
         return;
      }

      try {
         loader(data);
         console.log(`✅ Loaded question type: ${type}`);
      } catch (error) {
         console.error(`❌ Failed to load question type: ${type}`, error);
         throw error;
      }
   }

   /**
    * Handle events for a specific question type
    * @param {string} type - Question type
    * @param {Event} event - Event object
    */
   static handleEvent(type, event) {
      const handler = this.getEventHandler(type);

      if (!handler) {
         console.warn(`No event handler defined for question type: "${type}"`);
         return;
      }

      try {
         handler(event);
      } catch (error) {
         console.error(`❌ Failed to handle event for question type: ${type}`, error);
      }
   }

   /**
    * Check results for a specific question type
    * @param {string} type - Question type
    */
   static checkResult(type) {
      const checker = this.getResultChecker(type);

      if (!checker) {
         console.warn(`No result checker defined for question type: "${type}"`);
         return;
      }

      try {
         checker();
      } catch (error) {
         console.error(`❌ Failed to check result for question type: ${type}`, error);
      }
   }

   /**
    * Get loader function for question type
    * @param {string} type - Question type
    * @returns {Function|null}
    */
   static getLoader(type) {
      const loaders = {
         "multiple-choice": QuestionTypeLoaders.multipleChoice,
         "fill-blanks": QuestionTypeLoaders.fillBlanks,
         "order-items": QuestionTypeLoaders.orderItems,
         "open-answers": QuestionTypeLoaders.openAnswer,
      };

      return loaders[type] || null;
   }

   /**
    * Get event handler for question type
    * @param {string} type - Question type
    * @returns {Function|null}
    */
   static getEventHandler(type) {
      const handlers = {
         "multiple-choice": QuestionTypeEvents.multipleChoice.handler,
         // Add other event handlers as needed
      };

      return handlers[type] || null;
   }

   /**
    * Get result checker for question type
    * @param {string} type - Question type
    * @returns {Function|null}
    */
   static getResultChecker(type) {
      return QuestionTypeResults.getChecker(type);
   }

   /**
    * Get all supported question types
    * @returns {Array<string>}
    */
   static getSupportedTypes() {
      return ["multiple-choice", "fill-blanks", "order-items", "open-answers"];
   }

   /**
    * Check if question type is supported
    * @param {string} type - Question type
    * @returns {boolean}
    */
   static isSupported(type) {
      return this.getSupportedTypes().includes(type);
   }

   /**
    * Validate question data
    * @param {string} type - Question type
    * @param {Object} data - Question data
    * @returns {boolean}
    */
   static validateData(type, data) {
      if (!this.isSupported(type)) {
         console.error(`Unsupported question type: ${type}`);
         return false;
      }

      if (!data || typeof data !== "object") {
         console.error("Question data must be an object");
         return false;
      }

      if (!data.info || !data.info.type) {
         console.error("Question data must have info.type property");
         return false;
      }

      if (data.info.type !== type) {
         console.error(`Question type mismatch: expected ${type}, got ${data.info.type}`);
         return false;
      }

      return true;
   }
}

// Export individual modules for direct access if needed
export { QuestionTypeEvents, QuestionTypeHelpers, QuestionTypeLoaders, QuestionTypeResults };
