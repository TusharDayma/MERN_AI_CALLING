import { createHRUser } from './src/modules/admin/admin.controller.js';

async function testController() {
  const req = {
    body: {
      name: 'hr',
      username: 'hr1',
      email: 'hr@test',
      password: 'password'
    }
  };

  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log("Status:", this.statusCode);
      console.log("JSON:", data);
    }
  };

  await createHRUser(req, res);
}

testController();
