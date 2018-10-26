const fs = require('fs');
const path = require('path');

const USER_MIYUKKI = 'U8GRR2QLR';

const saiki = (filepath, callback) => {
  fs.readdir(filepath, (err, files) => {
    if (err) throw err;

    files.forEach(file => {
      if (file == '.DS_Store') {
        return;
      }

      const filepathFull = path.join(filepath, file);
      if (fs.statSync(filepathFull).isDirectory()) {
        saiki(filepathFull, callback);
      } else {
        callback(filepathFull);
      }
    });
  });
};

saiki('./sample', file => {
  console.log(file);
  const obj = JSON.parse(fs.readFileSync(file, 'utf8'));
  obj.forEach(message => {
    if (message.user == USER_MIYUKKI) {
      fs.appendFileSync('out.txt', message.text + '\n');
    }
  });
});
