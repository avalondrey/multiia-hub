const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const app = express();
const PORT = 17321;
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', function(req, res) { res.sendFile(path.join(__dirname, 'dist', 'index.html')); });
app.listen(PORT, '127.0.0.1', function() {
  var url = 'http://localhost:' + PORT;
  console.log('\n MultiIA v7 pret ! → ' + url + '\n Laissez cette fenetre ouverte.\n');
  exec('start ' + url);
});
