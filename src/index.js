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

import bestofCommand from "./commands/bestof.js";
import PlaylistCommand from "./commands/playlist.js";
import epCommand from "./commands/ep.js";
import nextCommand from "./commands/next.js";
import pauseCommand from "./commands/pause.js";
import kaamelottCommand from "./commands/kaamelott.js";

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
    bestofCommand,
    epCommand,
    kaamelottCommand,
    nextCommand,
    pauseCommand,
    PlaylistCommand,
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

// Stocke l'ID du message affichant le nom de l'épisode
let episodeMessageId = null;

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
  voiceConnection.on("stateChange", (oldState, newState) => {
    const oldNetworking = Reflect.get(oldState, "networking");
    const newNetworking = Reflect.get(newState, "networking");

    const networkStateChangeHandler = (oldNetworkState, newNetworkState) => {
      const newUdp = Reflect.get(newNetworkState, "udp");
      clearInterval(newUdp?.keepAliveInterval);
    };

    oldNetworking?.off("stateChange", networkStateChangeHandler);
    newNetworking?.on("stateChange", networkStateChangeHandler);
  });

  async function updateEpisodeName() {
    // Vérifie si le message existe déjà
    if (episodeMessageId) {
      try {
        const episodeMessage = await interaction.channel.messages.fetch(
          episodeMessageId
        );
        // Met à jour le contenu du message avec le nouveau nom de l'épisode
        await episodeMessage.edit(
          `L'épisode actuel : ${playlist[index].replace(".mp3", "")}`
        );
      } catch (error) {
        console.error("Erreur lors de la mise à jour du message :", error);
      }
    } else {
      // Si le message n'existe pas, envoie un nouveau message et stocke l'ID
      const newMessage = await interaction.channel.send(
        `L'épisode actuel : ${playlist[index].replace(".mp3", "")}`
      );
      episodeMessageId = newMessage.id;
    }
  }

  async function DeletePreviousEpisodeName() {
    if (episodeMessageId) {
      // Récupération du message
      const messageToDelete = await interaction.channel.messages
        .fetch(episodeMessageId)
        .catch(console.error);
      // Vérification et suppression du message
      if (messageToDelete) {
        // Suppression du message
        await messageToDelete.delete().catch(console.error);
      } else {
        console.error("Le message à supprimer n'a pas été trouvé.");
      }
    }
  }

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

    // Supprime si il y a un message de modification d'épisode
    DeletePreviousEpisodeName();
    episodeMessageId = null;
    // Met à jour le nom de l'épisode dans le canal de texte
    updateEpisodeName();

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
        // Met à jour le nom de l'épisode dans le canal de texte
        updateEpisodeName();
      } else {
        index = 0;
        // Change la ressource
        resource = createAudioResource(path + playlist[index]);
        player.play(resource);
        console.log(playlist[index]);
        // Met à jour le nom de l'épisode dans le canal de texte
        updateEpisodeName();
      }
    });
  } else if (interaction.commandName === "ep") {
    const episodeRechercher = interaction.options._hoistedOptions[0].value;

    // Liste les épisodes
    var episodes = fs.readdirSync(LIVRE);
    playlist = new Array();
    index = 0;
    var playlistString = "";

    // Recherche du l'épisode
    for (let i = 0; i < episodes.length; i++) {
      if (episodes[i].toLowerCase().includes(episodeRechercher.toLowerCase())) {
        playlist[index] = episodes[i];
        playlistString += "\n" + episodes[i].replace(".mp3", "");
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
    path = LIVRE;

    var resource = createAudioResource(LIVRE + playlist[index]);

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

    // Supprime si il y a un message de modification d'épisode
    DeletePreviousEpisodeName();
    episodeMessageId = null;
    // Met à jour le nom de l'épisode dans le canal de texte
    updateEpisodeName();

    player.on("error", (error) => {
      console.error(`Error: ${error.message} with resource`);
    });

    // Ne joue plus rien
    player.on(AudioPlayerStatus.Idle, () => {
      // Si il reste des épisodes
      if (index < playlist.length) {
        index++;
        resource = createAudioResource(path + playlist[index]);
        player.play(resource);
        // Met à jour le nom de l'épisode dans le canal de texte
        updateEpisodeName();
      } else {
        player.stop();
      }
    });
  } else if (interaction.commandName === "kaamelott") {
    // Liste la liste des épisodes
    playlist = fs.readdirSync(LIVRE);

    // Recherche du premier élément supérieur au chiffre de l'épisode demandé
    const nombreMin = interaction.options._hoistedOptions[0].value - 1;
    index = playlist.findIndex((fichier) => {
      const match = fichier.match(/^(\d+)/);
      if (match) {
        const numero = parseInt(match[1], 10);
        return !isNaN(numero) && numero > nombreMin;
      }
      return false;
    });

    // Playlist
    path = LIVRE;
    var resource = createAudioResource(path + playlist[index]);

    // Réponse du Bot
    interaction.reply({
      content: `Commencement de la lecture avec l'épisode ${Math.floor(
        (nombreMin + 1) % 100
      )} du livre ${Math.floor(nombreMin / 100)}`,
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

    // Supprime si il y a un message de modification d'épisode
    DeletePreviousEpisodeName();
    episodeMessageId = null;
    // Met à jour le nom de l'épisode dans le canal de texte
    updateEpisodeName();

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
        // Met à jour le nom de l'épisode dans le canal de texte
        updateEpisodeName();
      } else {
        index = 0;
        // Change la ressource
        resource = createAudioResource(path + playlist[index]);
        player.play(resource);
        console.log(playlist[index]);
        // Met à jour le nom de l'épisode dans le canal de texte
        updateEpisodeName();
      }
    });
  } else if (interaction.commandName === "next") {
    index++;

    if (index < playlist.length) {
      resource = createAudioResource(path + playlist[index]);
      player.play(resource);
      console.log(playlist[index]);

      // Supprime si il y a un message de modification d'épisode
      DeletePreviousEpisodeName();
      // Réponse du Bot
      interaction.reply({
        content: `Episode : ${playlist[index]}`,
      });

      player.on(AudioPlayerStatus.Idle, () => {
        if (index < playlist.length) {
          // Change la ressource
          resource = createAudioResource(path + playlist[index]);
          player.play(resource);
          console.log(playlist[index]);
          interaction.editReply({
            content: `Episode : ${playlist[index]}`,
          });
        } else {
          index = 0;
          // Change la ressource
          resource = createAudioResource(path + playlist[index]);
          player.play(resource);
          console.log("retour a 0");
          interaction.editReply({
            content: `Episode : ${playlist[index]}`,
          });
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
    // Supprime si il y a un message de modification d'épisode
    DeletePreviousEpisodeName();
    episodeMessageId = null;
    // Met à jour le nom de l'épisode dans le canal de texte
    updateEpisodeName();

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
        // Met à jour le nom de l'épisode dans le canal de texte
        updateEpisodeName();
      } else {
        player.stop();
      }
    });
  }
});

client.login(TOKEN);
