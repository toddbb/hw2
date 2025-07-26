import { Get } from "./api.mjs";
import { Config } from "./config.mjs";
import * as Utils from "./utils.mjs";

export const Media = {
   async loadResources(resources, folder, type = "blob") {
      try {
         let resourcesList = [];

         for (const resource of resources) {
            const blob = await Get(`${Config.API_URL}/content/${folder}/${resource}`, { responseType: type, ignore404: true });
            resourcesList.push({
               blob: blob,
               name: resource,
            });
         }

         return resourcesList;
      } catch (error) {
         console.error(`Homework.loadResources() Error: ${error}`);
         return [];
      }
   },

   async createElement(blob, options) {
      let elementType;

      // convert pdf to image, if declared in options
      if (blob.type === "application/pdf" && options.convertPDFtoImg) {
         blob = await this.convertPDFtoImage(blob);
      }

      const url = URL.createObjectURL(blob);
      let elementOptions = {
         classes: ["media-element"],
         attributes: {
            src: url,
         },
      };

      if (blob.type === "application/pdf") {
         // Embed the PDF
         elementType = "iframe";
         elementOptions.attributes.src = `${url}#toolbar=0&navpanes=0&scrollbar=0`;
         elementOptions.attributes.frameborder = "0";
      } else if (blob.type.startsWith("image/")) {
         // Display image
         elementType = "img";
         elementOptions.attributes.alt = "Image preview";
      } else if (blob.type.startsWith("audio/")) {
         // Play audio
         elementType = "audio";
      } else {
         // Fallback to text with warning
         elementType = "div";
         elementOptions.textContent = "Unsupported media format";
      }

      elementOptions.classes.push(`media-type-${elementType}`);
      return Utils._createElement(elementType, elementOptions);
   },

   async convertPDFtoImage(blob, maxWidth = 600) {
      // Load PDF.js library if not already loaded
      if (typeof pdfjsLib === "undefined") {
         throw new Error('PDF.js library is not loaded. Please include it in your HTML: <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>');
      }

      // Set the worker source to avoid deprecated API warning
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
         pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }

      try {
         // Convert blob to array buffer
         const arrayBuffer = await blob.arrayBuffer();

         // Load the PDF document
         const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

         // Get the first page
         const page = await pdf.getPage(1);

         // Set up canvas for rendering
         const canvas = document.createElement("canvas");
         const context = canvas.getContext("2d");

         // Calculate scale for good quality (2 = 2x resolution)
         //const scale = 1;
         const baseViewport = page.getViewport({ scale: 1 }); // ADD THIS LINE
         const scale = baseViewport.width > maxWidth ? maxWidth / baseViewport.width : 1;
         const viewport = page.getViewport({ scale });

         // Set canvas dimensions
         canvas.width = viewport.width;
         canvas.height = viewport.height;

         // Render the page to canvas
         const renderContext = {
            canvasContext: context,
            viewport: viewport,
         };

         await page.render(renderContext).promise;

         // Convert canvas to PNG blob
         return new Promise((resolve, reject) => {
            canvas.toBlob((pngBlob) => {
               if (pngBlob) {
                  resolve(pngBlob);
               } else {
                  reject(new Error("Failed to convert canvas to PNG blob"));
               }
            }, "image/png");
         });
      } catch (error) {
         throw new Error(`PDF conversion failed: ${error.message}`);
      }
   },
};
