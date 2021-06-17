const fs = require("fs");
const path = require("path");
const axios = require("axios");
const plantUmlEncoder = require("./plantuml-encoder/encoder");
const { OUTPUT_FILES } = require("./constants");

const {
  FILE_NAME, // The name of the file in diagrams-in
  USE_LOCAL_SERVER = false, // Use local docker server. See # Using Local Server section of README.md
  LOCAL_SERVER_PORT = "8792", // Local docker server port
  REMOTE_PUML_SERVER = "http://www.plantuml.com/plantuml", // Server used for rendering embeded Markdown images
  OUTPUT_OVERRIDE, // Output file path override
  SCRIPT_PATH,
  ROOT = process.cwd(),
} = process.env;
let {
  OUTPUT_FILE_TYPE = "svg", // Output file for export. Can be png, svg, or txt for ASCII diagram.
} = process.env;

// FILE_NAME must be path to .puml (plantUML) file
if (!FILE_NAME) {
  console.error(
    "Env var: FILE_NAME pointing to diagram in diagrams-in directory required as arg."
  );
  process.exit(1);
}

let isMarkdown = OUTPUT_FILE_TYPE.toLowerCase() === "md";

// Get paths for uml diagram input (.puml) and image output (.svg, .png, .txt, .md)
let inputPath = FILE_NAME;
let outputPath = FILE_NAME;
const splitInput = FILE_NAME.split(".");
// Add extension to input if not passed, remove extension for output if passed
if (!splitInput[splitInput.length - 1].includes("puml")) {
  inputPath += ".puml";
} else {
  outputPath = outputPath.substring(0, outputPath.lastIndexOf("."));
}
// Output path can be overridden, and if it is and doesn't have an accurate extension, add one
let plantImgPath = path.join(
  SCRIPT_PATH,
  `${outputPath}.${OUTPUT_FILE_TYPE.toLowerCase()}`
);
if (OUTPUT_OVERRIDE !== "undefined") {
  plantImgPath = OUTPUT_OVERRIDE;
  const splitOutput = plantImgPath.split(".");
  const outputExtension = splitOutput[splitOutput.length - 1].toLowerCase();
  if (!OUTPUT_FILES.includes(outputExtension)) {
    plantImgPath += `.${OUTPUT_FILE_TYPE.toLowerCase()}`;
    // When override has a valid extension that doesn't match passed output filetype, change output filetype to match that extension with a warning
  } else if (OUTPUT_FILE_TYPE !== outputExtension) {
    console.warn(
      `Output file type is ${OUTPUT_FILE_TYPE}, but changing to ${outputExtension} to match -o output override option.`
    );
    OUTPUT_FILE_TYPE = outputExtension;
    isMarkdown = OUTPUT_FILE_TYPE.toLowerCase() === "md";
  }
}

// Output file used if generating a PlantUML image
if (
  typeof OUTPUT_FILE_TYPE !== "undefined" &&
  !OUTPUT_FILES.includes(OUTPUT_FILE_TYPE.toLowerCase())
) {
  console.error(
    `Invalid OUTPUT_FILE, "${OUTPUT_FILE_TYPE}". Must be one of: ${OUTPUT_FILES}`
  );
  process.exit(1);
}

// PlantUML Server for rending encoded plantUML. Defaults to official server
let plantUmlServer = REMOTE_PUML_SERVER;
if (USE_LOCAL_SERVER === "true") {
  if (isMarkdown) {
    console.log("Using local server for Markdown export is not supported.");
    process.exit(1);
  }
  plantUmlServer = `http://localhost:${LOCAL_SERVER_PORT}`;
}

// Verify that input exists before preceding.
let plantUmlPath = inputPath;
if (!path.isAbsolute(inputPath)) {
  plantUmlPath = path.join(SCRIPT_PATH, inputPath);
}
if (!fs.existsSync(plantUmlPath)) {
  console.error(`PlantUML file ${plantUmlPath} not found.`);
  process.exit(1);
}

function encodedDiagram() {
  // Read PlantUML diagram file into string
  let diagramString;
  try {
    diagramString = fs.readFileSync(plantUmlPath).toString();
  } catch (error) {
    console.error(`Error reading ${plantUmlPath} diagram. Exiting...`);
    console.error(error);
    process.exit(1);
  }
  return plantUmlEncoder(diagramString, path.dirname(plantUmlPath), ROOT);
}

function getImageUrl() {
  return `${plantUmlServer}/${OUTPUT_FILE_TYPE}/${encodedDiagram()}`;
}

function buildHtmlPage() {
  return `
    <!DOCTYPE html>
    <head></head>
    <body>
      <img src="${getImageUrl()}" />
      <script>
        document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] +
        ':35729/livereload.js?snipver=1"></' + 'script>')
      </script>
    </body>
    </html>
  `;
}

async function exportImage() {
  const writer = fs.createWriteStream(plantImgPath);
  // Write an embeded Markdown image to Markdown file.
  if (OUTPUT_FILE_TYPE.toLowerCase() == "md") {
    OUTPUT_FILE_TYPE = "svg";
    writer.write(`![${FILE_NAME} Diagram](${getImageUrl()})`, "utf8");
    writer.end();
    // Write an image file
  } else {
    const response = await axios({
      method: "GET",
      url: getImageUrl(),
      responseType: "stream",
    });
    response.data.pipe(writer);
  }
  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

module.exports = {
  buildHtmlPage,
  exportImage,
  plantUmlPath,
  plantImgPath,
};
