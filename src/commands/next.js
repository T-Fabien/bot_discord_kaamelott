import {
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";

// Commande
const nextCommand = new SlashCommandBuilder()
  .setName("next")
  .setDescription("Episode suivant")
  .setDefaultMemberPermissions(
    PermissionFlagsBits.Connect | PermissionFlagsBits.Speak
  );

export default nextCommand.toJSON();