round = 42;

// Users class

var gameData = [{
    id: 0,
    title: 'Car AAAA',
    props: [{
       id: 0,
       name: 'Max. speed',
       value: 250,
       unit: 'km/h',
       comparison: 'high'
    },{
       id: 1,
       name: 'Acceleration',
       value: 4.5,
       unit: 'seconds',
       comparison: 'low'
   }, {
       id: 2,
       name: 'Horsepower',
       value: 340,
       unit: 'PS',
       comparison: 'high'
   }, {
       id: 3,
       name: 'Price',
       value: 120000,
       unit: '€',
       comparison: 'high'
   }]
}, {
    id: 1,
    title: 'Car BBBB',
    props: [{
       id: 0,
       name: 'Max. speed',
       value: 275,
       unit: 'km/h',
       comparison: 'high'
    },{
       id: 1,
       name: 'Acceleration',
       value: 5.2,
       unit: 'seconds',
       comparison: 'low'
   }, {
       id: 2,
       name: 'Horsepower',
       value: 180,
       unit: 'PS',
       comparison: 'high'
   }, {
       id: 3,
       name: 'Price',
       value: 200000,
       unit: '€',
       comparison: 'high'
   }]
}];

function getRandomDataset() {
    var r = Math.floor(Math.random() * gameData.length);
    return gameData[r];
}

function getDataset(id) {
    return gameData[id];
}

var User = function(options) {
    
    var name        = options.name;
    var id          = options.id;
    var sessionId   = options.sessionId;
    var socket      = options.socket;
    var state       = options.state;
    var dataset     = -1;
    
    // get username of user
    this.getUsername = function() {
        return name;
    };
    
    // get socket.io client ID
    this.getId = function() {
        return id;
    };
    
    this.getSessionId = function() {
        return sessionId;
    };

    this.getSocket = function() {
        return socket;
    };

    this.getState = function() {
        return state;
    };
    
    this.setState = function(newState) {
        state = newState;
    };
    
    this.getDataset = function() {
        return dataset;
    };
    
    this.setDataset = function(datasetId) {
        dataset = datasetId;
    };
}

var UserStorage = function () {
    var users = [];
    
    // remove specific user from storage
    this.removeUser = function(userId) {
        var user = this.getUserById(userId);
        users.splice(users.indexOf(user), 1);
    };
    
    // add new user
    this.addUser = function(userObject) {
        users.push(userObject);
    }
    
    // get user by id
    this.getUserById = function(userId) {
        for (var i = 0; i < users.length; i++) {
            if (users[i].getId() == userId) {
                return users[i];
            }
        };
        return null;
    }

    // print info about all users
    this.printUsers = function() {
    
        console.log('--------------------------------');
        console.log('ID\t\t\tName');
    
        for (var i = 0; i < users.length; i++) {
            console.log(users[i].getId() + '\t' + users[i].getUsername() + '\t');
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
                name : users[i].getUsername(),
                state: users[i].getState(),
                sessionId: users[i].getSessionId()
            });
        }
        return list;
    }

};

/************************************************************************************/

 var Round = function() {
        
        var activePlayer = {};
        var waitingPlayer = {};
        var players = [];
        var active = false;
        
        this.addPlayers = function(playersArray) {
            players = playersArray;
            
            //default
            activePlayer = players[0];
            waitingPlayer = players[1];
            
        };
        
        this.getActivePlayer = function() {
            return activePlayer;
        };
        
        this.getWaitingPlayer = function() {
            return waitingPlayer;
        };
        
        this.swapPlayers = function() {
            var temp = waitingPlayer;
            waitingPlayer = activePlayer;
            activePlayer = temp;
        };
         
        this.isActive = function() {
            return active;
        };               

        // start new round
        this.start = function() {
            
            activePlayerSocket = activePlayer.getSocket();
            waitingPlayerSocket = waitingPlayer.getSocket();
            
            activePlayer.setState('playing');
            activePlayerSocket.emit('news', "It's your turn, " + activePlayer.getUsername() + '!');
            activePlayerSocket.emit('instruction', "Choose your most competitive spec!");
            
            waitingPlayer.setState('waiting');
            waitingPlayerSocket.emit('news', "Please wait, " + waitingPlayer.getUsername() + '!');
            waitingPlayerSocket.emit('instruction', "Please wait for " + activePlayer.getUsername() + '!');
            
            io.sockets.emit('playerListUpdate', userStorage.getPlayerList());

            //var dataset = getRandomDataset();
            var dataset = gameData[0];
            activePlayerSocket.emit('newDataset', dataset);
            activePlayer.setDataset(dataset.id);
            
            //dataset = getRandomDataset();
            dataset = gameData[1];
            waitingPlayerSocket.emit('newDataset', dataset);
            waitingPlayer.setDataset(dataset.id);
            
            active = true;
        };
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
var round = new Round();


io.sockets.on('connection', function(client) {

  client.on('disconnect', function() {
      if (userStorage.getUserById(client.id) !== null) {
        var username = userStorage.getUserById(client.id).getUsername();
        userStorage.removeUser(client.id);
        
        io.sockets.emit('news', username + ' has left the game.');
        io.sockets.emit('playerListUpdate', userStorage.getPlayerList());
      };
  });

    client.emit('news', {
        'userCount': userStorage.count()
    });
    
    client.emit('playerListUpdate', 
        userStorage.getPlayerList()
    );

    client.on('playerJoin', function(data) {
        
        var MAX_PLAYERS = 2;
        
        if (userStorage.count() < MAX_PLAYERS) {

            var user = new User({
                name : data.username,
                id : client.id,
                sessionId : Math.random().toString(36).slice(2),
                socket: client,
                state: 'idle',
                dataset: -1
            });

            userStorage.addUser(user);
    
            io.sockets.emit('news', data.username + ' has joined. Waiting for ' + Number(MAX_PLAYERS - userStorage.count())  + ' player(s)');
            client.emit('sessionId', user.sessionId);
            io.sockets.emit('playerListUpdate', userStorage.getPlayerList());
            
            if (userStorage.count() === MAX_PLAYERS) {
                startGame(round);
            };
            
        } else {
            io.sockets.emit('news', 'Sorry, ' + data.username + '! We are full.');
        };
    });
    
    client.on('playerAction', function(data) {
        
        if (true === round.isActive()) {

            var username = userStorage.getUserById(client.id).getUsername();
            
            var activePlayer = round.getActivePlayer();
            var waitingPlayer = round.getWaitingPlayer();
            
            if (client.id === activePlayer.getId()) {
                
                var apDataset = getDataset(activePlayer.getDataset());
                var wpDataset = getDataset(waitingPlayer.getDataset());
                
                var apProp = apDataset.props[data.propId];
                var wpProp = wpDataset.props[data.propId];
                
                
                console.log(apProp.value + ' vs. ' + wpProp.value);
                
                var apIsWinner = false;
                
                if(apProp.comparison === 'low') {
                    apIsWinner = (apProp.value < wpProp.value);
                } else if (apProp.comparison === 'high')
                    apIsWinner = (apProp.value > wpProp.value);
                };
                
                if (apIsWinner) {
                    io.sockets.emit('news', activePlayer.getUsername() + ' wins!');
                } else {
                    io.sockets.emit('news', waitingPlayer.getUsername() + ' loses!');
                    round.swapPlayers();
                };

                round.start();
                
            } else {
                client.emit('news', 'Sorry, ' + username + '! It is not your turn');
            }
    });
    
    function startGame(round) {
        
        round.addPlayers(userStorage.getPlayers());
        round.start();
        
        io.sockets.emit('gameStarted');
    }
    
   
});


