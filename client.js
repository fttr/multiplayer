var socket = io.connect('http://localhost');

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

// Connection with server disconnected
socket.on('disconnect', function() {
    log("Disconnected from Server");
    log("Hit Ctrl+F5 to start a new game");
});

// Connection with server was reconnected
socket.on('reconnect', function() {
    log("Reconnected to Server");
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

    for (key in data) {
        
        entry = '<li>' 
        + data[key].name 
        + ' (' 
        + data[key].state
        + ')';

        entry += '</li>';
        
        var $entry = $(entry);
        
        if (data[key].you) {
            $(entry).addClass('you');
        };

        $list.append($entry);
    }
}); 

// Game has been started
socket.on('gameStarted', function(data) {
    log('GAME STARTED!');
    $('#playfield').css('opacity', '1');
    $('#playfield').fadeIn();
}); 


// Displays messages from the server in log (select box)
function log(txt) {
  $('#log ul').append('<li>'+ txt + '</li>');
}

function insertRandomName() {
  var names = ['Hans', 'Horst', 'Peter', 'Frank', 'Helmut', 'Fritz','Joe', 'John', 'Bill', 'Steve'];
  var name = names[Math.floor(Math.random()*names.length)];

  $('#player-name').val(name + (Math.floor(Math.random()*10000)));
}

$(document).ready(function() {
    
    insertRandomName();
    
    $('.action-button').on('click', function() {

        socket.emit('playerAction', {
            'id':  $(this).data('id')
        });
    });

    $('#player-signup').on('submit', function(event) {
        event.preventDefault();
        var frm = $('#player-signup');
        socket.emit('playerJoin', frm.serializeObject());
        $(this).fadeOut();
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





