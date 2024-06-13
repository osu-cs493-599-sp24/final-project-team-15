const bcrypt = require('bcryptjs');

const password = 'hunter2';
const saltRounds = 12;

bcrypt.hash(password, saltRounds, function(err, hash) {
  if (err) {
    console.error(err);
  } else {
    console.log(hash);
  }
});
