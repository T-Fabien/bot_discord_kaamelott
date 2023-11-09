import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

// Commande
const playlistCommand = new SlashCommandBuilder()
  .setName("playlist")
  .setDescription("playlist d'un personnage Kaamelott")
  .addStringOption((option) =>
    option
      .setName("personnage")
      .setDescription("playlist du personnage Kaamelott")
      .setRequired(true)
      .addChoices(
        { name: "Guethenoc", value: "Guethenoc" },
        { name: "Léodagan", value: "Leodagan" },
        { name: "Merlin & Elias", value: "Merlin" },
        { name: "Perceval & Karadoc", value: "Perceval" },
        { name: "Yvain & Gauvain", value: "Yvain" }
      )
  )
  .setDefaultMemberPermissions(
    PermissionFlagsBits.Connect | PermissionFlagsBits.Speak
  );

export default playlistCommand.toJSON();
