db = db.getSiblingDB('admin');
db.auth('root', 'hunter2');

db = db.getSiblingDB('trauplin');
db.createUser({
    user: 'trauplin',
    pwd: 'hunter2',
    roles: [
      {
        role: 'readWrite',
        db: 'trauplin'
      }
    ]
});
  