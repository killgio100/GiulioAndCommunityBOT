const Discord = require("discord.js")
const settings = require("../../config/general/settings.json")

module.exports = {
    name: "invite",
    description: "Link di invito del server",
    permissionLevel: 0,
    requiredLevel: 0,
    cooldown: 20,
    syntax: "/invite",
    category: "general",
    channelsGranted: [settings.idCanaliServer.commands],
    async execute(client, interaction, comando) {
        let embed = new Discord.MessageEmbed()
            .setTitle(":woman_raising_hand: Invito del server :man_raising_hand:")
            .setDescription(`Ecco a te l'invito da poter **condividere** con amici o chiunque tu voglia per **entrare** nel server
https://dsc.gg/giulioandcommunity`)
            .setColor("#5865F2")

        interaction.reply({ embeds: [embed] })
    },
};