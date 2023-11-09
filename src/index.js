import { Client, GatewayIntentBits, REST, Routes } from "discord.js";

import {
  joinVoiceChannel,
  createAudioPlayer,
  entersState,
  createAudioResource,
  VoiceConnectionStatus,
  AudioPlayerStatus,
  NoSubscriberBehavior,
} from "@discordjs/voice";

import fs from "fs";

import PlayCommand from "./commands/bestof.js";
import PlaylistCommand from "./commands/playlist.js";
import LivreCommand from "./commands/livre.js";
import epCommand from "./commands/ep.js";
import nextCommand from "./commands/next.js";
import pauseCommand from "./commands/pause.js";

// Variables d'environnements
import { config } from "dotenv";

config();

// Constantes
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const BESTOF = process.env.BESTOF;
const LIVRE = process.env.LIVRE;

// Info de la playlist
var index = 0;
var path = "";
var playlist = [];

// Droits du bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Création du player Audio
const player = createAudioPlayer({
  behaviors: {
    noSubscriber: NoSubscriberBehavior.Pause,
  },
});

// Lancement du Bot
client.on("ready", () => {
  // Liste des commandes
  const commands = [
    PlayCommand,
    PlaylistCommand,
    LivreCommand,
    epCommand,
    nextCommand,
    pauseCommand,
  ];
  // Listes toutes les serveur du bot
  const guild_ids = client.guilds.cache.map((guild) => guild.id);

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  // Mise a jour des commandes sur tout les serveur
  for (const guildId of guild_ids) {
    rest
      .put(Routes.applicationGuildCommands(CLIENT_ID, guildId), {
        body: commands,
      })
      .catch(console.error);
  }

  console.log("Bot Connecté");
});

