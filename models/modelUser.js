const { getDb } = require('../config/dbConnection');

class User {
  constructor(name, email,mobile,password,role) {
    this.name = name;
    this.email = email;
    this.password = password;
    this.mobile = mobile;
    this.role = role || 'User';
  
  }

  // Save the user to the database
  async save() {
    try {
      const db = getDb();
      const result = await db.collection('users').insertOne(this);
      return result.insertedId;
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  }
}

module.exports = User;
