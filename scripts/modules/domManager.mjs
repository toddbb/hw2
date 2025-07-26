/**
 * DOM Manager
 * Centralizes DOM element references and initialization
 */

export class DomManager {
   constructor() {
      this.elements = {};
   }

   /**
    * Initialize all DOM element references
    */
   init() {
      this.initViews();
      this.initHomework();
      console.log("DOM Manager initialized");
   }

   /**
    * Initialize view elements
    */
   initViews() {
      this.elements.views = {
         start: document.querySelector(".view-start"),
         homework: document.querySelector(".view-hw"),
         results: document.querySelector(".view-results"),
      };

      this.elements.startView = {
         btnStart: document.querySelector(".view-start .btn"),
      };
   }

   /**
    * Initialize homework-related elements
    */
   initHomework() {
      this.elements.homework = {
         modal: document.querySelector(".modal-activity"),
         container: document.querySelector(".container-homework"),
      };

      this.initHeader();
      this.initMain();
      this.initFooter();
   }

   /**
    * Initialize header elements
    */
   initHeader() {
      this.elements.homework.header = {
         container: document.querySelector(".hw-header"),
         progressBar: {
            container: document.querySelector(".progress-bar-container"),
         },
      };
   }

   /**
    * Initialize main content elements
    */
   initMain() {
      this.elements.homework.main = {
         container: document.querySelector(".hw-main"),
         instruction: document.querySelector(".hw-main-instruction"),
         section: {
            container: document.querySelector(".hw-main-section"),
         },
         question: {
            container: document.querySelector(".hw-main-question"),
            body: document.querySelector(".hw-main-question-body"),
         },
         response: {
            container: document.querySelector(".hw-main-response"),
            text: document.querySelector(".hw-main-response-text"),
         },
      };
   }

   /**
    * Initialize footer elements
    */
   initFooter() {
      this.elements.homework.footer = {
         container: document.querySelector(".hw-footer"),
         feedback: document.querySelector(".hw-footer-feedback"),
         feedbackText: document.querySelector(".feedback-text"),
         feedbackIconTrophy: document.querySelector(".feedback-icon-trophy"),
         feedbackIconThumbsUp: document.querySelector(".feedback-icon-thumbs-up"),
         btnSkip: document.querySelector(".hw-btn-skip"),
         btnControl: document.querySelector(".hw-btn-control"),
      };
   }

   /**
    * Get a specific DOM element by path
    * @param {string} path - Dot-separated path to the element
    * @returns {HTMLElement|null}
    */
   getElement(path) {
      const keys = path.split(".");
      let current = this.elements;

      for (const key of keys) {
         current = current?.[key];
         if (!current) break;
      }

      return current || null;
   }

   /**
    * Check if all required elements are present
    * @returns {boolean}
    */
   validateElements() {
      const requiredPaths = ["views.start", "views.homework", "homework.modal", "homework.header.container", "homework.main.container", "homework.footer.container"];

      for (const path of requiredPaths) {
         if (!this.getElement(path)) {
            console.error(`Required DOM element not found: ${path}`);
            return false;
         }
      }

      return true;
   }
}

// Create and export singleton instance
export const domManager = new DomManager();
