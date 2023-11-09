import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

// Commande
const livreCommand = new SlashCommandBuilder()
  .setName("livre")
  .setDescription("Ecouter un livre de Kaamelott")
  .addStringOption((option) =>
    option
      .setName("livre")
      .setDescription("Numéro du livre Kaamelott")
      .setRequired(true)
      .addChoices(
        { name: "1", value: " Livre 1 " },
        { name: "2", value: " Livre 2 " },
        { name: "3", value: " Livre 3 " },
        { name: "4", value: " Livre 4 " }
      )
  )
  .addStringOption((option) =>
    option
      .setName("tome")
      .setDescription("Numéro du tome")
      .setRequired(true)
      .addChoices(
        { name: "1", value: " Tome 1" },
        { name: "2", value: " Tome 2" }
      )
  )
  .setDefaultMemberPermissions(
    PermissionFlagsBits.Connect | PermissionFlagsBits.Speak
  );

export default livreCommand.toJSON();
