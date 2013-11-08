var socket = io.connect('http://localhost');
var sessionId = '';

// ================= Generic events  ==================

// Server sends message to log
socket.on('news', function(data) {
    
    if (typeof data == 'object') {
        for (key in data) {
            log('<b>' + key + '</b>: ' + data[key]);
        }
    } else {
        log(data);
    };
}); 

// Server is connected successfully
socket.on('connect', function() {
    log("Connected to Server");
});

// Server is connected successfully
socket.on('sessionId', function(data) {
    log(data);
    sessionId = data;
});
// Connection with server disconnected
socket.on('disconnect', function() {
    log("Disconnected from Server");
    $('body').css('background-color', '#e74c3c');
    //log("Hit Ctrl+F5 to start a new game");
});

// Connection with server was reconnected
socket.on('reconnect', function() {
    log("Reconnected to Server");
    
    window.location = window.location;
});

// Reconnection with server failed
socket.on('reconnect_failed', function() {
    message("Reconnect Failed");
});


// Player list gets updated
socket.on('playerListUpdate', function(data) {
    var $list = $('#player-list');
    $list.html('');
    
    var entry = '';
    var isMe = false;

    for (key in data) {
        
        isMe = false;
        
        entry = '<li';

        if (data[key].sessionId === sessionId) {
            isMe = true;
            entry += ' class="me"';
        };
        
        if (data[key].state === 'playing') {
            entry += ' class="pulse"';
        };
        entry += '>'
        
        + '<span class="glyphicon glyphicon-user"></span>' 
        + '<div class="player-list-name">' + data[key].name + '</div>' 
        + '<div class="player-list-state">' + data[key].state + '</div>' 

        entry += '</li>';
        
        var $entry = $(entry);
        if (isMe) {
            $list.prepend($entry);
        } else {
            $list.append($entry);
        };
    }
}); 

// Game has been started
socket.on('gameStarted', function(data) {
    log('GAME STARTED!');
    $('#playfield').css('opacity', '1');
    $('#playfield').fadeIn();
}); 

// Game has been started
socket.on('instruction', function(data) {
    var $instruction = $('#player-instruction');
    $instruction.hide();
    $instruction.text(data);
    $instruction.fadeIn();
});

function emitPlayerAction(data) {
    socket.emit('playerAction', data);
};

// Game has been started
socket.on('newDataset', function(data) {
    
    console.log(data);
    
    $('#dataset-title').text(data.title);
    $('#dataset-body').html('');
    
     var row = '';
     var prop = {};
     
    for (var i in data.props) {
        prop = data.props[i];
        row = '<tr '
        + 'data-id="' + prop.id + '">'
        + '<td>' + prop.name + '</td>'
        + '<td>' + prop.value + ' ' + prop.unit + '</td>'
        row += '</tr>';
        
        $('#dataset-body').append(row);
    };

    $('#dataset-body').data('id', data.id);
    
        $('#playfield tr').on('click', function() {
        emitPlayerAction({
            propId : $(this).data('id')
        });
    });
}); 

// Displays messages from the server in log (select box)
function log(txt) {
  $('#log ul').prepend('<li>'+ txt + '</li>');
  $('#log ul li').first().hide();
  
  $('#log ul li').first().fadeIn('fast');
}

function insertRandomName() {
  var names = ["Aaron", "Adam", "Alan", "Albert", "Alexander", "Alice", "Amanda", "Amber", "Amy", "Andrea", "Andrew", "Angela", "Ann", "Anna", "Anthony", "Arthur", "Ashley", "Austin", "Barbara", "Benjamin", "Betty", "Beverly", "Billy", "Bobby", "Brandon", "Brenda", "Brian", "Brittany", "Bruce", "Bryan", "Carl", "Carol", "Carolyn", "Catherine", "Charles", "Cheryl", "Christian", "Christina", "Christine", "Christopher", "Craig", "Crystal", "Cynthia", "Daniel", "Danielle", "David", "Deborah", "Debra", "Denise", "Dennis", "Diana", "Diane", "Donald", "Donna", "Doris", "Dorothy", "Douglas", "Dylan", "Edward", "Elizabeth", "Emily", "Emma", "Eric", "Ethan", "Eugene", "Evelyn", "Frances", "Frank", "Gary", "George", "Gerald", "Gloria", "Grace", "Gregory", "Hannah", "Harold", "Harry", "Heather", "Helen", "Henry", "Howard", "Jack", "Jacob", "Jacqueline", "James", "Jane", "Janet", "Janice", "Jason", "Jean", "Jeffrey", "Jennifer", "Jeremy", "Jerry", "Jesse", "Jessica", "Joan", "Joe", "John", "Johnny", "Jonathan", "Jordan", "Jose", "Joseph", "Joshua", "Joyce", "Juan", "Judith", "Judy", "Julia", "Julie", "Justin", "Karen", "Katherine", "Kathleen", "Kathryn", "Kathy", "Keith", "Kelly", "Kenneth", "Kevin", "Kimberly", "Kyle", "Larry", "Laura", "Lauren", "Lawrence", "Linda", "Lisa", "Lori", "Louis", "Madison", "Margaret", "Maria", "Marie", "Marilyn", "Mark", "Martha", "Mary", "Matthew", "Megan", "Melissa", "Michael", "Michelle", "Mildred", "Name", "Nancy", "Nathan", "Nicholas", "Nicole", "Number", "Number", "Olivia", "Pamela", "Patricia", "Patrick", "Paul", "Peter", "Philip", "Phillip", "Rachel", "Ralph", "Randy", "Rank", "Raymond", "Rebecca", "Richard", "Robert", "Roger", "Ronald", "Rose", "Roy", "Russell", "Ruth", "Ryan", "Samantha", "Samuel", "Sandra", "Sara", "Sarah", "Scott", "Sean", "Sharon", "Shirley", "Stephanie", "Stephen", "Steven", "Susan", "Tammy", "Teresa", "Terry", "Theresa", "Thomas", "Tiffany", "Timothy", "Tyler", "Victoria", "Vincent", "Virginia", "Walter", "Wayne", "William", "Willie", "Zachary"];
  var name = names[Math.floor(Math.random()*names.length)];

  $('#player-name').val(name + (Math.floor(Math.random()*10)));
}

$(document).ready(function() {
    
    insertRandomName();

    $('#player-signup').on('submit', function(event) {
        event.preventDefault();
        var frm = $('#player-signup');
        socket.emit('playerJoin', frm.serializeObject());
        
        $(this).fadeOut();
        
        $('#player-header').removeClass('hidden')
        
        $('#player-header-name').text(
            $('#player-name').val()
        );
        
    });
});


/***** tools ***********/

$.fn.serializeObject = function()
{
   var o = {};
   var a = this.serializeArray();
   $.each(a, function() {
       if (o[this.name]) {
           if (!o[this.name].push) {
               o[this.name] = [o[this.name]];
           }
           o[this.name].push(this.value || '');
       } else {
           o[this.name] = this.value || '';
       }
   });
   return o;
};





