var eve = require('evejs'),
	HelloAgent = require("./models/HelloAgentModel");

eve.system.init({
  transports: [
    {
      type: 'ws',
      url: 'ws://localhost:3000/agents/:id',
      localShortcut : false
    }
  ]
});


var agent1 = new HelloAgent('agentSERVER');
