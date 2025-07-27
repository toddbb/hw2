/**
 * Event Manager
 * Centralizes event handling and delegation
 */

import { domManager } from "./domManager.mjs";

export class EventManager {
   constructor() {
      this.listeners = new Map();
   }

   /**
    * Initialize all event listeners
    */
   init() {
      this.setupStartViewEvents();
      this.setupHomeworkEvents();
      console.log("Event Manager initialized");
   }

   /**
    * Setup events for start view
    */
   setupStartViewEvents() {
      const startBtn = domManager.getElement("startView.btnStart");
      if (startBtn) {
         this.addListener(startBtn, "click", this.handleStartClick.bind(this));
      }
   }

   /**
    * Setup events for homework view
    */
   setupHomeworkEvents() {
      const modal = domManager.getElement("homework.modal");
      const skipBtn = domManager.getElement("homework.footer.btnSkip");
      const controlBtn = domManager.getElement("homework.footer.btnControl");
      const showAnswersBtn = domManager.getElement("homework.footer.btnShowAnswers");

      if (modal) {
         this.addListener(modal, "click", this.handleHomeworkClick.bind(this));
      }

      if (skipBtn) {
         this.addListener(skipBtn, "click", this.handleSkipClick.bind(this));
      }

      if (controlBtn) {
         this.addListener(controlBtn, "click", this.handleControlClick.bind(this));
      }

      if (showAnswersBtn) {
         this.addListener(showAnswersBtn, "click", this.handleShowAnswersClick.bind(this));
      }
   }

   /**
    * Add event listener and track it
    * @param {HTMLElement} element
    * @param {string} event
    * @param {Function} handler
    */
   addListener(element, event, handler) {
      element.addEventListener(event, handler);

      // Store for potential cleanup
      if (!this.listeners.has(element)) {
         this.listeners.set(element, []);
      }
      this.listeners.get(element).push({ event, handler });
   }

   /**
    * Remove all event listeners
    */
   cleanup() {
      for (const [element, listeners] of this.listeners) {
         for (const { event, handler } of listeners) {
            element.removeEventListener(event, handler);
         }
      }
      this.listeners.clear();
   }

   /**
    * Handle start button click
    * @param {Event} event
    */
   handleStartClick(event) {
      // This will be connected to homework module
      this.emit("start-homework");
   }

   /**
    * Handle homework area clicks
    * @param {Event} event
    */
   handleHomeworkClick(event) {
      this.emit("homework-click", event);
   }

   /**
    * Handle skip button click
    * @param {Event} event
    */
   handleSkipClick(event) {
      this.emit("skip-question");
   }

   /**
    * Handle control button click (Check/Next)
    * @param {Event} event
    */
   handleControlClick(event) {
      this.emit("control-action", event);
   }

   /**
    * Handle show answers button click
    * @param {Event} event
    */
   handleShowAnswersClick(event) {
      this.emit("show-answers");
   }

   /**
    * Simple event emitter
    * @param {string} eventName
    * @param {*} data
    */
   emit(eventName, data = null) {
      const event = new CustomEvent(eventName, { detail: data });
      document.dispatchEvent(event);
   }

   /**
    * Listen for custom events
    * @param {string} eventName
    * @param {Function} handler
    */
   on(eventName, handler) {
      document.addEventListener(eventName, handler);
   }

   /**
    * Remove custom event listener
    * @param {string} eventName
    * @param {Function} handler
    */
   off(eventName, handler) {
      document.removeEventListener(eventName, handler);
   }
}

// Create singleton instance
export const eventManager = new EventManager();
