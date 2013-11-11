var socket = io.connect('http://10.189.171.108');
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
        
        
        + '<div class="player-list-column">'
            + '<span class="glyphicon glyphicon-user"></span>' 
            + '<div class="player-list-name">' + data[key].name + '</div>' 
            + '<div class="player-list-state">' + data[key].state + '</div>'
        + '</div>'
        + '<div class="player-list-score player-list-column">' + data[key].score + '</div>';

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
    $('#playfield').slideDown();
}); 


// active/aiting state has changed
socket.on('stateChanged', function(state) {
   if (state == 'waiting') {
       enableWaitingUI();
   } else {
       disableWaitingUI();
   };
}); 


// Game has been started
socket.on('instruction', function(data) {
    var $instruction = $('#player-instruction');
    $instruction.hide();
    $instruction.text(data);
    $instruction.fadeIn();
});

socket.on('win', function(data) {
    $('.dataset tr[data-id="' + data.propId + '"]').addClass('highlight');
    $('#player-header-score').text(data.score);
    showPopup('win');    
});

socket.on('lose', function(propId) {
    $('.dataset tr[data-id="' + propId + '"]').addClass('highlight');
    showPopup('lose');
});

function showPopup(type) {
    
    var $popup = $('#popup');
    var $popupOverlay = $('#popup-overlay');
    
    if (type === 'win') {
        $popup.text('You win!');
        $popup.removeClass('lose');
        $popup.addClass('win');
    } else if (type === 'lose') {
        $popup.text('You lose!');
        $popup.removeClass('win');
        $popup.addClass('lose');
    };
    
    $popup.fadeIn('fast');
    $popupOverlay.fadeIn('fast');
    
    setTimeout(function() {
        $popup.fadeOut('fast');
        $popupOverlay.fadeOut('fast');
    } , 1000);
};
   
  
function emitPlayerAction(data) {
    socket.emit('playerAction', data);
};

// Game has been started
socket.on('newDataset', function(dataset) {
    renderDataset(dataset, 'mine');
    
    $('#dataset-opponent .dataset-secret').removeClass('hidden');
    $('#dataset-opponent table').addClass('hidden');
    
    $('#playfield #dataset-mine tr').on('click', function() {
        emitPlayerAction({
            propId : $(this).data('id')
        });
    });
}); 


// reveal opponent's card
socket.on('revealOpponent', function(dataset) {
    renderDataset(dataset, 'opponent');
    
    $('#dataset-opponent .dataset-secret').addClass('hidden');
    $('#dataset-opponent table').removeClass('hidden');
}); 

function renderDataset(data, origin) {
   var $target = $('#dataset-' + origin);
   
    $title = $target.find('.dataset-title');
    $body =  $target.find('.dataset-body');
    
    $title.text(data.title);
    $body.html('');
    
     var row = '';
     var prop = {};
     
    for (var i in data.props) {
        prop = data.props[i];
        
        if (prop.value > 999) {
            prop.value = addCommas(prop.value);
        };
        
        row = '<tr '
        + 'data-id="' + prop.id + '">'
        + '<td>' + prop.name + '</td>'
        + '<td>' + prop.value + ' ' + prop.unit + '</td>'
        row += '</tr>';
        
        $body.append(row);
    };

    $body.data('id', data.id);
}

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

function enableWaitingUI() {
    $('#playfield').addClass('waiting');
}

function disableWaitingUI() {
    $('#playfield').removeClass('waiting');
    
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

function addCommas(str) {
    var amount = new String(str);
    amount = amount.split("").reverse();

    var output = "";
    for ( var i = 0; i <= amount.length-1; i++ ){
        output = amount[i] + output;
        if ((i+1) % 3 == 0 && (amount.length-1) !== i)output = ',' + output;
    }
    return output;
}





