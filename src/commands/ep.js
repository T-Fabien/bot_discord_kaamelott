import {
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";

// Commande
const epCommand = new SlashCommandBuilder()
  .setName("ep")
  .setDescription("Recherche un(ou des) épisode de Kaamelott (ex: Unagi -> Tout les épisodes nommé Unagi)")
  .addStringOption((option) =>
    option
      .setName("episode")
      .setDescription("nom de l'épisode")
      .setRequired(true)
      )
  .setDefaultMemberPermissions(
    PermissionFlagsBits.Connect | PermissionFlagsBits.Speak
  );

export default epCommand.toJSON();