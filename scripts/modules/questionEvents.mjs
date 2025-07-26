/**
 * Question Type Events
 * Handles events for different question types
 */

import * as Utils from "./utils.mjs";

export class QuestionTypeEvents {
   /**
    * Multiple Choice event handlers
    */
   static multipleChoice = {
      handler(event) {
         if (!event.target.classList.contains("multiple-choice-item")) return;

         // Remove selected class from all items
         const items = event.target.parentNode.querySelectorAll(".multiple-choice-item");
         Utils._removeClass(items, "selected-blue");

         // Add selected class to clicked item
         const item = event.target;
         Utils._addClass(item, "selected-blue");
      },
   };

   /**
    * Order Items event handlers
    */
   static orderItems = {
      container: null,
      draggedItem: null,
      lastAfter: null,

      /**
       * Initialize drag and drop for order items
       * @param {HTMLElement} container
       */
      init(container) {
         this.container = container;
         this.lastAfter = Symbol("start"); // Unique value that can never === null or a node

         this.setupDragStart();
         this.setupDragOver();
         this.setupDragEnd();
      },

      /**
       * Setup drag start event
       */
      setupDragStart() {
         this.container.addEventListener("dragstart", (event) => {
            if (event.target.classList.contains("order-item")) {
               this.draggedItem = event.target;
               event.target.classList.add("dragging");
            }
         });
      },

      /**
       * Setup drag over event
       */
      setupDragOver() {
         this.container.addEventListener("dragover", (event) => {
            event.preventDefault();
            const after = this.getDropTarget(event.clientX);

            // Only update if target actually changed
            if (after === this.lastAfter) return;
            this.lastAfter = after;

            if (!after) {
               // Append to end only once, when crossing the last midpoint
               if (this.container.lastElementChild !== this.draggedItem) {
                  this.container.appendChild(this.draggedItem);
               }
            } else {
               // Insert before target only if not already there
               if (after.previousElementSibling !== this.draggedItem) {
                  this.container.insertBefore(this.draggedItem, after);
               }
            }
         });
      },

      /**
       * Setup drag end event
       */
      setupDragEnd() {
         this.container.addEventListener("dragend", () => {
            if (this.draggedItem) {
               this.draggedItem.classList.remove("dragging");
            }
            this.draggedItem = null;
            this.lastAfter = Symbol("start"); // Reset for next drag
         });
      },

      /**
       * Get the drop target based on mouse position
       * @param {number} x - Mouse X coordinate
       * @returns {HTMLElement|null}
       */
      getDropTarget(x) {
         const items = [...this.container.querySelectorAll(".order-item:not(.dragging)")];
         return (
            items.find((item) => {
               const box = item.getBoundingClientRect();
               return x < box.left + box.width / 2;
            }) || null
         );
      },
   };

   /**
    * Fill Blanks event handlers (if needed in the future)
    */
   static fillBlanks = {
      // Could add input validation, auto-complete, etc.
   };

   /**
    * Open Answers event handlers (if needed in the future)
    */
   static openAnswers = {
      // Could add input validation, character limits, etc.
   };
}
