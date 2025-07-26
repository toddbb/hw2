/**
 * Homework Module
 * Main controller for homework functionality
 */

import { Get } from "./api.mjs";
import { Config } from "./config.mjs";
import { domManager } from "./domManager.mjs";
import { Media } from "./media.mjs";
import { QuestionTypeHelpers, QuestionTypes } from "./questionTypes.mjs";
import * as Utils from "./utils.mjs";
import { viewController } from "./viewController.mjs";

/**
 * Main Homework Controller
 */
export class Homework {
   constructor() {
      this.lessonName = null;
      this.info = {};
      this.resources = [];
      this.sheetIndex = 0;
      this.totalSheets = null;
      this.disableResponseEvents = false;
   }

   /**
    * Load homework lesson
    * @param {string} lesson - Lesson name
    */
   async load(lesson) {
      try {
         console.log(`📚 Loading homework lesson: ${lesson}`);

         // Initialize homework data
         this.lessonName = lesson;
         this.info = await this.getInfo(lesson);

         if (!this.info) {
            throw new Error("Failed to load homework info");
         }

         this.sheetIndex = Config.DEV_MODE ? Config.DefaultSheetNum : 0;
         this.totalSheets = this.info.sheets.length;

         // Load media resources
         this.resources = await Media.loadResources(this.info.resources, `lessons/${lesson}/test`);

         // Load sheet and show homework view
         await sheet.load();
         viewController.show("homework");

         this.setupDevMode();

         console.log("✅ Homework loaded successfully");
      } catch (error) {
         console.error("❌ Failed to load homework:", error);
         throw error;
      }
   }

   /**
    * Get homework info from API
    * @param {string} lesson - Lesson name
    * @returns {Object|null} Homework info
    */
   async getInfo(lesson) {
      try {
         return await Get(`${Config.API_URL}/content/lessons/${lesson}/test/info.json`);
      } catch (error) {
         console.error(`Failed to get homework info: ${error}`);
         return null;
      }
   }

   /**
    * Handle question result
    * @param {boolean|string} result - Result: true/false for boolean, or "correct"/"almost"/"incorrect" for specific states
    * @param {HTMLElement} feedbackElement - Element to show feedback on
    * @param {HTMLElement} correctElement - Correct answer element
    */
   handleResult(result, feedbackElement = null, correctElement = null) {
      this.disableResponseEvents = true;

      // Handle both boolean (legacy) and string result types
      if (typeof result === "boolean") {
         if (result) {
            feedbackElement?.classList.add("correct");
            footer.setCorrect();
         } else {
            correctElement?.classList.add("correct");
            feedbackElement?.classList.add("incorrect");
            footer.setIncorrect();
         }
      } else {
         // Handle string result types: "correct", "almost", "incorrect"
         switch (result) {
            case "correct":
               feedbackElement?.classList.add("correct");
               footer.setCorrect();
               break;
            case "almost":
               feedbackElement?.classList.add("almost");
               footer.setAlmost();
               break;
            case "incorrect":
            default:
               correctElement?.classList.add("correct");
               feedbackElement?.classList.add("incorrect");
               footer.setIncorrect();
               break;
         }
      }

      footer.setControlMode("next");
   }

   /**
    * Handle homework end
    */
   handleEnd() {
      this.reset();
      viewController.show("results");
   }

   /**
    * Reset homework state
    */
   reset() {
      this.sheetIndex = 0;
      this.totalSheets = null;
      this.resources = [];
      this.info = {};
      this.lessonName = null;
      this.disableResponseEvents = false;

      footer.reset();
      header.updateProgress();
   }

   /**
    * Check if response events are disabled
    * @returns {boolean}
    */
   isResponseDisabled() {
      return this.disableResponseEvents;
   }

   /**
    * Handle click events
    * @param {Event} event
    */
   handleClickEvent(event) {
      if (this.disableResponseEvents) return;

      console.log("🖱️ Homework click event:", event.target);

      const responseContainer = event.target.closest(".response-container");

      if (!responseContainer || !domManager.getElement("homework.modal").contains(responseContainer)) {
         console.warn("Click event not in response container.");
         return;
      }

      const questionType = responseContainer.dataset.qtype;
      if (!questionType) {
         console.warn("No question type found in response container.");
         return;
      }

      QuestionTypes.handleEvent(questionType, event);
   }

   /**
    * Handle skip action
    */
   handleSkip() {
      sheet.next();
   }

   /**
    * Handle control action (Check/Next)
    * @param {Event} event
    */
   handleControlAction(event) {
      const btn = domManager.getElement("homework.footer.btnControl");
      const isModeCheck = btn.classList.contains("mode-check");
      const isModeNext = btn.classList.contains("mode-next");
      const isActive = btn.classList.contains("active");

      if (isModeCheck && isActive) {
         this.checkCurrentQuestion();
      } else if (isModeNext) {
         this.proceedToNext();
      }
   }

