/**
 * Question Type Loaders
 * Handles loading different question types into the DOM
 */

import { QuestionTypeEvents } from "./questionEvents.mjs";
import { QuestionTypeHelpers } from "./questionHelpers.mjs";
import * as Utils from "./utils.mjs";

export class QuestionTypeLoaders {
   /**
    * Load multiple choice question
    * @param {Object} data - Question data
    */
   static multipleChoice(data) {
      const container = QuestionTypeHelpers.createContainer(data);
      const responses = QuestionTypeHelpers.extractKeys("answer", data);

      // Shuffle the responses so the correct answer isn't always first
      const responsesShuffled = Utils._shuffleArray([...responses]); // Create a copy before shuffling

      const options = {
         classes: ["answer-item", "multiple-choice-item", "fit-text"],
         parent: container,
         attributes: {},
      };

      responsesShuffled.forEach((answer, index) => {
         options.attributes["data-akey"] = `correct-${answer.correct}`;
         options.id = `answer-${String(index).padStart(2, "0")}`;
         options.textContent = answer.text;
         Utils._createElement("div", options);
      });
   }

   /**
    * Load fill in blanks question
    * @param {Object} data - Question data
    */
   static fillBlanks(data) {
      const container = QuestionTypeHelpers.createContainer(data);
      const responses = QuestionTypeHelpers.extractKeys("paragraph", data);

      // div container
      const options = {
         classes: ["answer-item", "fill-blanks-item", "fit-text"],
         parent: container,
      };

      responses.forEach((response, index) => {
         options.id = `paragraph-${String(index).padStart(2, "0")}`;
         const responseContainer = Utils._createElement("div", options);

         // <p> or <textarea> elements
         const inlineOptions = {
            text: {
               classes: ["fill-blanks-textItem"],
               parent: responseContainer,
            },
            textarea: {
               classes: ["fill-blanks-inputItem"],
               attributes: {
                  autocomplete: "off",
                  rows: "1",
                  wrap: "soft",
               },
            },
         };

         const parsed = QuestionTypeHelpers.parseCurlyBraces(response.text);

         parsed.forEach((item, itemIndex) => {
            if (item.type === "text") {
               inlineOptions.text.textContent = item.value;
               Utils._createElement("p", inlineOptions.text);
            } else if (item.type === "braced") {
               /* // create span element for textarea
               const spanOptions = {
                  classes: ["fill-blanks-spanItem"],
                  parent: responseContainer,
               }; */

               /* const span = Utils._createElement("span", spanOptions); */
               inlineOptions.textarea.parent = responseContainer;
               inlineOptions.textarea.id = `textarea-${String(index).padStart(2, "0")}-${String(itemIndex).padStart(2, "0")}`;
               inlineOptions.textarea.attributes["data-akey"] = item.value;
               Utils._createElement("textarea", inlineOptions.textarea);
            }
         });
      });
   }

   /**
    * Load order items question
    * @param {Object} data - Question data
    */
   static orderItems(data) {
      const container = QuestionTypeHelpers.createContainer(data);
      const responses = QuestionTypeHelpers.extractKeys("item", data);

      console.log("Order Items Responses:", responses);

      const options = {
         classes: ["order-item", "fit-text"],
         attributes: { draggable: true },
         parent: container,
      };

      const responsesShuffled = Utils._shuffleArray(responses);

      responsesShuffled.forEach((response, index) => {
         options.id = `order-item-${String(index).padStart(2, "0")}`;
         const mediaType = QuestionTypeHelpers.getMediaType(response, ["text", "picture", "audio"]);

         switch (mediaType.type) {
            case "text":
               options.textContent = response.text;
               break;
            case "picture":
               options.innerHTML = `<img src="${response.picture}" />`;
               break;
            case "audio":
               options.innerHTML = `<audio controls controlslist="nodownload noplaybackrate" data-uid="audio" style="width: 100%; min-width: 128px; display: none;" audio-player-plain></audio>`;
               break;
            default:
               throw new Error("loadOrderItems(): no supported media type");
         }

         Utils._createElement("div", options);
      });

      QuestionTypeEvents.orderItems.init(container);
   }

   /**
    * Load open answer question
    * @param {Object} data - Question data
    */
   static openAnswer(data) {
      const container = QuestionTypeHelpers.createContainer(data);
      const responses = QuestionTypeHelpers.extractKeys("answer", data);

      const textareaOptions = {
         classes: ["open-answers-item"],
         attributes: {
            autocomplete: "off",
            rows: "1",
            wrap: "soft",
         },
      };

      responses.forEach((response, index) => {
         // Create subcontainer
         const subcontainer = Utils._createElement("div", {
            classes: ["open-answers-subcontainer", "flex-row", "gap-1"],
            id: `open-answers-subcontainer-${String(index).padStart(2, "0")}`,
            parent: container,
         });

         // Add prepend content (text, picture, or audio)
         const mediaType = QuestionTypeHelpers.getMediaType(response, ["text", "picture", "audio"]);
         const prependOptions = {
            classes: ["open-answers-prepend"],
            parent: subcontainer,
         };

         switch (mediaType.type) {
            case "text":
               prependOptions.textContent = response.text;
               break;
            case "picture":
               prependOptions.innerHTML = `<img src="${response.picture}" />`;
               break;
            case "audio":
               prependOptions.innerHTML = `<audio controls controlslist="nodownload noplaybackrate" data-uid="audio" style="width: 100%; min-width: 128px; display: none;" audio-player-plain></audio>`;
               break;
            default:
               throw new Error("loadOpenAnswer(): no supported media type");
         }

         Utils._createElement("div", prependOptions);

         // Add textarea
         textareaOptions.id = `open-answers-item-${String(index).padStart(2, "0")}`;
         textareaOptions.attributes["data-akey"] = response.answers;
         textareaOptions.parent = subcontainer;
         Utils._createElement("textarea", textareaOptions);
      });

      // Unify the prepend widths for visual consistency
      QuestionTypeHelpers.unifyWidths(".open-answers-prepend");
   }
}
