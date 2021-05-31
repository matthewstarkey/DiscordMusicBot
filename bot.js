const Discord = require('discord.js');
const client = new Discord.Client();
const request = require('request');
client.on('ready', () => { console.log("StarkBOT online!") });
//command prefix
let prefix = '!';

//DISCORD MUSIC BOT:
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');

//Spotify requests:
//EXCLUDED clientID and clientSecret to protect my bot's data
const { SpotifyParser } = require('spotilink');
const node = {
    host: 'localhost',
    port: 8080,
    password: 'password'
};

const spotilink = new SpotifyParser(node, clientID, clientSecret);

//used to keep track of songs, and whether bot is currently playing a song
let songQueue = [];
let currentlyPlaying = false;
let currentSong = "Nothing";
//IM OUT - plays link when bot leaves
const link = 'https://www.youtube.com/watch?v=8iUFEMEySNc';

client.on('message', async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) { return; }
    args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    //setup validating users input and location in discord
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) { return message.channel.send(message.author.username + ", you need to be in a voice channel") }
    const search = args.join(" ");
    const connection = await voiceChannel.join();
    
    if(command == 'prefix') {
        prefix = search;
        return;
    }
    if(command == 'help') {
        let help = '!ping - Dont dare ping me \n!play [SONG_NAME] - plays a track from youtube \n!playlist [PLAYLIST_LINK] - plays a spotify playlist\n';
        help += '!stop - stops me from playing music, empties the queue \n!skip - skips current track \n!shuffle - shuffles current queue \n!q / !queue - displays current queue \n';
        help += '!prefix [PREFIX] - sets prefix for commands, default is !';
        return message.channel.send(help);
    }
    
    //plays spotify playlist
    if(command == 'playlist') {
        let spotifyID = '';
        //gets spotify playlist ID
        if(search.startsWith('https://open.spotify')) {
            let searchSplit = search.split('/');
            spotifyID = searchSplit[4].split('?')[0];
        } else {
            return message.channel.send("Please enter a valid spotify playlist link");
        }
        //gets playlist array
        let playlist = await spotilink.getPlaylistTracks(spotifyID);
        //Queues songs from playlist
        message.channel.send('***Queueing Playlist***');
        for(let i = 0; i < playlist.length; i++) {
            //gathers tracks name and artists name
            let searchString = '' + playlist[i].name + ' ' + playlist[i].artists[0].name;
            let video = await videoFinder(searchString);
            if(video) {
                songQueue.push(video);
            }
        }
        playNextSong(connection,message,voiceChannel);
    }
    
    if (command == 'play') {
        if (!args.length) { return message.channel.send('type !play [NAME_OF_SONG]') }
        
        if(search.startsWith('https://open.spotify')) {
            let searchSplit = search.split('/');
            console.log(searchSplit);
            let spotifyID = searchSplit[4].split('?')[0];
            console.log(spotifyID);
            request(playlistURL + spotifyID)
            return; 
        }
        //pulls video from users arguments
        const video = await videoFinder(search);
        if (video) {
            songQueue.push(video);
            if(!currentlyPlaying) {
                let song = songQueue.shift();
                //converts video to audio and video stream
                currentSong = song.title + ' (' + song.duration.timestamp + ')';
                let stream = ytdl(song.url, { filter: 'audioonly'});
                connection.play(stream, {seek: 0, volume: 1})
                .on('finish', ()=>{
                    playNextSong(connection, message, voiceChannel);
                });
                currentlyPlaying = true;
                await message.channel.send('***Now Playing: ' +  currentSong + '***');
            } else {
                await message.channel.send('***Added ' + video.title + ' (' + video.duration.timestamp +') to queue***');
            }
        } else {
            message.channel.send("Failed to find: " + search);
        }
    }

    //leaves voice channel and empties songQueue
    if(command == 'stop') {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) { return message.channel.send(message.author.username + ", you need to be in a voice channel") }
        voiceChannel.leave();
        songQueue = [];
    }
    if(command == 'skip') {
        playNextSong(connection, message, voiceChannel);
    }
    if(command == 'setprefix') {
        prefix = search;
    }
    if(command == 'shuffle') {
        shuffleArray(songQueue, message);
    }
    if(command == 'queue' || command == 'q') {
        let songList = "";
        for(let i = 0; i < songQueue.length; i++) {
            songList += (i + ': ' + songQueue[i].title + '\n');
        }
        message.channel.send(songList);
    }
});

async function playNextSong(connection, message, voiceChannel) {
    if(songQueue.length > 0) {
        let video = songQueue.shift();
        let stream = ytdl(video.url, { filter: 'audioonly'});
        currentSong = video.title + ' (' + video.duration.timestamp + ')';
        connection.play(stream, {seek: 0, volume: 1})
        .on('finish', () => { //when song finishes playing
            playNextSong(connection, message, voiceChannel);
        });
        await message.channel.send('***Now Playing: ' + currentSong + '***');
    } else {
        //play f' this sh*t im out!
        let video = await ytSearch(link);
        let song = video.videos[0];
        let imOUT = ytdl(song.url, {filter: 'audioonly'});
        connection.play(imOUT, {seek: 0, volume: 1})
        .on('finish', () =>{
            voiceChannel.leave();
        });
        //leave voice channel
        currentlyPlaying = false;
        currentSong = "Nothing";
    }
}

function shuffleArray(array,message) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    message.channel.send('***Shuffled Queue***');
}

//searches youtube for video
        const videoFinder = async (query) => {
            const videoResult = await ytSearch(query);
            //returns top result. if no results return null
            return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
        }