   /**
    * Check current question
    */
   checkCurrentQuestion() {
      const questionType = sheet.questionType;

      if (!questionType) {
         console.warn("No question type found in Sheet.questionType.");
         return;
      }

      QuestionTypes.checkResult(questionType);
   }

   /**
    * Proceed to next question or end homework
    */
   proceedToNext() {
      footer.reset();
      sheet.next();
   }

   /**
    * Setup development mode features
    */
   setupDevMode() {
      if (!Config.DEV_MODE) return;

      window[Config.APP_NAME].Homework = this;
      console.log("🔧 Homework dev mode enabled");
   }
}

/**
 * Sheet Controller
 * Manages individual homework sheets
 */
export class Sheet {
   constructor() {
      this.data = null;
      this.questionType = null;
      this.instruction = null;
   }

   /**
    * Load current sheet
    */
   async load() {
      try {
         footer.reset();
         Utils._notVisible(domManager.getElement("homework.main.container"));

         this.data = homework.info.sheets[homework.sheetIndex];
         this.questionType = this.data.info.type;
         this.instruction = this.data.info.en;

         this.displayInstruction(this.instruction);
         await question.load();
         await response.load(this.questionType);

         Utils._visible(domManager.getElement("homework.main.container"));
         header.updateProgress();

         homework.disableResponseEvents = false;

         this.setupDevMode();

         console.log(`📄 Sheet loaded: ${homework.sheetIndex + 1}/${homework.totalSheets}`);
      } catch (error) {
         console.error("❌ Failed to load sheet:", error);
         throw error;
      }
   }

   /**
    * Display instruction text
    * @param {string} instruction - Instruction text
    */
   displayInstruction(instruction) {
      const instructionElement = domManager.getElement("homework.main.instruction");

      if (!instruction) {
         Utils._hide(instructionElement);
      } else {
         instructionElement.textContent = instruction;
         Utils._show(instructionElement);
      }
   }

   /**
    * Move to next sheet
    */
   next() {
      if (homework.sheetIndex < homework.totalSheets - 1) {
         homework.sheetIndex++;
         this.load();
      } else {
         console.log("📚 End of homework reached.");
         homework.handleEnd();
      }
   }

   /**
    * Setup development mode features
    */
   setupDevMode() {
      if (!Config.DEV_MODE) return;

      window[Config.APP_NAME].Sheet = this;
      console.log("🔧 Sheet dev mode enabled");
   }
}

/**
 * Question Controller
 * Builds and controls the question section
 */
export class Question {
   /**
    * Load question content
    */
   async load() {
      await this.displayQuestionBody(sheet.data.question);
   }

   /**
    * Display question body content
    * @param {Object} question - Question data
    */
   async displayQuestionBody(question) {
      this.clear();

      const mediaTypes = ["picture", "audio", "pdf"];
      const mediaType = QuestionTypeHelpers.getMediaType(question, mediaTypes);

      if (!mediaType.value) {
         console.warn("No media found for question");
         return;
      }

      // Get blob from resources
      const resource = homework.resources.find((r) => r.name === mediaType.value);
      if (!resource) {
         console.error("Resource not found:", mediaType.value);
         return;
      }

      // Create and add element
      const element = await Media.createElement(resource.blob, { convertPDFtoImg: true });
      domManager.getElement("homework.main.question.body").append(element);
   }

   /**
    * Clear question content
    */
   clear() {
      const container = domManager.getElement("homework.main.question.body");
      container.innerHTML = "";
   }
}

/**
 * Response Controller
 * Manages the response section
 */
export class Response {
   /**
    * Load response content
    * @param {string} type - Question type
    */
   async load(type) {
      this.clear();
      this.displayQuestionText(sheet.data.question.text);

      if (QuestionTypes.isSupported(type)) {
         QuestionTypes.load(type, sheet.data);
      } else {
         console.warn(`Unsupported question type: "${type}"`);
      }
   }

   /**
    * Display question text
    * @param {string} text - Question text
    */
   displayQuestionText(text) {
      const textElement = domManager.getElement("homework.main.response.text");

      if (!text || text.length === 0) {
         Utils._hide(textElement);
      } else {
         textElement.textContent = text;
         Utils._show(textElement);
      }
   }

   /**
    * Clear response content
    */
   clear() {
      this.displayQuestionText("");
      const container = domManager.getElement("homework.main.response.container");

      // Keep the first child (response.text), remove the rest
      while (container.children.length > 1) {
         container.removeChild(container.lastChild);
      }
   }
}

/**
 * Header Controller
 * Controls the header section
 */
