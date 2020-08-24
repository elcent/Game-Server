let Connection = require('./Connection')
let Player = require('./Player')

let LobbyBase = require('./Lobbies/LobbyBase')
let GameLobby = require('./Lobbies/GameLobby')
let GameLobbySetting = require('./Lobbies/GameLobbySetting')


module.exports = class Server{
    constructor(){
        this.connections = [];
        this.lobbys = [];

        this.lobbys[0] = new LobbyBase(0);
    }

    //Interval update every 100 miliseconds 
    onUpdate(){
        let server = this;

        for(let id in server.lobbys){
            server.lobbys[id].onUpdate();
        }
    }

    //Handle a new connection to the server
    onConnected(socket){
        let server = this;
        let connection = new Connection();
        connection.socket = socket;
        connection.player = new Player();
        connection.server = server;

        let player = connection.player;
        let lobbys = server.lobbys;

        console.log('Added new player to the server (' + player.id + ')');
        server.connections[player.id] = connection;

        socket.join(player.lobby);
        connection.lobby = lobbys[player.lobby];
        connection.lobby.onEnterLobby(connection);

        return connection;
    }

    onDisconnected(connection = Connection){
        let server = this;
        let id = connection.player.id;

        delete server.connections[id];
        console.log('Player '+ connection.player.displayerPlayerInformation() + ' has disconnected');

        connection.socket.broadcast.to(connection.player.lobby).emit('disconnected', {
            id: id
        });

        server.lobbys[connection.player.lobby].onLeaveLobby(connection);
    }

    onAttemptToJoinGame(connection = Connection){
        let server = this;
        let lobbyFound = false;

        let gameLobbies = server.lobbys.filter(item => {
            return item instanceof GameLobby;
        });
        console.log('Found (' + gameLobbies.length + ') lobbies on the server');

        gameLobbies.forEach( lobby =>{
            if(!lobbyFound){
                let canJoin = lobby.canEnterLobby(connection);

                if(canJoin){
                    lobbyFound = true;
                    server.onSwitchLobby(connection, lobby.id);
                }
            }
        });

        //if no games or all full
        if(!lobbyFound){
            console.log('Making a new game lobby');
            let gameLobby = new GameLobby(gameLobbies.length + 1, new GameLobbySetting('FFA', 2));
            server.lobbys.push(gameLobby);
            server.onSwitchLobby(connection, gameLobby.id);
        }

    }

    onSwitchLobby(connection = Connection, lobbyID){
        let server = this;
        let lobbys = server.lobbys;
        console.log(lobbyID);
        connection.socket.join(lobbyID);
        connection.lobby = lobbys[lobbyID];

        this.lobbys[connection.player.lobby].onLeaveLobby(connection);
        lobbys[lobbyID].onEnterLobby(connection)
    }

}