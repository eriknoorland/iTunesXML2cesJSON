'use strict';

const fs = require('fs');
const uuidV4 = require('uuid/v4');

const baseDir = __dirname;
const sourceDir = baseDir + '/xml';
const outputDir = baseDir + '/json';

if(!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, '0744');
}

/**
 * Writes a file to disk
 * @param {String} name
 * @param {String} content
 */
function saveToFile(name, content) {
  let file = `${outputDir}/${name}.json`;

  if(fs.existsSync(file)) {
    fs.unlinkSync(file);
  }

  fs.writeFileSync(file, content);
}

//scan source dir and convert found xml files
if(fs.existsSync(sourceDir)) {
  let files = fs.readdirSync(sourceDir);

  files.forEach(function(file) {
    let fileName = file.slice(0, -4);
    let filePath = `${sourceDir}/${file}`;
    let fileContent = fs.readFileSync(filePath, {encoding: 'utf8'});

    let playlist = {
      id: uuidV4(),
      name: fileName,
      songs: []
    };

    // find required fields with regex
    let regex = /<key>(Name|Artist|Album|Total Time|Location)<\/key><(string|integer)>(.+)<\/(string|integer)>/g;
    let match = regex.exec(fileContent);
    let song = {};
    let numFields = 5;
    let i = 0;

    // strip xml tags and create new song objects
    while (match !== null) {
      let key = match[1].toLowerCase().replace(' ', '_');
      let value = match[3];

      // clean-up location path
      if(key === 'location') {
        value = value.replace('file:///Volumes/music/iTunes/iTunes%20Music/', '');
        value = value.replace(/%20/g, ' ');
      }

      song[key] = value;

      // every `numFields` iterations because of the requested
      // song properties we have a new song
      if(++i % numFields === 0) {
        song.id = uuidV4();
        song.link = `/songs/${fileName}/${song.id}`;
        playlist.songs.push(song);
        song = {};
      }

      match = regex.exec(fileContent);
    }

    saveToFile(fileName, JSON.stringify(playlist));
  });
}
