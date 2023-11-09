import {
    SlashCommandBuilder,
    PermissionFlagsBits,
  } from "discord.js";
  
  // Commande
  const pauseCommand = new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Met en pause la lecture")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Connect | PermissionFlagsBits.Speak
    );
  
  export default pauseCommand.toJSON();