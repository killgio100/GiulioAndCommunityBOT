const Discord = require("discord.js")
const { isMaintenance } = require("../../../functions/general/isMaintenance");
const { getServer } = require("../../../functions/database/getServer");
const { replyMessage } = require("../../../functions/general/replyMessage");
const { getUserPermissionLevel } = require("../../../functions/general/getUserPermissionLevel");
const { updateServer } = require("../../../functions/database/updateServer");

module.exports = {
    name: `interactionCreate`,
    async execute(client, interaction) {
        if (!interaction.isButton()) return
        if (interaction.customId != "annullaChiusuraTicket") return

        if (isMaintenance(interaction.user.id)) return

        interaction.deferUpdate()
            .catch(() => { })

        let serverstats = getServer()
        let ticket = serverstats.tickets.find(x => x.channel == interaction.channelId)
        if (!ticket) return

        if (interaction.user.id != ticket.owner && !getUserPermissionLevel(client, interaction.user.id)) {
            return replyMessage(client, interaction, "NonPermesso", "", "Non puoi annullare la chiusura di questo ticket")
        }

        let embed = new Discord.MessageEmbed()
            .setTitle("Chiusura ticket annullata")
            .setDescription("Questo ticket non si chiuderà più")

        interaction.message.edit({ embeds: [embed], components: [] })

        if (!ticket.daEliminare) return

        serverstats.tickets[serverstats.tickets.findIndex(x => x.channel == interaction.channelId)].daEliminare = false;
        updateServer(serverstats)

        client.channels.cache.get(ticket.channel).messages.fetch(ticket.message)
            .then(msg => {
                let button1 = new Discord.MessageButton()
                    .setLabel("Chiudi ticket")
                    .setStyle("DANGER")
                    .setCustomId("ticketChiudi")

                let row = new Discord.MessageActionRow()
                    .addComponents(button1)

                msg.edit({ embeds: [msg.embeds[0]], components: [row] })
            })
    },
};