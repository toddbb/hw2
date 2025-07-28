/**
 * Question Type Results
 * Handles result checking for different question types
 */

import { homework, sheet } from "./homework.mjs";
import { QuestionTypeHelpers } from "./questionHelpers.mjs";

export class QuestionTypeResults {
   /**
    * Check multiple choice result
    */
   static multipleChoice = {
      check() {
         const selected = document.querySelector(".multiple-choice-item.selected-blue");

         if (!selected) {
            homework.handleResult(false);
            return;
         }

         const isCorrect = selected.dataset.akey === "correct-yes";

         // For multiple choice, don't pass correctElement to prevent adding .correct class
         homework.handleResult(isCorrect, selected);
      },
   };

   /**
    * Check fill blanks result
    */
   static fillBlanks = {
      check() {
         const inputs = document.querySelectorAll(".fill-blanks-inputItem");
         let correctCount = 0;
         let totalCount = inputs.length;

         inputs.forEach((input) => {
            const expectedAnswerString = input.dataset.akey;
            const userAnswer = QuestionTypeHelpers.normalizeStringsToCompare(input.value);

            // Split possible answers by "/" and normalize each one
            const possibleAnswers = expectedAnswerString.split("/").map((answer) => QuestionTypeHelpers.normalizeStringsToCompare(answer.trim()));

            console.log(`Checking input: "${userAnswer}" against possible answers: [${possibleAnswers.map((a) => `"${a}"`).join(", ")}]`);

            // Check if user answer matches any of the possible answers
            const isCorrect = possibleAnswers.some((expectedAnswer) => userAnswer === expectedAnswer);

            // Apply visual feedback to individual input
            if (isCorrect) {
               correctCount++;
               input.classList.add("correct");
               input.classList.remove("incorrect", "almost");
               // Add class to parent span for pseudo element styling
               const parentSpan = input.parentElement;
               if (parentSpan && parentSpan.classList.contains("fill-blanks-spanItem")) {
                  parentSpan.classList.add("has-correct-input");
                  parentSpan.classList.remove("has-incorrect-input", "has-almost-input");
               }
            } else {
               input.classList.add("incorrect");
               input.classList.remove("correct", "almost");
               // Add class to parent span for pseudo element styling
               /* const parentSpan = input.parentElement;
               if (parentSpan && parentSpan.classList.contains("fill-blanks-spanItem")) {
                  parentSpan.classList.add("has-incorrect-input");
                  parentSpan.classList.remove("has-correct-input", "has-almost-input");
               } */
            }
         });

         console.log(`Fill-blanks result: ${correctCount}/${totalCount} correct`);

         // Determine result based on correct answers
         let result;
         if (correctCount === totalCount) {
            result = "correct"; // All answers correct
         } else if (correctCount > 0) {
            result = "almost"; // Some answers correct
         } else {
            result = "incorrect"; // No answers correct
         }

         homework.handleResult(result);
      },
   };

   /**
    * Check order items result
    */
   static orderItems = {
      check() {
         try {
            const sheetData = sheet.data;
            const correctOrder = QuestionTypeHelpers.getItemOrderedValues(sheetData);
            const userOrder = QuestionTypeResults.orderItems.getUserOrder();
            const items = document.querySelectorAll(".order-item");

            let allCorrect = true;

            // Apply visual feedback to individual items
            for (let i = 0; i < userOrder.length && i < correctOrder.length; i++) {
               const userValue = QuestionTypeHelpers.normalizeStringsToCompare(userOrder[i].value);
               const correctValue = QuestionTypeHelpers.normalizeStringsToCompare(correctOrder[i][userOrder[i].type]);

               if (userValue === correctValue) {
                  // Item is in correct position
                  items[i].classList.add("correct");
                  items[i].classList.remove("incorrect");
               } else {
                  // Item is in wrong position
                  items[i].classList.add("incorrect");
                  items[i].classList.remove("correct");
                  allCorrect = false;
               }
            }

            // Handle case where lengths don't match
            if (userOrder.length !== correctOrder.length) {
               allCorrect = false;
            }

            homework.handleResult(allCorrect);
         } catch (error) {
            console.error("Error checking order items:", error);
            homework.handleResult(false);
         }
      },

      /**
       * Get user's order from the DOM
       * @returns {Array} Array of user-ordered values
       */
      getUserOrder() {
         const items = document.querySelectorAll(".order-item");

         return [...items].map((item) => {
            if (item.querySelector("img")) {
               return { type: "picture", value: item.querySelector("img").src };
            } else if (item.querySelector("audio")) {
               return { type: "audio", value: item.querySelector("audio").src };
            } else {
               return { type: "text", value: item.textContent.trim() };
            }
         });
      },

      /**
       * Compare user order with correct order
       * @param {Array} userOrder - User's order
       * @param {Array} correctOrder - Correct order
       * @returns {boolean} Whether orders match
       */
      compareOrders(userOrder, correctOrder) {
         if (userOrder.length !== correctOrder.length) {
            return false;
         }

         for (let i = 0; i < userOrder.length; i++) {
            const userValue = QuestionTypeHelpers.normalizeStringsToCompare(userOrder[i].value);
            const correctValue = QuestionTypeHelpers.normalizeStringsToCompare(correctOrder[i][userOrder[i].type]);

            if (userValue !== correctValue) {
               return false;
            }
         }

         return true;
      },
   };

   /**
    * Check open answers result
    */
   static openAnswers = {
      check() {
         const inputs = document.querySelectorAll(".open-answers-item");
         let correctCount = 0;
         let totalCount = inputs.length;

         inputs.forEach((input) => {
            const expectedAnswersString = input.dataset.akey;
            const userAnswer = QuestionTypeHelpers.normalizeStringsToCompare(input.value);

            // Split possible answers by "/" and normalize each one
            const possibleAnswers = expectedAnswersString.split("/").map((answer) => QuestionTypeHelpers.normalizeStringsToCompare(answer.trim()));

            console.log(`Checking input: "${userAnswer}" against possible answers: [${possibleAnswers.map((a) => `"${a}"`).join(", ")}]`);

            // Check if user answer matches any of the possible answers
            const isCorrect = possibleAnswers.some((expectedAnswer) => userAnswer === expectedAnswer);

            // Apply visual feedback to individual input
            if (isCorrect) {
               correctCount++;
               input.classList.add("correct");
               input.classList.remove("incorrect", "almost");
            } else {
               input.classList.add("incorrect");
               input.classList.remove("correct", "almost");
            }
         });

         console.log(`Open-answers result: ${correctCount}/${totalCount} correct`);

         // Determine overall result based on correct answers
         let result;
         if (correctCount === totalCount) {
            result = "correct"; // All answers correct
         } else if (correctCount > 0) {
            result = "almost"; // Some answers correct
         } else {
            result = "incorrect"; // No answers correct
         }

         homework.handleResult(result);
      },
   };

   /**
    * Get result checker for a specific question type
    * @param {string} questionType - Type of question
    * @returns {Function|null} Result checker function
    */
   static getChecker(questionType) {
      const checkers = {
         "multiple-choice": this.multipleChoice.check,
         "fill-blanks": this.fillBlanks.check,
         "order-items": this.orderItems.check,
         "open-answers": this.openAnswers.check,
      };

      return checkers[questionType] || null;
   }

   /**
    * Check if question type is supported
    * @param {string} questionType - Type of question
    * @returns {boolean}
    */
   static isSupported(questionType) {
      return this.getChecker(questionType) !== null;
   }
}
