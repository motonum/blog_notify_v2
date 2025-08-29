const fs = require("fs");
const main = fs.readFileSync("main.js", "utf-8");

const placeHolders = main.match(/(?<=\{\{)[A-Z_]+(?=\}\})/g);

const replacePlaceHolders = (str, keys) => {
  if (keys.length === 0) {
    return str;
  }
  const newStr = str.replace(`{{${keys[0]}}}`, process.env[keys[0]]);
  return replacePlaceHolders(newStr, keys.slice(1));
};

const dist = replacePlaceHolders(main, placeHolders);

fs.writeFileSync("dist.js", dist);
