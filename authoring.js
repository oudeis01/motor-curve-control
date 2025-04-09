const fs = require('fs');
const path = require('path');

// Define your new author and maintainer
const NEW_AUTHOR = "Choi Haram <altitudinem@gmail.com>";
const NEW_MAINTAINER = NEW_AUTHOR;
const COPYRIGHT_YEAR = "2025";
const COPYRIGHT_HOLDER = "Choi Haram";
const NEW_COPYRIGHT = `Copyright © ${COPYRIGHT_YEAR} ${COPYRIGHT_HOLDER}`;

// Path to your package.json file
const packageJsonPath = path.join(__dirname, 'package.json');

// Read and parse package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Replace author
packageJson.author = NEW_AUTHOR;

// Replace maintainer in build.linux
if (packageJson.build && packageJson.build.linux) {
  packageJson.build.linux.maintainer = NEW_MAINTAINER;
}

packageJson.build.copyright = NEW_COPYRIGHT;

// Write back the modified package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');

console.log('Author and maintainer updated successfully.');
