import {
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";

// Commande
const bestofCommand = new SlashCommandBuilder()
  .setName("bestof")
  .setDescription("Le BestOf de Kaamelott")
  .setDefaultMemberPermissions(
    PermissionFlagsBits.Connect | PermissionFlagsBits.Speak
  );

export default bestofCommand.toJSON();