/**
 * Main Application Entry Point
 * Initializes the homework application and coordinates between modules
 */

import { Config } from "./modules/config.mjs";
import { domManager } from "./modules/domManager.mjs";
import { eventManager } from "./modules/eventManager.mjs";
import { homework } from "./modules/homework.mjs";
import { cleanupLazyLoading } from "./modules/utils.mjs";
import { viewController } from "./modules/viewController.mjs";

/**
 * Application Class
 * Main application controller that coordinates all modules
 */
class Application {
   constructor() {
      this.initialized = false;
      this.config = null;
   }

   /**
    * Initialize the application
    */
   async init() {
      try {
         console.log("🚀 Initializing Homework Application...");

         // Initialize core modules in order
         domManager.init();

         if (!domManager.validateElements()) {
            throw new Error("Required DOM elements are missing");
         }

         viewController.init();
         eventManager.init();

         // Setup application event handlers
         this.setupEventHandlers();

         // Setup development mode if enabled
         this.setupDevMode();

         // Load initial configuration and start homework
         await this.loadInitialContent();

         this.initialized = true;
         console.log("✅ Application initialized successfully");
      } catch (error) {
         console.error("❌ Application initialization failed:", error);
         this.handleInitializationError(error);
      }
   }

   /**
    * Setup application-level event handlers
    */
   setupEventHandlers() {
      eventManager.on("start-homework", this.handleStartHomework.bind(this));
      eventManager.on("homework-click", this.handleHomeworkClick.bind(this));
      eventManager.on("skip-question", this.handleSkipQuestion.bind(this));
      eventManager.on("control-action", this.handleControlAction.bind(this));
      eventManager.on("show-answers", this.handleShowAnswers.bind(this));
      eventManager.on("try-missed-questions", this.handleTryMissedQuestions.bind(this));
      eventManager.on("quit-homework", this.handleQuitHomework.bind(this));
   }

   /**
    * Setup development mode features
    */
   setupDevMode() {
      if (!Config.DEV_MODE) return;

      // Expose globals for debugging
      window[Config.APP_NAME] = {
         app: this,
         domManager,
         eventManager,
         viewController,
         Config,
      };

      // Parse URL parameters for development
      const params = this.parseURLParams();
      if (params.lesson) Config.DefaultLesson = params.lesson;
      if (params.sheet) Config.DefaultSheetNum = params.sheet;

      console.log("🔧 Development mode enabled");
      console.log("📊 Available globals:", Object.keys(window[Config.APP_NAME]));
   }

   /**
    * Parse URL parameters
    * @returns {Object} Parsed parameters
    */
   parseURLParams() {
      const params = new URLSearchParams(window.location.search);
      const result = {};

      if (params.has("lesson")) {
         result.lesson = params.get("lesson");
      }

      if (params.has("sheet")) {
         result.sheet = parseInt(params.get("sheet"), 10);
      }

      return result;
   }

   /**
    * Load initial content
    */
   async loadInitialContent() {
      // Start with the homework directly in dev mode, or show start screen
      if (Config.DEV_MODE && Config.DefaultLesson) {
         await homework.load(Config.DefaultLesson);
      } else {
         viewController.show("start");
      }
   }

   /**
    * Handle start homework event
    */
   async handleStartHomework() {
      try {
         await homework.load(Config.DefaultLesson);
      } catch (error) {
         console.error("Failed to start homework:", error);
         // Could show error message to user here
      }
   }

   /**
    * Handle homework area clicks
    * @param {CustomEvent} event
    */
   handleHomeworkClick(event) {
      if (homework.isResponseDisabled()) return;

      homework.handleClickEvent(event.detail);
   }

   /**
    * Handle skip question
    */
   handleSkipQuestion() {
      homework.handleSkip();
   }

   /**
    * Handle control action (Check/Next)
    * @param {CustomEvent} event
    */
   handleControlAction(event) {
      homework.handleControlAction(event.detail);
   }

   /**
    * Handle show answers action
    */
   handleShowAnswers() {
      homework.handleShowAnswers();
   }

   /**
    * Handle try missed questions action
    */
   async handleTryMissedQuestions() {
      console.log("🔄 Try missed questions clicked");

      // Check if button is disabled
      const retryButton = document.querySelector(".results-btn-retry");
      if (retryButton && retryButton.disabled) {
         console.log("Retry button is disabled");
         return;
      }

      const currentLesson = homework.lessonName;
      const totalMissed = homework.incorrectSheets.length + homework.skippedSheets.length;

      if (totalMissed === 0) {
         console.log("No missed questions to retry");
         return;
      }

      console.log(`📚 Starting retry mode with ${totalMissed} missed questions`);

      // Switch to homework view first
      viewController.show("homework");

      // Start retry mode with the current lesson
      const success = await homework.startRetryMode(currentLesson || "SJ_A1_004");

      if (!success) {
         console.warn("Failed to start retry mode");
         viewController.show("results"); // Go back to results if failed
      }
   }
   /**
    * Handle quit homework action
    */
   handleQuitHomework() {
      console.log("👋 Quit homework clicked");

      // Reset homework and go back to start
      homework.reset();
      viewController.show("start");
   }

   /**
    * Handle initialization errors
    * @param {Error} error
    */
   handleInitializationError(error) {
      // Could show user-friendly error message
      const errorMessage = `
      <div style="padding: 20px; text-align: center; color: red;">
        <h2>Application Failed to Load</h2>
        <p>Please refresh the page or contact support.</p>
        <details style="margin-top: 10px;">
          <summary>Technical Details</summary>
          <pre style="text-align: left; background: #f5f5f5; padding: 10px; margin-top: 10px;">
${error.message}
${error.stack}
          </pre>
        </details>
      </div>
    `;

      document.body.innerHTML = errorMessage;
   }

   /**
    * Cleanup application resources
    */
   cleanup() {
      eventManager.cleanup();
      cleanupLazyLoading();
      this.initialized = false;
      console.log("🧹 Application cleaned up");
   }
}

// Create application instance
const app = new Application();

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
   app.init();
});

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
   app.cleanup();
});

// Export for debugging
export default app;
