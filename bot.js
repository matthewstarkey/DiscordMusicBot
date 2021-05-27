const Discord = require('discord.js');
const client = new Discord.Client();
client.on('ready', () => { console.log("I'm ready!") });
const prefix = '!';

//DISCORD MUSIC BOT:
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');

//used to keep track of songs, and whether bot is currently playing a song
let songQueue = [];
currentlyPlaying = false;
currentSong = "Nothing";

client.on('message', async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) { return; }
    args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    //setup validating users input and location in discord
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) { return message.channel.send(message.author.username + ", you need to be in a voice channel") }
    const search = args.join(" ");
    const connection = await voiceChannel.join();

    if (command == 'play') {
        if (!args.length) { return message.channel.send('type !play [NAME_OF_SONG]') }

        //searches youtube for video
        const videoFinder = async (query) => {
            const videoResult = await ytSearch(query);
            //returns top result. if no results return null
            return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
        }
        //pulls video from users arguments
        const video = await videoFinder(search);
        if (video) {
            songQueue.push(video);
            if(!currentlyPlaying) {
                let song = songQueue.shift();
                //converts video to audio and video stream
                currentSong = song.title + ' (' + song.duration.timestamp + ')';
                let stream = ytdl(song.url, { filter: 'audioandvideo'});
                connection.play(stream, {seek: 0, volume: 1})
                .on('finish', ()=>{
                    playNextSong(connection, message, voiceChannel);
                });
                currentlyPlaying = true;
                await message.channel.send('***Now Playing: ' +  currentSong + '***');
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
});

async function playNextSong(connection, message, voiceChannel) {
    if(songQueue.length > 0) {
        let video = songQueue.shift();
        let stream = ytdl(video.url, { filter: 'audioandvideo'});
        currentSong = video.title + ' (' + video.duration.timestamp + ')';
        connection.play(stream, {seek: 0, volume: 1})
        .on('finish', () => { //when song finishes playing
            playNextSong(connection, message);
        });
        await message.channel.send('***Now Playing: ' + currentSong + '***');
    } else {
        voiceChannel.leave();
        currentlyPlaying = false;
        currentSong = "Nothing";
    }
}

const noahReplies = ['Fuck off randy!', 'cock and nuts', 'Shut up cum slut', 'stick deez nuts in ur mouf',
    'cunt', 'stinkkyyyy', 'pussy ass bitch', 'lil sourcream lookin ass', 'whore', 'go white boy! go!'
    , 'shut the fuck up', 'who asked?'];


client.on('message', msg => {
    if (msg.content == '!ping') { //replies to you with a mean message
        let ind = Math.floor(Math.random() * noahReplies.length);
        msg.reply(noahReplies[ind]);
    }
});

//on voicestateupdate gives a message on voice chat join
// client.on('voiceStateUpdate', (oldState, state) => {
//     if(state.channelID != null) {
//         let textChannel = state.channel.guild.channels.cache.get('408499521434157056'); //accesses text channel from id
//         let id = state.member.user.discriminator; //grabs joined members discriminator ID
//         if(id == '0190') {
//             textChannel.send('yeet');
//         } else if (id == '6969') {
//             textChannel.send('Noah...')
//         }
//     }
// });
//Outdated file token for safety purposes!
client.login('NzgxMjA3MzI5OTI3OTg3MjMx.X76SBQ.4UUD5QUr2yWlWyjT6wbwfEond1I')
