import {
    SlashCommandBuilder,
    PermissionFlagsBits,
  } from "discord.js";
  
  // Commande
  const kaamelottCommand = new SlashCommandBuilder()
    .setName("kaamelott")
    .setDescription("Les épisodes Kaamelott dans l'ordre")
    .addStringOption((option) =>
    option
      .setName("episode")
      .setDescription("Commencer l'écoute avec le numéro d'épisode (ex: 240 -> Livre 2 Episode 40)")
      .setRequired(true)
      )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Connect | PermissionFlagsBits.Speak
    );
  
  export default kaamelottCommand.toJSON();