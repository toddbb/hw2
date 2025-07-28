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
      this.userInputValues = new Map(); // Store user's original input values

      // Score tracking
      this.correctSheets = [];
      this.incorrectSheets = [];
      this.skippedSheets = [];
      this.missedQuestions = []; // Combined array of incorrect and skipped questions for retry
      this.isRetryMode = false; // Flag to indicate if we're retrying missed questions

      // State
      this.state = "initial"; // Possible states: "initial", "loading", "loaded", "retrying", "review"
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

      // Determine the actual sheet index based on mode
      let actualSheetIndex;
      if (this.isRetryMode) {
         // In retry mode, get the original sheet index from missed questions
         const missedQuestionData = this.missedQuestions[this.sheetIndex];
         actualSheetIndex = missedQuestionData ? missedQuestionData.index : this.sheetIndex;
      } else {
         actualSheetIndex = this.sheetIndex;
      }

      // Handle both boolean (legacy) and string result types
      let isCorrectAnswer = false;

      // Track score for current sheet
      const currentSheetData = {
         index: actualSheetIndex,
         questionType: sheet.questionType,
         lessonName: this.lessonName,
         isRetryAttempt: this.isRetryMode,
         result: "", // Will be updated based on actual result
      };

      if (typeof result === "boolean") {
         if (result) {
            feedbackElement?.classList.add("correct");
            footer.setCorrect();
            isCorrectAnswer = true;
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
               isCorrectAnswer = true;
               break;
            case "almost":
               feedbackElement?.classList.add("almost");
               footer.setAlmost();
               isCorrectAnswer = true; // Count "almost" as correct
               break;
            case "incorrect":
            default:
               correctElement?.classList.add("correct");
               feedbackElement?.classList.add("incorrect");
               footer.setIncorrect();
               break;
         }
      }

      // Handle score array updates based on mode and result
      if (this.isRetryMode) {
         if (isCorrectAnswer) {
            // Remove from incorrect/skipped arrays and add to correct
            this.incorrectSheets = this.incorrectSheets.filter((sheet) => sheet.index !== actualSheetIndex);
            this.skippedSheets = this.skippedSheets.filter((sheet) => sheet.index !== actualSheetIndex);
            currentSheetData.result = "correct";
            this.correctSheets.push(currentSheetData);
            console.log(`🔄 Retry Mode: Question ${actualSheetIndex + 1} moved to CORRECT (removed from incorrect/skipped)`);
         } else {
            // Still incorrect in retry - remove from skipped and add to incorrect (if not already there)
            this.skippedSheets = this.skippedSheets.filter((sheet) => sheet.index !== actualSheetIndex);
            const alreadyIncorrect = this.incorrectSheets.some((sheet) => sheet.index === actualSheetIndex);
            if (!alreadyIncorrect) {
               currentSheetData.result = "incorrect";
               this.incorrectSheets.push(currentSheetData);
            }
            console.log(`🔄 Retry Mode: Question ${actualSheetIndex + 1} moved to INCORRECT (removed from skipped)`);
         }
      } else {
         // Normal mode - add to appropriate array
         if (isCorrectAnswer) {
            currentSheetData.result = "correct";
            this.correctSheets.push(currentSheetData);
         } else {
            currentSheetData.result = "incorrect";
            this.incorrectSheets.push(currentSheetData);
         }
      }

      // Log retry mode status
      const retryStatus = this.isRetryMode ? " (Retry Mode)" : "";
      console.log(`📊 Score updated${retryStatus} - Correct: ${this.correctSheets.length}, Incorrect: ${this.incorrectSheets.length}, Skipped: ${this.skippedSheets.length}`);

      footer.setControlMode("next");
   }

   /**
    * Handle homework end
    */
   handleEnd() {
      this.displayResults();
      viewController.show("results");
   }

   /**
    * Display results in the results view
    */
   displayResults() {
      const correctCount = this.correctSheets.length;
      const incorrectCount = this.incorrectSheets.length;
      const skippedCount = this.skippedSheets.length;

      // Calculate total based on original homework length, not retry length
      let totalCount;
      if (this.isRetryMode) {
         // In retry mode, calculate original total from lesson info
         totalCount = this.info && this.info.sheets ? this.info.sheets.length : correctCount + incorrectCount + skippedCount;
      } else {
         totalCount = this.totalSheets;
      }

      // Update final score
      const finalScoreElement = document.querySelector(".final-score-value");
      if (finalScoreElement) {
         finalScoreElement.textContent = `${correctCount} / ${totalCount}`;
      }

      // Update title based on mode
      const titleElement = document.querySelector(".results-title");
      if (titleElement) {
         titleElement.textContent = this.isRetryMode ? "Retry Results!" : "Homework Complete!";
      }

      // Update individual score counts
      const scoreIncorrectElement = document.getElementById("score-incorrect");
      const scoreSkippedElement = document.getElementById("score-skipped");
      const scoreTotalElement = document.getElementById("score-total");

      if (scoreIncorrectElement) scoreIncorrectElement.textContent = incorrectCount;
      if (scoreSkippedElement) scoreSkippedElement.textContent = skippedCount;
      if (scoreTotalElement) scoreTotalElement.textContent = correctCount;

      // Update "Try Missed Questions" button state
      this.updateRetryButtonState();

      const modeText = this.isRetryMode ? " (Retry Mode)" : "";
      console.log(`📊 Final Results${modeText} - Correct: ${correctCount}/${totalCount}, Incorrect: ${incorrectCount}, Skipped: ${skippedCount}`);
   }

   /**
    * Update the state of the "Try Missed Questions" button
    */
   updateRetryButtonState() {
      const retryButton = document.querySelector(".results-btn-retry");
      if (!retryButton) return;

      const missedCount = this.incorrectSheets.length + this.skippedSheets.length;

      if (missedCount === 0) {
         retryButton.disabled = true;
         retryButton.textContent = "No Missed Questions";
         retryButton.classList.add("disabled");
      } else {
         retryButton.disabled = false;
         retryButton.textContent = `Try ${missedCount} Missed Questions`;
         retryButton.classList.remove("disabled");
      }
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

      // Reset score tracking
      this.correctSheets = [];
      this.incorrectSheets = [];
      this.skippedSheets = [];
      this.missedQuestions = [];
      this.isRetryMode = false;

      footer.reset();
      header.reset();
      header.updateProgress();
   }

   /**
    * Exit retry mode while preserving score arrays
    */
   exitRetryMode() {
      console.log("🔄 Exiting retry mode");
      this.isRetryMode = false;
      this.missedQuestions = [];
      this.sheetIndex = 0;
      // Don't reset score arrays - they should be preserved
   }

   /**
    * Start retry mode with missed questions (incorrect and skipped)
    * @param {string} lesson - Lesson name to retry
    */
   async startRetryMode(lesson) {
      console.log("🔄 Starting retry mode for missed questions");

      this.missedQuestions = [];

      // Combine incorrect and skipped questions into missed questions array
      this.missedQuestions = [...this.incorrectSheets, ...this.skippedSheets];

      // sort missed questions by index from smallest to largest
      this.missedQuestions.sort((a, b) => a.index - b.index);

      if (this.missedQuestions.length === 0) {
         console.warn("No missed questions to retry");
         return false;
      }

      console.log(`📚 Found ${this.missedQuestions.length} missed questions to retry`);

      // DON'T clear the score arrays - keep them intact
      // Only set retry mode and reset current sheet index
      this.isRetryMode = true;
      this.sheetIndex = 0; // Reset to start from first missed question
      this.totalSheets = this.missedQuestions.length; // Set total to missed questions count

      // Load lesson info and resources but don't reload the entire homework
      this.lessonName = lesson;
      this.info = await this.getInfo(lesson);

      if (!this.info) {
         throw new Error("Failed to load homework info for retry");
      }

      this.resources = await Media.loadResources(this.info.resources, `lessons/${lesson}/test`);

      // Load the first missed question
      await sheet.load();
      return true;
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
      // Determine the actual sheet index based on mode
      let actualSheetIndex;
      if (this.isRetryMode) {
         // In retry mode, get the original sheet index from missed questions
         const missedQuestionData = this.missedQuestions[this.sheetIndex];
         actualSheetIndex = missedQuestionData ? missedQuestionData.index : this.sheetIndex;
      } else {
         actualSheetIndex = this.sheetIndex;
      }

      // Track skipped sheet
      const currentSheetData = {
         index: actualSheetIndex,
         questionType: sheet.questionType,
         lessonName: this.lessonName,
         isRetryAttempt: this.isRetryMode,
         result: "skipped",
      };

      // Handle score array updates based on mode
      if (this.isRetryMode) {
         // In retry mode, remove from incorrect array and ensure it's in skipped array
         this.incorrectSheets = this.incorrectSheets.filter((sheet) => sheet.index !== actualSheetIndex);
         const alreadySkipped = this.skippedSheets.some((sheet) => sheet.index === actualSheetIndex);
         if (!alreadySkipped) {
            this.skippedSheets.push(currentSheetData);
         }
         console.log(`🔄 Retry Mode: Question ${actualSheetIndex + 1} moved to SKIPPED (removed from incorrect)`);
      } else {
         // Normal mode - add to skipped array
         this.skippedSheets.push(currentSheetData);
      }

      // Log retry mode status
      const retryStatus = this.isRetryMode ? " (Retry Mode)" : "";
      console.log(`⏭️ Question skipped${retryStatus} - Correct: ${this.correctSheets.length}, Incorrect: ${this.incorrectSheets.length}, Skipped: ${this.skippedSheets.length}`);

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
    * Handle show answers action
    */
   handleShowAnswers() {
      console.log("🔍 Show answers clicked");

      const btnShowAnswers = domManager.getElement("homework.footer.btnShowAnswers");

      if (!btnShowAnswers) {
         console.warn("Show answers button not found");
         return;
      }

      const questionType = sheet.questionType;

      if (!questionType) {
         console.warn("No question type found for show answers");
         return;
      }

      // Toggle button state based on current text
      const isCurrentlyShowing = btnShowAnswers.textContent === "Show Answers";

      if (isCurrentlyShowing) {
         // Switch to "Hide Answers" mode
         btnShowAnswers.textContent = "Hide Answers";
         btnShowAnswers.classList.remove("show-answers");
         btnShowAnswers.classList.add("hide-answers");

         // Show answers for the current question type
         switch (questionType) {
            case "multiple-choice":
               this.showMultipleChoiceAnswer();
               break;
            case "fill-blanks":
               this.showFillBlanksAnswers();
               break;
            case "open-answers":
               this.showOpenAnswers();
               break;
            case "order-items":
               this.showOrderItemsAnswers();
               break;
            default:
               console.log(`Show answers not yet implemented for question type: ${questionType}`);
               break;
         }
      } else {
         // Switch to "Show Answers" mode
         btnShowAnswers.textContent = "Show Answers";
         btnShowAnswers.classList.remove("hide-answers");
         btnShowAnswers.classList.add("show-answers");

         // Hide answers for the current question type
         switch (questionType) {
            case "multiple-choice":
               this.hideMultipleChoiceAnswer();
               break;
            case "fill-blanks":
               this.hideFillBlanksAnswers();
               break;
            case "open-answers":
               this.hideOpenAnswers();
               break;
            case "order-items":
               this.hideOrderItemsAnswers();
               break;
            default:
               console.log(`Hide answers not yet implemented for question type: ${questionType}`);
               break;
         }
      }
   }
   /**
    * Show correct answer for multiple choice questions
    */
   showMultipleChoiceAnswer() {
      const correctElement = document.querySelector('.multiple-choice-item[data-akey="correct-yes"]');

      if (correctElement) {
         correctElement.classList.add("show-answers");
         console.log("✅ Multiple choice correct answer highlighted with show-answers class");
      } else {
         console.warn("Could not find correct answer element for multiple choice");
      }
   }

   /**
    * Hide correct answer for multiple choice questions
    */
   hideMultipleChoiceAnswer() {
      const correctElement = document.querySelector('.multiple-choice-item[data-akey="correct-yes"]');

      if (correctElement) {
         correctElement.classList.remove("show-answers");
         console.log("🔒 Multiple choice correct answer hidden, show-answers class removed");
      } else {
         console.warn("Could not find correct answer element for multiple choice");
      }
   }

   /**
    * Show correct answers for fill-blanks questions
    */
   showFillBlanksAnswers() {
      const inputs = document.querySelectorAll(".fill-blanks-inputItem");

      inputs.forEach((input, index) => {
         const correctAnswerString = input.dataset.akey;

         if (correctAnswerString) {
            // Store user's original value before showing correct answer
            const storageKey = `fill-blanks-${index}`;
            this.userInputValues.set(storageKey, input.value);

            // Get the first possible answer (in case there are multiple separated by "/")
            const firstCorrectAnswer = correctAnswerString.split("/")[0].trim();

            // Add show-answers class and disable input
            input.classList.add("show-answers");
            input.disabled = true;

            // Set the value to the first correct answer
            input.value = firstCorrectAnswer;

            console.log(`✅ Fill-blanks answer shown: "${firstCorrectAnswer}" (original: "${this.userInputValues.get(storageKey)}")`);
         }
      });

      // Auto-resize all textareas after value changes
      this.autoResizeTextareas(".fill-blanks-inputItem");
   }

   /**
    * Hide correct answers for fill-blanks questions
    */
   hideFillBlanksAnswers() {
      const inputs = document.querySelectorAll(".fill-blanks-inputItem");

      inputs.forEach((input, index) => {
         // Remove show-answers class but keep input disabled
         input.classList.remove("show-answers");
         // Note: keeping input.disabled = true (no change to disabled state)

         // Restore user's original input value
         const storageKey = `fill-blanks-${index}`;
         const originalValue = this.userInputValues.get(storageKey) || "";
         input.value = originalValue;

         console.log(`🔒 Fill-blanks answer hidden, restored: "${originalValue}" (input remains disabled)`);
      });

      // Auto-resize all textareas after value changes
      this.autoResizeTextareas(".fill-blanks-inputItem");
   }

   /**
    * Show correct answers for open-answers questions
    */
   showOpenAnswers() {
      const inputs = document.querySelectorAll(".open-answers-item");

      inputs.forEach((input, index) => {
         const correctAnswerString = input.dataset.akey;

         if (correctAnswerString) {
            // Store user's original value before showing correct answer
            const storageKey = `open-answers-${index}`;
            this.userInputValues.set(storageKey, input.value);

            // Get the first possible answer (in case there are multiple separated by "/")
            const firstCorrectAnswer = correctAnswerString.split("/")[0].trim();

            // Add show-answers class and disable input
            input.classList.add("show-answers");
            input.disabled = true;

            // Set the value to the first correct answer
            input.value = firstCorrectAnswer;

            console.log(`✅ Open-answers answer shown: "${firstCorrectAnswer}" (original: "${this.userInputValues.get(storageKey)}")`);
         }
      });

      // Auto-resize all textareas after value changes
      this.autoResizeTextareas(".open-answers-item");
   }

   /**
    * Hide correct answers for open-answers questions
    */
   hideOpenAnswers() {
      const inputs = document.querySelectorAll(".open-answers-item");

      inputs.forEach((input, index) => {
         // Remove show-answers class and re-enable input
         input.classList.remove("show-answers");
         input.disabled = false;

         // Restore user's original input value
         const storageKey = `open-answers-${index}`;
         const originalValue = this.userInputValues.get(storageKey) || "";
         input.value = originalValue;

         console.log(`🔒 Open-answers answer hidden, restored: "${originalValue}"`);
      });

      // Auto-resize all textareas after value changes
      this.autoResizeTextareas(".open-answers-item");
   }

   /**
    * Auto-resize textareas to fit their content
    * @param {string} selector - CSS selector for textareas to resize
    */
   autoResizeTextareas(selector) {
      setTimeout(() => {
         const textareas = document.querySelectorAll(selector);
         textareas.forEach((textarea) => {
            if (textarea.tagName === "TEXTAREA") {
               textarea.style.height = "auto";
               textarea.style.height = textarea.scrollHeight + 5 + "px";
            }
         });
      }, 10); // Small delay to ensure value changes are applied
   }

   /**
    * Show correct order for order-items questions
    */
   showOrderItemsAnswers() {
      const container = document.querySelector(".order-items-container");
      const items = document.querySelectorAll(".order-item");

      if (!container || items.length === 0) {
         console.warn("No order-items container or items found");
         return;
      }

      // Store current user order before showing correct order
      const currentOrder = Array.from(items).map((item) => ({
         element: item.cloneNode(true),
         originalIndex: Array.from(container.children).indexOf(item),
      }));
      this.userInputValues.set("order-items-user-order", currentOrder);

      // Get the correct order from sheet data
      const correctOrder = QuestionTypeHelpers.getItemOrderedValues(sheet.data);

      // Create array to hold items in correct order
      const itemsInCorrectOrder = [];

      // Match each correct answer with its corresponding DOM element
      correctOrder.forEach((correctItem, correctIndex) => {
         for (let item of items) {
            let itemValue = "";

            // Get the item's value based on its content type
            if (item.querySelector("img")) {
               // For images, compare the src path
               const imgSrc = item.querySelector("img").src;
               itemValue = correctItem.picture || correctItem.image || "";
               if (imgSrc.includes(itemValue) || itemValue.includes(imgSrc.split("/").pop())) {
                  itemsInCorrectOrder[correctIndex] = item;
                  break;
               }
            } else if (item.querySelector("audio")) {
               // For audio, compare the src path
               const audioSrc = item.querySelector("audio").src;
               itemValue = correctItem.audio || "";
               if (audioSrc.includes(itemValue) || itemValue.includes(audioSrc.split("/").pop())) {
                  itemsInCorrectOrder[correctIndex] = item;
                  break;
               }
            } else {
               // For text, compare the text content
               const itemText = QuestionTypeHelpers.normalizeStringsToCompare(item.textContent.trim());
               const correctText = QuestionTypeHelpers.normalizeStringsToCompare(correctItem.text || "");
               if (itemText === correctText) {
                  itemsInCorrectOrder[correctIndex] = item;
                  break;
               }
            }
         }
      });

      // Clear container and append items in correct order
      container.innerHTML = "";
      itemsInCorrectOrder.forEach((item) => {
         if (item) {
            item.classList.add("show-answers");
            container.appendChild(item);
         }
      });

      console.log("✅ Order-items correct order displayed");
   }

   /**
    * Hide correct order for order-items questions and restore user order
    */
   hideOrderItemsAnswers() {
      const container = document.querySelector(".order-items-container");

      if (!container) {
         console.warn("No order-items container found");
         return;
      }

      // Get stored user order
      const userOrder = this.userInputValues.get("order-items-user-order");

      if (!userOrder) {
         console.warn("No stored user order found for order-items");
         return;
      }

      // Clear container and restore user's original order
      container.innerHTML = "";

      // Sort by original index and append
      userOrder
         .sort((a, b) => a.originalIndex - b.originalIndex)
         .forEach((orderItem) => {
            const item = orderItem.element;
            item.classList.remove("show-answers");
            container.appendChild(item);
         });

      console.log("🔒 Order-items user order restored");
   }

   /**
    * Disable all interactions for all question types after check is clicked
    */
   disableAllQuestionInteractions() {
      // Disable multiple choice items
      const multipleChoiceItems = document.querySelectorAll(".multiple-choice-item");
      multipleChoiceItems.forEach((item) => {
         item.style.pointerEvents = "none";
         item.style.cursor = "default";
      });

      // Disable fill-blanks inputs
      const fillBlanksInputs = document.querySelectorAll(".fill-blanks-inputItem");
      fillBlanksInputs.forEach((input) => {
         input.disabled = true;
      });

      // Disable order items (prevent dragging)
      const orderItems = document.querySelectorAll(".order-item");
      orderItems.forEach((item) => {
         item.style.pointerEvents = "none";
         item.style.cursor = "default";
         item.draggable = false;
      });

      // Disable open answer inputs
      const openAnswerInputs = document.querySelectorAll(".open-answers-item");
      openAnswerInputs.forEach((input) => {
         input.disabled = true;
      });

      console.log("🔒 All question interactions disabled");
   }

   /**
    * Enable all interactions for all question types when new sheet loads
    */
   enableAllQuestionInteractions() {
      // Enable multiple choice items
      const multipleChoiceItems = document.querySelectorAll(".multiple-choice-item");
      multipleChoiceItems.forEach((item) => {
         item.style.pointerEvents = "";
         item.style.cursor = "pointer";
      });

      // Enable fill-blanks inputs
      const fillBlanksInputs = document.querySelectorAll(".fill-blanks-inputItem");
      fillBlanksInputs.forEach((input) => {
         input.disabled = false;
      });

      // Enable order items (allow dragging)
      const orderItems = document.querySelectorAll(".order-item");
      orderItems.forEach((item) => {
         item.style.pointerEvents = "";
         item.style.cursor = "grab";
         item.draggable = true;
      });

      // Enable open answer inputs
      const openAnswerInputs = document.querySelectorAll(".open-answers-item");
      openAnswerInputs.forEach((input) => {
         input.disabled = false;
      });

      console.log("🔓 All question interactions enabled");
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

      // Disable all interactions for all question types
      this.disableAllQuestionInteractions();

      // Hide skip button when checking
      const btnSkip = domManager.getElement("homework.footer.btnSkip");
      btnSkip.classList.add("nodisplay");

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

         // In retry mode, load the sheet from missed questions array
         if (homework.isRetryMode) {
            const missedQuestionData = homework.missedQuestions[homework.sheetIndex];
            if (!missedQuestionData) {
               console.error("No missed question data found for current sheet index");
               return;
            }

            // Load the actual sheet data from the original sheet index
            this.data = homework.info.sheets[missedQuestionData.index];
            console.log(`📄 Loading missed question: original sheet ${missedQuestionData.index + 1}, retry ${homework.sheetIndex + 1}/${homework.totalSheets}`);
         } else {
            // Normal mode - load sequential sheet
            this.data = homework.info.sheets[homework.sheetIndex];
         }

         this.questionType = this.data.info.type;
         this.instruction = this.data.info.en;

         this.displayInstruction(this.instruction);
         await question.load();
         await response.load(this.questionType);

         // Wait for auto-resize to complete before showing the container
         await this.waitForAutoResize(this.questionType);

         Utils._visible(domManager.getElement("homework.main.container"));

         // Set focus on first textarea after everything is loaded and visible
         this.setFocusAfterLoad(this.questionType);

         header.updateProgress();

         homework.disableResponseEvents = false;

         this.setupDevMode();

         const modeText = homework.isRetryMode ? " (Retry Mode)" : "";
         console.log(`📄 Sheet loaded${modeText}: ${homework.sheetIndex + 1}/${homework.totalSheets}`);
      } catch (error) {
         console.error("❌ Failed to load sheet:", error);
         throw error;
      }
   }

   /**
    * Wait for auto-resize to complete to prevent visual blip
    * @param {string} questionType - The question type
    */
   async waitForAutoResize(questionType) {
      // Only wait for question types that have textareas
      if (questionType === "fill-blanks" || questionType === "open-answers") {
         // Wait for the same duration as initializeTextareaAutoResize plus a small buffer
         await new Promise((resolve) => setTimeout(resolve, 200));
         console.log("⏱️ Auto-resize wait completed, container ready to display");
      }
   }

   /**
    * Set focus on first textarea after loading is complete
    * @param {string} questionType - The question type
    */
   setFocusAfterLoad(questionType) {
      // Only set focus for question types that have textareas
      if (questionType === "fill-blanks" || questionType === "open-answers") {
         setTimeout(() => {
            let firstInput = null;

            if (questionType === "fill-blanks") {
               firstInput = document.querySelector(".fill-blanks-inputItem");
            } else if (questionType === "open-answers") {
               firstInput = document.querySelector(".open-answers-item");
            }

            if (firstInput) {
               firstInput.focus();
               console.log(`🎯 Focus set on first ${questionType} textarea after load completion`);
            }
         }, 50); // Small delay to ensure container is fully visible
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

         // Setup Enter key navigation for inputs
         this.setupEnterKeyNavigation(type);

         // Initialize auto-resize for textareas
         this.initializeTextareaAutoResize(type);
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

   /**
    * Set focus on the first input for fill-blanks and open-answers
    * @param {string} type - Question type
    */
   setFocusOnFirstInput(type) {
      setTimeout(() => {
         let firstInput = null;

         if (type === "fill-blanks") {
            firstInput = document.querySelector(".fill-blanks-inputItem");
         } else if (type === "open-answers") {
            firstInput = document.querySelector(".open-answers-item");
         }

         if (firstInput) {
            firstInput.focus();
            console.log(`🎯 Focus set on first ${type} textarea`);
         }
      }, 100); // Small delay to ensure elements are rendered
   }

   /**
    * Setup Enter key navigation for inputs
    * @param {string} type - Question type
    */
   setupEnterKeyNavigation(type) {
      setTimeout(() => {
         let inputs = [];

         if (type === "fill-blanks") {
            inputs = Array.from(document.querySelectorAll(".fill-blanks-inputItem"));
         } else if (type === "open-answers") {
            inputs = Array.from(document.querySelectorAll(".open-answers-item"));
         }

         inputs.forEach((input, index) => {
            input.addEventListener("keydown", (event) => {
               if (event.key === "Enter") {
                  const isLastInput = index === inputs.length - 1;

                  // For textarea elements
                  if (input.tagName === "TEXTAREA") {
                     // If it's the last input, Enter triggers "Check" button
                     if (isLastInput) {
                        event.preventDefault();
                        const checkButton = domManager.getElement("homework.footer.btnControl");
                        if (checkButton && checkButton.classList.contains("active")) {
                           checkButton.click();
                        }
                        return;
                     }

                     // For non-last inputs, use Ctrl+Enter or Shift+Enter for navigation
                     // Allow normal Enter for new lines unless modifier is pressed
                     if (!event.ctrlKey && !event.shiftKey) {
                        return; // Allow normal Enter behavior (new line)
                     }
                  }

                  event.preventDefault();

                  const nextIndex = index + 1;
                  if (nextIndex < inputs.length) {
                     // Move to next input
                     inputs[nextIndex].focus();
                  } else {
                     // Last input - trigger check if button is active
                     const checkButton = domManager.getElement("homework.footer.btnControl");
                     if (checkButton && checkButton.classList.contains("active")) {
                        checkButton.click();
                     }
                  }
               }
            });

            // Auto-resize textarea as content changes (only if not already initialized)
            if (input.tagName === "TEXTAREA" && !input.hasAttribute("data-resize-initialized")) {
               input.addEventListener("input", () => {
                  input.style.height = "auto";
                  input.style.height = input.scrollHeight + 5 + "px"; // add for padding
               });
               input.setAttribute("data-resize-initialized", "true");
            }
         });

         if (inputs.length > 0) {
            const elementType = inputs[0].tagName.toLowerCase();
            console.log(
               `⌨️ Enter key navigation setup for ${inputs.length} ${type} ${elementType}s${
                  elementType === "textarea" ? " (use Ctrl+Enter or Shift+Enter to navigate, Enter on last field to Check)" : ""
               }`
            );
         }
      }, 100); // Small delay to ensure elements are rendered
   }

   /**
    * Initialize auto-resize functionality for textareas
    * @param {string} type - Question type
    */
   initializeTextareaAutoResize(type) {
      setTimeout(() => {
         let textareas = [];

         if (type === "fill-blanks") {
            textareas = Array.from(document.querySelectorAll(".fill-blanks-inputItem"));
         } else if (type === "open-answers") {
            textareas = Array.from(document.querySelectorAll(".open-answers-item"));
         }

         textareas.forEach((textarea) => {
            if (textarea.tagName === "TEXTAREA") {
               // Set initial height
               textarea.style.height = "auto";
               textarea.style.height = textarea.scrollHeight + 5 + "px";

               // Add resize event listener if not already added in setupEnterKeyNavigation
               if (!textarea.hasAttribute("data-resize-initialized")) {
                  textarea.addEventListener("input", () => {
                     textarea.style.height = "auto";
                     textarea.style.height = textarea.scrollHeight + 5 + "px";
                  });
                  textarea.setAttribute("data-resize-initialized", "true");
               }
            }
         });

         if (textareas.length > 0) {
            console.log(`📏 Auto-resize initialized for ${textareas.length} ${type} textareas`);
         }
      }, 150); // Slightly longer delay to ensure content is loaded
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
      this.updateRetryHeader();
   }

   /**
    * Update retry header display
    */
   updateRetryHeader() {
      const retryContainer = domManager.getElement("homework.header.retry.container");
      const retryQuestionNum = domManager.getElement("homework.header.retry.questionNum");
      const retryType = domManager.getElement("homework.header.retry.type");
      const progressBarContainer = domManager.getElement("homework.header.progressBar.container");

      if (!retryContainer || !retryQuestionNum) {
         return;
      }

      if (homework.isRetryMode) {
         // Show retry header and update question number
         const missedQuestionData = homework.missedQuestions[homework.sheetIndex];
         if (missedQuestionData) {
            const originalQuestionNum = missedQuestionData.index + 1;
            retryQuestionNum.textContent = originalQuestionNum;

            // Update retry type text based on missed question result
            if (retryType) {
               if (missedQuestionData.result === "incorrect") {
                  retryType.textContent = "Missed ";
               } else if (missedQuestionData.result === "skipped") {
                  retryType.textContent = "Skipped ";
               }
            }

            retryContainer.classList.remove("nodisplay");

            // Hide progress bar during retry mode
            if (progressBarContainer) {
               progressBarContainer.classList.add("nodisplay");
            }
         }
      } else {
         // Hide retry header in normal mode
         retryContainer.classList.add("nodisplay");

         // Show progress bar in normal mode
         if (progressBarContainer) {
            progressBarContainer.classList.remove("nodisplay");
         }
      }
   }

   /**
    * Reset header state
    */
   reset() {
      const retryContainer = domManager.getElement("homework.header.retry.container");
      const progressBarContainer = domManager.getElement("homework.header.progressBar.container");

      if (retryContainer) {
         retryContainer.classList.add("nodisplay");
      }

      // Ensure progress bar is visible when resetting
      if (progressBarContainer) {
         progressBarContainer.classList.remove("nodisplay");
      }
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
      feedbackText.textContent = Config.Messages.Footer.correct;
      Utils._addClass(feedbackText, "correct");
      Utils._show(trophyIcon);

      // Trigger confetti animation for correct answers
      this.triggerConfetti();
   }

   /**
    * Trigger confetti animation
    */
   triggerConfetti() {
      // Check if confetti library is available
      if (typeof confetti === "undefined") {
         console.warn("Confetti library not loaded");
         return;
      }

      // Get footer container for confetti origin
      const container = domManager.getElement("homework.footer.container");
      const rect = container.getBoundingClientRect();

      // Calculate origin point (center of footer)
      const originX = (rect.left + rect.width / 2) / window.innerWidth;
      const originY = (rect.top + rect.height / 2) / window.innerHeight;

      // Launch confetti from footer
      confetti({
         particleCount: 30,
         spread: 45,
         origin: { x: originX, y: originY },
         colors: ["#00c853", "#4caf50", "#66bb6a"],
         startVelocity: 20,
         gravity: 0.8,
         scalar: 0.8,
      });

      // Additional confetti burst after a short delay
      setTimeout(() => {
         confetti({
            particleCount: 30,
            spread: 45,
            origin: { x: originX, y: originY },
            colors: ["#ffd700", "#ffeb3b"],
            startVelocity: 15,
            gravity: 0.8,
            scalar: 0.7,
         });
      }, 200);
   }

   /**
    * Set incorrect feedback
    */
   setIncorrect() {
      const container = domManager.getElement("homework.footer.container");
      const feedbackText = domManager.getElement("homework.footer.feedbackText");
      const thumbsUpIcon = domManager.getElement("homework.footer.feedbackIconThumbsUp");
      const btnShowAnswers = domManager.getElement("homework.footer.btnShowAnswers");

      container.classList.add("incorrect");
      feedbackText.textContent = Config.Messages.Footer.incorrect;
      Utils._addClass(feedbackText, "incorrect");
      Utils._show(thumbsUpIcon);

      // Show the "Show Answers" button for incorrect answers
      if (btnShowAnswers) {
         btnShowAnswers.classList.remove("nodisplay");
      }
   }

   /**
    * Set almost correct feedback
    */
   setAlmost() {
      const container = domManager.getElement("homework.footer.container");
      const feedbackText = domManager.getElement("homework.footer.feedbackText");
      const thumbsUpIcon = domManager.getElement("homework.footer.feedbackIconThumbsUp");
      const btnShowAnswers = domManager.getElement("homework.footer.btnShowAnswers");

      container.classList.add("almost");
      feedbackText.textContent = Config.Messages.Footer.almost;
      Utils._addClass(feedbackText, "almost");
      Utils._show(thumbsUpIcon);

      // Show the "Show Answers" button for almost correct answers
      if (btnShowAnswers) {
         btnShowAnswers.classList.remove("nodisplay");
      }
   }

   /**
    * Reset footer to default state
    */
   reset() {
      const container = domManager.getElement("homework.footer.container");
      const btnControl = domManager.getElement("homework.footer.btnControl");
      const btnSkip = domManager.getElement("homework.footer.btnSkip");
      const btnShowAnswers = domManager.getElement("homework.footer.btnShowAnswers");
      const feedbackText = domManager.getElement("homework.footer.feedbackText");
      const trophyIcon = domManager.getElement("homework.footer.feedbackIconTrophy");
      const thumbsUpIcon = domManager.getElement("homework.footer.feedbackIconThumbsUp");

      // Remove feedback classes
      container.classList.remove("correct", "incorrect", "almost");

      // Reset control button
      btnControl.classList.remove("mode-next");
      btnControl.classList.add("mode-check");
      btnControl.textContent = "Check";

      // Show skip button again
      btnSkip.classList.remove("nodisplay");

      // Reset show answers button
      if (btnShowAnswers) {
         btnShowAnswers.classList.add("nodisplay");
         btnShowAnswers.textContent = "Show Answers";
         btnShowAnswers.classList.remove("hide-answers");
         btnShowAnswers.classList.add("show-answers");
      }

      // Reset feedback elements
      feedbackText.textContent = "";
      Utils._hide(trophyIcon);
      Utils._hide(thumbsUpIcon);

      // Clear stored user input values for new sheet
      homework.userInputValues.clear();

      // Re-enable all question interactions when resetting for new sheet
      homework.enableAllQuestionInteractions();
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
