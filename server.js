round = 42;

// Users class

var gameData = [];

function getRandomDataset() {
    var r = getRandomInt(0, gameData.length - 1);
    return r;
}

function generateRandomDatasets(count) {

    var tmp = {};
    
    for (var i = 0; i < count; i++) {
        tmp = {
            id: i,
            title: 'Some Car',
            props: [{
               id: 0,
               name: 'Max. speed',
               value: getRandomInt(80, 400),
               unit: 'km/h',
               comparison: 'high'
            },{
               id: 1,
               name: 'Acceleration',
               value: getRandomFloat(3, 15),
               unit: 'seconds',
               comparison: 'low'
           }, {
               id: 2,
               name: 'Horsepower',
               value: getRandomInt(75, 500),
               unit: 'PS',
               comparison: 'high'
           }, {
               id: 3,
               name: 'Price',
               value: getRandomInt(15000, 200000),
               unit: '€',
               comparison: 'high'
           }]
       }
       gameData.push(tmp);
   };
};

function getDataset(id) {
    return gameData[id];
}

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat (min, max) {
    return (Math.random() * (max - min) + min).toFixed(1); ;
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
            
            activePlayer.getSocket().emit('stateChanged', 'active');
            waitingPlayer.getSocket().emit('stateChanged', 'waiting');
        };
         
        this.isActive = function() {
            return active;
        };
        
        this.setInactive = function() {
            active = false;
        };   

        // start new round
        this.start = function() {
 
            activePlayerSocket = activePlayer.getSocket();
            waitingPlayerSocket = waitingPlayer.getSocket();
            
            activePlayer.setState('playing');
            activePlayerSocket.emit('news', "It's your turn, " + activePlayer.getUsername() + '!');
            activePlayerSocket.emit('instruction', "Choose your most competitive spec!");
            activePlayerSocket.emit('stateChanged', 'active');
            
            waitingPlayer.setState('waiting');
            waitingPlayerSocket.emit('news', "Please wait, " + waitingPlayer.getUsername() + '!');
            waitingPlayerSocket.emit('instruction', "Please wait for " + activePlayer.getUsername() + '!');
            waitingPlayerSocket.emit('stateChanged', 'waiting');
            
            io.sockets.emit('playerListUpdate', userStorage.getPlayerList());

            
            var dataset = getRandomDataset();
            activePlayer.setDataset(dataset);
            activePlayerSocket.emit('newDataset', getDataset(dataset));

            var dataset2 = getRandomDataset()
            waitingPlayer.setDataset(dataset2);
            waitingPlayerSocket.emit('newDataset', getDataset(dataset2));
            
            console.log('initAp: ' + getDataset(dataset).props[0].value);
            console.log('initWp: ' + getDataset(dataset2).props[0].value);

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
            client.emit('sessionId', user.getSessionId());
            io.sockets.emit('playerListUpdate', userStorage.getPlayerList());
            
            if (userStorage.count() === MAX_PLAYERS) {
                startGame(round);
            };
            
        } else {
            io.sockets.emit('news', 'Sorry, ' + data.username + '! We are full.');
        };
    });
    
    client.on('playerAction', function(data) {
        
        news(userStorage.getUserById(client.id).getUsername() + ' clicked.');
            
        
        if (true === round.isActive()) {
            
            var username = userStorage.getUserById(client.id).getUsername();
            
            var activePlayer = round.getActivePlayer();
            var waitingPlayer = round.getWaitingPlayer();
            
            if (client.id === activePlayer.getId()) {
                
                round.setInactive();
                
                var apDataset = getDataset(activePlayer.getDataset());
                var wpDataset = getDataset(waitingPlayer.getDataset());
                
                var apProp = apDataset.props[data.propId];
                var wpProp = wpDataset.props[data.propId];
                
                
                console.log(apProp.value + ' vs. ' + wpProp.value);
                
                var apIsWinner = false;
                
                console.log('++++++' + apProp.comparison);
                
                if(apProp.comparison === 'low') {
                    apIsWinner = (Number(apProp.value) < Number(wpProp.value));
                } else if (apProp.comparison === 'high')  {
                    apIsWinner = (Number(apProp.value) > Number(wpProp.value));
                };
                
                //reveal opponents' cards
                activePlayer.getSocket().emit('revealOpponent', wpDataset);
                waitingPlayer.getSocket().emit('revealOpponent', apDataset);
                
                console.log('wpprop: ' + wpProp.value);
                console.log('approp: ' + apProp.value);
                
                if (apIsWinner) {
                    io.sockets.emit('news', activePlayer.getUsername() + ' wins against ' + waitingPlayer.getUsername());
                    activePlayer.getSocket().emit('win', data.propId);
                    waitingPlayer.getSocket().emit('lose', data.propId);
                } else {
                    io.sockets.emit('news', activePlayer.getUsername() + ' loses against ' + waitingPlayer.getUsername());
                    activePlayer.getSocket().emit('lose', data.propId);
                    waitingPlayer.getSocket().emit('win', data.propId);
                };
                
                setTimeout(function() {
                    round.swapPlayers();
                    round.start();
                }, 3000)

             }  else {
                client.emit('news', 'Sorry, ' + username + '! It is not your turn');
            }
            }
    });
    
    function startGame(round) {
        
        generateRandomDatasets(1000);
        
        round.addPlayers(userStorage.getPlayers());
        round.start();
        
        io.sockets.emit('gameStarted');
    }
    
    function news(msg) {
        io.sockets.emit('news', msg);
    }
    
   
});


