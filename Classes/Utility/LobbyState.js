module.exports = class LobbyState {
    constructor(){
        //predefined States
        this.GAME = 'Game';
        this.LOBBY = 'Lobby';
        this.ENDGAME = 'EndGame';

        //Current game state
        this.currentState = this.LOBBY;
    }
}