var eve = require("evejs"),
    async = require('async');
/**
 * Custom agent prototype
 * @param {String} id
 * @constructor
 * @extend eve.Agent
 */
function HelloAgent(id) {
    // execute super constructor
    eve.Agent.call(this, id);

    // connect to all transports configured by the system
    this.connect(eve.system.transports.getAll());
}

// extend the eve.Agent prototype
HelloAgent.prototype = Object.create(eve.Agent.prototype);
HelloAgent.prototype.constructor = HelloAgent;

/**
 * Send a greeting to an agent
 * @param {String} to
 */
HelloAgent.prototype.sayHello = function(to) {
    this.send(to, 'Hello ' + to + '!').done();
};

HelloAgent.prototype.keepAliveInterval = 30;
HelloAgent.prototype.listOfConnectedAgents = {};
HelloAgent.prototype.privilegedAgents = { agentBROWSER: true } //list privileged agents
    /**
     * Handle incoming greetings. This overloads the default receive,
     * so we can't use HelloAgent.on(pattern, listener) anymore
     * @param {String} from     Id of the sender
     * @param {*} message       Received message, a JSON object (often a string)
     */


HelloAgent.prototype.receive = function(from, data) {
    if (!data.type) return;
    switch (data.type) {
        case "greeting": //function
            console.log("Agent " + from + " sent greeting.");
            if (this.listOfConnectedAgents[from]) {
                this.listOfConnectedAgents[from].lastSeen = Date.now();
            } else if (from.indexOf("agentMobile") !== -1) {
                this.listOfConnectedAgents[from] = { lastSeen: Date.now() };
            }
            //this.send(from, { message : 'Hi ' + from + ', nice to meet you!', type: "greeting" });
            //this.send(from, { "customFunction": "alert('hello from Node!');", type: "customFunction" });
            break;
        case "contacts_length":
            console.log("Agent " + from + " contact_length is " + data.message);
            break;
        case "contacts_list":
            if (!data.message) return;
            handleContactsList(data.message);
            this.listOfConnectedAgents[from].contacts = data.message;
            //TODO send to all privileged agents - for now only sending to first written - Browser
            this.send(Object.keys(this.privilegedAgents)[0], { lastSeen: this.listOfConnectedAgents[from].lastSeen, targetAgent: from, contacts: data.message, type: "agentContacts" });
            break;
        case "contacts_error":
            console.log("Error getting contacts from: " + from + " message: " + data.message);
            break;
        case "removeContactById":
            if (!this.checkPrivileges(from)) return;
            this.send(data.message.targetAgent, { contactId: data.message.contactId, type: "removeContactById" });
            break;
        case "editContactById":
            if (!this.checkPrivileges(from)) return;
            this.send(data.message.targetAgent, data);
            break;
        case "getAgents":
            //agentBROWSER
            //TODO check if it was from agentBROWSER and emit only to him
            if (!this.checkPrivileges(from)) return;
            this.send(from, { message: Object.keys(this.listOfConnectedAgents), type: "agentsList" });
            break;
        case "getAgentContacts":
            //if passed more then 30 sec say it's offline
            if (!this.checkPrivileges(from) || !data.message.targetAgent || !this.listOfConnectedAgents[data.message.targetAgent]) return;
            if (((Date.now() - this.listOfConnectedAgents[data.message.targetAgent].lastSeen) > (this.keepAliveInterval * 1000))) {
                console.log("Agent is considered offline");
                this.send(from, { lastSeen: this.listOfConnectedAgents[data.message.targetAgent].lastSeen, targetAgent: data.message.targetAgent, contacts: this.listOfConnectedAgents[data.message.targetAgent].contacts, type: "agentContacts" });
                return;
            }
            this.send(data.message.targetAgent, { message: "", type: "getContacts" });
            break;
        default:
            console.log("Unknown message type from: " + from + " said: " + data.message);
    }
};

HelloAgent.prototype.checkPrivileges = function(from) {
    if (!this.privilegedAgents[from]) {
        return false;
    }
    return true;
};

function handleContactsList(contacts) {
    console.log("HandleContactsList");
    return;
    for (var i = 0; i < contacts.length; i++) {
        var contact = contacts[i];
        console.log("Contact number " + i);
        //console.log("Contact information " + messageObject.contacts[i]);
        console.log("Display name : " + contact.displayName);
        if (contact.phoneNumbers) {
            for (var j = 0; j < contact.phoneNumbers.length; j++) {
                console.log("Numb: " + j);
                console.log("Type " + contact.phoneNumbers[j].type);
                console.log("Number (real) " + contact.phoneNumbers[j].value);
            }
        }
    }
};


module.exports = HelloAgent;
