
// Users class

var UserStorage = function () {
    var users = [];
    
    // add new user
    this.addUser = function(userObject) {
        users.push(userObject);
    }
    
    // get user by id
    this.getUserById = function(userId) {
        for (var i = 0; i < users.length; i++) {
            if (users[i].id == userId) {
                return users[i];
            }
        };
        return null;
    }
    
    // remove specific user from storage
    this.removeUser = function(userId) {
        var user = this.getUserById(userId);
        users.splice(users.indexOf(user), 1);
    };
    
    // get username of specific user from storage
    this.getUserName = function(userId) {
        var user = this.getUserById(userId);
        return user.name;
    };
    
    // assign name to specific user
    this.setUserName = function(userId, name) {
        var user = this.getUserById(userId);
        user.name = name;
    };
    
    // increase number of attempts
    this.increaseAttempts = function(userId) {
        var user = this.getUserById(userId);
        user.attempts++;
    };
    
    // return number of attempts
    this.getAttempts = function(userId) {
        var user = this.getUserById(userId);
        return user.attempts;
    };
    
    // print info about all users
    this.printUsers = function() {
    
        console.log('--------------------------------');
        console.log('ID\t\t\tName');
    
        for (var i = 0; i < users.length; i++) {
            console.log(users[i].id + '\t' + users[i].name + '\t');
        }
        console.log('--------------------------------');
    };
    
    // count players
    this.count = function() {
        return users.length;
    };        
    
     // get players
    this.getPlayers = function() {
        return users;
    };    
    
    // get player list
    this.getPlayerList = function(client) {
        var list = [];
        for (var i = 0; i < users.length; i++) {
            list.push({
                name : users[i].name,
                state: users[i].state,
                you:   users[i].id === client.id
            });
        }
        return list;
    }

};

/************************************************************************************/

var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

server.listen(80);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/counter.html');
});

app.get('/client.js', function (req, res) {
  res.sendfile(__dirname + '/client.js');
});

app.get('/style.css', function (req, res) {
  res.sendfile(__dirname + '/style.css');
});


var userStorage = new UserStorage();

io.sockets.on('connection', function(client) {
    
  client.on('disconnect', function() {
      if (userStorage.getUserById(client.id) !== null) {
        var username = userStorage.getUserName(client.id);
        userStorage.removeUser(client.id);
        
        io.sockets.emit('news', username + ' has left the game.');
        io.sockets.emit('playerListUpdate', userStorage.getPlayerList(client));
      };
  });

    client.emit('news', {
        'userCount': userStorage.count()
    });
    
    client.emit('playerListUpdate', userStorage.getPlayerList(client));


    client.on('playerJoin', function(data) {
        
        var MAX_PLAYERS = 2;
        
        if (userStorage.count() < MAX_PLAYERS) {

            var user = {
                name : data.username,
                id : client.id,
                socket: client,
                state: 'idle'
            };
            
            userStorage.addUser(user);
    
            io.sockets.emit('news', data.username + ' has joined. Waiting for ' + Number(MAX_PLAYERS - userStorage.count())  + ' player(s)');
            io.sockets.emit('playerListUpdate', userStorage.getPlayerList(client));
            
            if (userStorage.count() === MAX_PLAYERS) {
                startGame();
            };
            
        } else {
            io.sockets.emit('news', 'Sorry, ' + data.username + '! We are full.');
        };
    }); 
    
    function startGame() {
        var players = userStorage.getPlayers();
        
        var round = new Round(players);
        round.start();
        
        io.sockets.emit('gameStarted');
    }
    
    var Round = function(players) {
        
        var activePlayer = {};
        var waitingPlayer = {};
        
        client.on('playerAction', function(data) {
            
            var username = userStorage.getUserName(client.id);
            
            if (client.id === activePlayer.id) {
                io.sockets.emit('news', username + ' pressed button #' + data.id);
            } else {
                io.sockets.emit('news', 'Sorry, ' + username + '! It is not your turn');
            }
        });

        // start new round
        this.start = function() {
            activePlayer = players[0];
            waitingPlayer = players[1];
            
            activePlayer.state = 'playing';
            activePlayer.socket.emit('news', "It's your turn, " + activePlayer.name + '!');
            
            waitingPlayer.state = 'waiting';
            waitingPlayer.socket.emit('news', "Please wait, " + waitingPlayer.name + '!');
            
            client.emit('playerListUpdate', userStorage.getPlayerList(client));
        }
    };
    
});


