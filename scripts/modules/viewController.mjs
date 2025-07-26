/**
 * View Controller
 * Manages view transitions and visibility
 */

import { domManager } from "./domManager.mjs";
import * as Utils from "./utils.mjs";

export class ViewController {
   constructor() {
      this.currentView = null;
      this.views = {};
   }

   /**
    * Initialize view controller
    */
   init() {
      this.views = domManager.elements.views;
      console.log("View Controller initialized");
   }

   /**
    * Show a specific view and hide others
    * @param {string} viewName - Name of the view to show
    */
   show(viewName) {
      const view = this.views[viewName];

      if (!view) {
         console.error(`View '${viewName}' not found`);
         return;
      }

      this.hideAll();
      Utils._show(view);
      this.currentView = viewName;

      console.log(`Switched to view: ${viewName}`);
   }

   /**
    * Hide all views
    */
   hideAll() {
      Object.values(this.views).forEach((view) => {
         if (view) {
            Utils._hide(view);
         }
      });
   }

   /**
    * Get current active view
    * @returns {string|null}
    */
   getCurrentView() {
      return this.currentView;
   }

   /**
    * Check if a specific view is currently active
    * @param {string} viewName
    * @returns {boolean}
    */
   isViewActive(viewName) {
      return this.currentView === viewName;
   }

   /**
    * Add a new view to the controller
    * @param {string} name
    * @param {HTMLElement} element
    */
   addView(name, element) {
      this.views[name] = element;
   }

   /**
    * Remove a view from the controller
    * @param {string} name
    */
   removeView(name) {
      delete this.views[name];
      if (this.currentView === name) {
         this.currentView = null;
      }
   }
}

// Create singleton instance
export const viewController = new ViewController();
