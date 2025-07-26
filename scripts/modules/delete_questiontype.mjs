/**
 * Question Type Module (Legacy Compatibility)
 *
 * This module provides backward compatibility for the original questiontype.mjs
 * while delegating to the new modular structure.
 *
 * @deprecated Use the new QuestionTypes module instead
 */

import { QuestionTypeEvents, QuestionTypeHelpers, QuestionTypeLoaders, QuestionTypeResults, QuestionTypes } from "./questionTypes.mjs";

// Legacy compatibility exports
export const Load = {
   multipleChoice: QuestionTypeLoaders.multipleChoice,
   fillBlanks: QuestionTypeLoaders.fillBlanks,
   orderItems: QuestionTypeLoaders.orderItems,
   openAnswer: QuestionTypeLoaders.openAnswer,
};

export const Events = {
   multipleChoice: QuestionTypeEvents.multipleChoice,
   orderItems: QuestionTypeEvents.orderItems,
   fillBlanks: QuestionTypeEvents.fillBlanks,
   openAnswers: QuestionTypeEvents.openAnswers,
};

export const Results = {
   multipleChoice: QuestionTypeResults.multipleChoice,
   fillBlanks: QuestionTypeResults.fillBlanks,
   orderItems: QuestionTypeResults.orderItems,
   openAnswers: QuestionTypeResults.openAnswers,
};

// Helper functions for backward compatibility
export const getMediaType = QuestionTypeHelpers.getMediaType;
export const normalizeStringsToCompare = QuestionTypeHelpers.normalizeStringsToCompare;

// Main QuestionTypes export
export default QuestionTypes;
