const OPTION_DEV = "--dev";
const OPTION_PROD = "--prod";

const option = process.argv[2];

if (!option || [OPTION_DEV, OPTION_PROD].every((e) => e !== option)) {
  console.error(
    `Error: Please specify "--dev" or "--prod" as command line argument.`
  );
  process.exit(1);
}

const debugMode = option === OPTION_DEV;

const fs = require("fs");
const mainContent = fs
  .readFileSync("main.js", "utf-8")
  .replace(/"\{\{DEBUG_MODE\}\}"/g, `${debugMode}`);

try {
  const placeholders = [
    ...(new Set(mainContent.match(/(?<=\{\{)\w+(?=\}\})/g)) || []),
  ];

  const replacementParams = placeholders.map((key) => {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Environment variable "${key}" is not defined.`);
    }
    return [key, value];
  });

  const dist = replacementParams.reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`{{${key}}}`, "g"), value),
    mainContent
  );

  if (!fs.existsSync("gas")) {
    fs.mkdirSync("gas");
  }
  fs.writeFileSync("gas/main.js", dist);
  console.log("gas/main.js has been generated successfully.");
} catch (error) {
  console.error(`Failed to generate gas/main.js: ${error.message}`);
  process.exit(1);
}