// Intéractions
client.on("interactionCreate", async (interaction) => {
  // Rejoint le Voice
  const voiceConnection = joinVoiceChannel({
    debug: true,
    channelId: interaction.member.voice.channelId,
    guildId: interaction.guildId,
    adapterCreator: interaction.guild.voiceAdapterCreator,
  });

  // Test
  voiceConnection.on('stateChange', (oldState, newState) => {
    const oldNetworking = Reflect.get(oldState, 'networking');
    const newNetworking = Reflect.get(newState, 'networking');
  
    const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
      const newUdp = Reflect.get(newNetworkState, 'udp');
      clearInterval(newUdp?.keepAliveInterval);
    }
  
    oldNetworking?.off('stateChange', networkStateChangeHandler);
    newNetworking?.on('stateChange', networkStateChangeHandler);
  });

  // Commande Play
  if (interaction.commandName === "bestof") {
    // Liste la liste du best of
    playlist = fs.readdirSync(BESTOF);

    // Mise en place de l'aléatoire
    for (let i = playlist.length - 1; i > 0; i--) {
      const shuffleIndex = Math.floor(Math.random() * (i + 1));
      const temp = playlist[i];
      playlist[i] = playlist[shuffleIndex];
      playlist[shuffleIndex] = temp;
    }

    // Playlist
    path = BESTOF;
    var resource = createAudioResource(path + playlist[index]);

    // Réponse du Bot
    interaction.reply({
      content: `Il y a ${playlist.length} épisodes dans se best of Kaamelott`,
    });

    // Tentetive de connexion
    try {
      await entersState(voiceConnection, VoiceConnectionStatus.Ready, 10000);
    } catch (error) {
      console.log("Pas réussi a se connecter en moins de 5 secondes.", error);
      return null;
    }

    voiceConnection.subscribe(player);

    // Joue la ressource
    player.play(resource);
    console.log(playlist[index]);

    player.on("error", (error) => {
      console.error(`Error: ${error.message} with resource`);
    });

    // Ne joue plus rien
    player.on(AudioPlayerStatus.Idle, () => {
      if (index < playlist.length) {
        index++;
        // Change la ressource
        resource = createAudioResource(path + playlist[index]);
        player.play(resource);
        console.log(playlist[index]);
      } else {
        index = 0;
        // Change la ressource
        resource = createAudioResource(path + playlist[index]);
        player.play(resource);
        console.log(playlist[index]);
      }
    });
  } else if (interaction.commandName === "livre") {
    const livre = interaction.options._hoistedOptions[0].value;
    const tome = interaction.options._hoistedOptions[1].value;

    // Joue le livre
    var resource = createAudioResource(
      LIVRE + "Kaamelott -" + livre + "-" + tome + ".mp3"
    );

    // Réponse du Bot
    interaction.reply({
      content: `Vous avez choisi le${livre.toLowerCase()}${tome
        .toLowerCase()
        .substring(1)} de Kaamelott`,
    });

    // Tentetive de connexion
    try {
      await entersState(voiceConnection, VoiceConnectionStatus.Ready, 5000);
    } catch (error) {
      console.log("Pas réussi a se connecter en moins de 5 secondes.", error);

      return null;
    }
    voiceConnection.subscribe(player);

    // Joue la ressource
    player.play(resource);

    player.on("error", (error) => {
      console.error(`Error: ${error.message} with resource`);
    });

    // Ne joue plus rien
    player.on(AudioPlayerStatus.Idle, () => {
      player.stop();
    });
  } else if (interaction.commandName === "playlist") {
    const personnage = interaction.options._hoistedOptions[0].value;

    // Liste la playlist du personnage
    path = "./src/assets/" + personnage + "/";
    playlist = fs.readdirSync("./src/assets/" + personnage);

    // Playlist
    index = 0;
    var resource = createAudioResource(path + playlist[index]);

    // Réponse du Bot
    interaction.reply({
      content: `J'ai trouvé ${playlist.length} épisodes pour le personnage ${personnage}`,
    });

    // Tentetive de connexion
    try {
      await entersState(voiceConnection, VoiceConnectionStatus.Ready, 5000);
    } catch (error) {
      console.log("Pas réussi a se connecter en moins de 5 secondes.", error);

      return null;
    }
    voiceConnection.subscribe(player);

    // Joue la ressource
    player.play(resource);

    player.on("error", (error) => {
      console.error(`Error: ${error.message} with resource`);
    });

    // Ne joue plus rien
    player.on(AudioPlayerStatus.Idle, () => {
      if (index < playlist.length) {
        index++;
        // Change la ressource
        resource = createAudioResource(path + playlist[index]);
        player.play(resource);
      } else {
        player.stop();
      }
    });
  } else if (interaction.commandName === "ep") {
    const episodeRechercher = interaction.options._hoistedOptions[0].value;

    // Liste les épisodes
    var episodes = fs.readdirSync(BESTOF);
    playlist = new Array();
    index = 0;
    var playlistString = "";

    // Recherche du l'épisode
    for (let i = 0; i < episodes.length; i++) {
      if (episodes[i].toLowerCase().includes(episodeRechercher.toLowerCase())) {
        playlist[index] = episodes[i];
        playlistString += "\n" + episodes[i].substring(7).replace(".mp3", "");
        index++;
      }
    }

    // Réponse du Bot
    if (index == 0) {
      interaction.reply({
        content: `Je n'ai pas trouvé l'épisode ${playlist}`,
      });
    } else {
      interaction.reply({
        content: `J'ai trouvé ${index} épisodes, voici la liste : ${playlistString}`,
      });
    }

    // Reset de l'index
    index = 0;
    path = BESTOF;

    var resource = createAudioResource(BESTOF + playlist[index]);

    // Tentetive de connexion
    try {
      await entersState(voiceConnection, VoiceConnectionStatus.Ready, 5000);
    } catch (error) {
      console.log("Pas réussi a se connecter en moins de 5 secondes.", error);

      return null;
    }
    voiceConnection.subscribe(player);

    // Joue la ressource
    player.play(resource);

    player.on("error", (error) => {
      console.error(`Error: ${error.message} with resource`);
    });

    // Ne joue plus rien
    player.on(AudioPlayerStatus.Idle, () => {
      // Si il reste des épisodes
      if (index < playlist.length) {
        index++;
        resource = createAudioResource(BESTOF + playlist[index]);
        player.play(resource);
      } else {
        player.stop();
      }
    });
  } else if (interaction.commandName === "next") {
    index++;

    if (index < playlist.length) {
      resource = createAudioResource(path + playlist[index]);
      player.play(resource);
      console.log(playlist[index]);

      // Réponse du Bot
      interaction.reply({
        content: `Episode suivant !`,
      });

      player.on(AudioPlayerStatus.Idle, () => {
        if (index < playlist.length) {
          // Change la ressource
          resource = createAudioResource(path + playlist[index]);
          player.play(resource);
          console.log(playlist[index]);
        } else {
          index = 0;
          // Change la ressource
          resource = createAudioResource(path + playlist[index]);
          player.play(resource);
          console.log("retour a 0");
        }
      });
    }
  } else if (interaction.commandName === "pause") {
    if (player.pause() === true) {
      player.pause();

      // Réponse du Bot
      interaction.reply({
        content: `Lecture en pause`,
      });
    } else {
      player.unpause();

      // Réponse du Bot
      interaction.reply({
        content: `Reprise de lecture`,
      });
    }
  }
});

client.login(TOKEN);