export class Header {
   /**
    * Render progress bar
    */
   renderProgress() {
      const container = domManager.getElement("homework.header.progressBar.container");
      container.innerHTML = "";

      const progressBar = this.createProgressBar();
      const counter = this.createProgressCounter();
      const wrapper = this.createProgressWrapper(progressBar, counter);

      container.appendChild(wrapper);
   }

   /**
    * Create progress bar element
    * @returns {HTMLElement}
    */
   createProgressBar() {
      const progressBar = document.createElement("div");
      progressBar.className = "progress-bar";

      const completed = homework.sheetIndex + 1;
      const total = homework.totalSheets || 1;
      const percent = Math.round((completed / total) * 100);

      const fill = document.createElement("div");
      fill.className = "progress-fill";
      fill.style.width = `${percent}%`;
      fill.style.height = "100%";
      fill.style.background = "#4caf50";
      fill.style.transition = "width 0.3s";

      progressBar.appendChild(fill);
      return progressBar;
   }

   /**
    * Create progress counter element
    * @returns {HTMLElement}
    */
   createProgressCounter() {
      const counter = document.createElement("span");
      counter.className = "progress-counter";
      counter.textContent = `${homework.sheetIndex + 1} / ${homework.totalSheets || 1}`;
      counter.style.marginLeft = "12px";
      counter.style.fontWeight = "bold";
      counter.style.fontSize = "14px";
      counter.style.verticalAlign = "middle";
      return counter;
   }

   /**
    * Create progress wrapper element
    * @param {HTMLElement} progressBar
    * @param {HTMLElement} counter
    * @returns {HTMLElement}
    */
   createProgressWrapper(progressBar, counter) {
      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.alignItems = "center";
      wrapper.appendChild(progressBar);
      wrapper.appendChild(counter);
      return wrapper;
   }

   /**
    * Update progress display
    */
   updateProgress() {
      this.renderProgress();
   }
}

/**
 * Footer Controller
 * Controls the footer section
 */
export class Footer {
   /**
    * Set correct feedback
    */
   setCorrect() {
      const container = domManager.getElement("homework.footer.container");
      const feedbackText = domManager.getElement("homework.footer.feedbackText");
      const trophyIcon = domManager.getElement("homework.footer.feedbackIconTrophy");

      container.classList.add("correct");
      feedbackText.textContent = "Correct!";
      Utils._addClass(feedbackText, "correct");
      Utils._show(trophyIcon);
   }

   /**
    * Set incorrect feedback
    */
   setIncorrect() {
      const container = domManager.getElement("homework.footer.container");
      const feedbackText = domManager.getElement("homework.footer.feedbackText");
      const thumbsUpIcon = domManager.getElement("homework.footer.feedbackIconThumbsUp");

      container.classList.add("incorrect");
      feedbackText.textContent = "Incorrect. Try again later.";
      Utils._addClass(feedbackText, "incorrect");
      Utils._show(thumbsUpIcon);
   }

   /**
    * Set almost correct feedback
    */
   setAlmost() {
      const container = domManager.getElement("homework.footer.container");
      const feedbackText = domManager.getElement("homework.footer.feedbackText");
      const thumbsUpIcon = domManager.getElement("homework.footer.feedbackIconThumbsUp");

      container.classList.add("almost");
      feedbackText.textContent = "Almost! You got some correct.";
      Utils._addClass(feedbackText, "almost");
      Utils._show(thumbsUpIcon);
   }

   /**
    * Reset footer to default state
    */
   reset() {
      const container = domManager.getElement("homework.footer.container");
      const btnControl = domManager.getElement("homework.footer.btnControl");
      const feedbackText = domManager.getElement("homework.footer.feedbackText");
      const trophyIcon = domManager.getElement("homework.footer.feedbackIconTrophy");
      const thumbsUpIcon = domManager.getElement("homework.footer.feedbackIconThumbsUp");

      // Remove feedback classes
      container.classList.remove("correct", "incorrect", "almost");

      // Reset control button
      btnControl.classList.remove("mode-next");
      btnControl.classList.add("mode-check");
      btnControl.textContent = "Check";

      // Reset feedback elements
      feedbackText.textContent = "";
      Utils._hide(trophyIcon);
      Utils._hide(thumbsUpIcon);
   }

   /**
    * Set control button mode
    * @param {string} mode - 'check' or 'next'
    */
   setControlMode(mode = "check") {
      const btnControl = domManager.getElement("homework.footer.btnControl");

      if (mode === "next") {
         btnControl.classList.remove("mode-check");
         btnControl.classList.add("mode-next");
         btnControl.textContent = "Next";
      } else {
         btnControl.classList.remove("mode-next");
         btnControl.classList.add("mode-check");
         btnControl.textContent = "Check";
      }
   }
}

// Create singleton instances
const homework = new Homework();
const sheet = new Sheet();
const question = new Question();
const response = new Response();
const header = new Header();
const footer = new Footer();

// Export singleton instances
export { footer, header, homework, question, response, sheet };
