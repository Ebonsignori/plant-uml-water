const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const encode64 = require("./encode64");

let includes = 0;
const includeLimit = 100;

function readFile(filename, currentPath, root) {
  let filePath = filename;
  if (!path.isAbsolute(filename)) {
    // try relative to file
    filePath = path.join(currentPath || process.cwd(), filename);

    if (!fs.existsSync(filePath)) {
      // try relative to root
      filePath = path.join(root, filename);

      if (!fs.existsSync(filePath)) {
        throw Error(
          `File included in .puml, ${filename}, could not be found in ${currentPath} or ${root} does not exist. Variable names in path not supported.`
        );
      }
    }
  }

  // Resolve any nested includes
  const includedPuml = fs.readFileSync(filePath).toString();
  return resolveIncludes(includedPuml, path.dirname(filePath), root);
}

// Import any include statements inline before encoding
function resolveIncludes(puml, currentPath, root) {
  includes++;
  if (includes > includeLimit) {
    console.error(
      "More than ${nestedLimit} includes found in puml. Not supported, though you can navigate to this code and hardcode to increase the limit."
    );
    process.exit(1);
  }
  const splitLines = puml.split(/\r?\n/);
  for (let i = 0; i < splitLines.length; i++) {
    const line = splitLines[i].replace(/^\s+/g, "");
    if (line.startsWith("!include ")) {
      const filePath = line
        .substring(line.indexOf("!include ") + 9, line.length)
        .trim();
      // If filepath is in shape <foo/bar>, then it is a std library and should not be read from filesystem
      if (filePath.startsWith("<") && filePath.endsWith(">")) {
        continue;
      }
      try {
        const includeString = readFile(filePath, currentPath, root);
        splitLines[i] = includeString;
      } catch (error) {
        console.warn(error.message);
      }
    }
  }
  return splitLines.join("\n");
}

function deflate(data) {
  return zlib.deflateRawSync(data, { level: 9 }).toString("binary");
}

module.exports = (puml, basepath, root) => {
  includes = 0;
  const includeInlined = resolveIncludes(puml, basepath, root);
  const deflated = deflate(includeInlined);
  return encode64(deflated);
};
