const Discord = require("discord.js")
const fetch = require("node-fetch")
const { isMaintenance } = require("../../../functions/general/isMaintenance")
const { getEmoji } = require("../../../functions/general/getEmoji");
const { replyMessage } = require("../../../functions/general/replyMessage");

module.exports = {
    name: `interactionCreate`,
    async execute(client, interaction) {
        if (!interaction.isSelectMenu()) return
        if (!interaction.customId.startsWith("helpMenu")) return

        if (isMaintenance(interaction.user.id)) return

        interaction.deferUpdate()

        if (interaction.customId.split(",")[1] != interaction.user.id) return replyMessage(client, interaction, "Warning", "Bottone non tuo", "Questo bottone รจ in un comando eseguito da un'altra persona, esegui anche tu il comando per poterlo premere")

        let category = interaction.values[0]
        let embed = new Discord.MessageEmbed()

        switch (category) {
            case "general": {
                embed
                    .setTitle("๐ก GENERAL commands ๐ก")
                    .setColor("#A0ADB7")
            } break
            case "community": {
                embed
                    .setTitle("๐ก COMMUNITY commands ๐ก")
                    .setColor("#F6D17E")
            } break
            case "info": {
                embed
                    .setTitle("๐ INFORMATIONS commands ๐")
                    .setColor("#C5CED5")
            } break
            case "music": {
                embed
                    .setTitle("๐ต MUSIC commands ๐ต")
                    .setColor("#58A3DE")
            } break
            case "fun": {
                embed
                    .setTitle("๐ FUN and GAMES commands ๐")
                    .setColor("#F2C249")
            } break
            case "ranking": {
                embed
                    .setTitle("๐ต RANKING commands ๐ต")
                    .setColor("#A5D089")
            } break
            case "moderation": {
                embed
                    .setTitle("๐ฎ MODERATION commands ๐ฎ")
                    .setColor("#2A6797")
            } break
            case "rooms": {
                embed
                    .setTitle("๐ TICKETS and PRIVATE ROOMS commands ๐")
                    .setColor("#FFAC33")
            } break
        }

        let row2 = new Discord.MessageActionRow()

        let commands = [...client.commands.filter(x => x.category == category).map(x => x)]

        let totPage = Math.ceil(commands.length / 9)
        let page = 1

        for (let i = 9 * (page - 1); i < 9 * page; i++) {
            if (commands[i]) {
                embed
                    .addField(`/${commands[i].name} ${commands[i].permissionLevel == 3 ? getEmoji(client, "OwnerCommand") : commands[i].permissionLevel == 2 ? getEmoji(client, "AdminCommand") : commands[i].permissionLevel == 1 ? getEmoji(client, "ModCommand") : ""}`, `
${commands[i].description}
`, true)
            }
        }

        let button1 = new Discord.MessageButton()
            .setCustomId(`indietroHelp,${interaction.user.id},${page},${category}`)
            .setStyle("PRIMARY")
            .setEmoji(getEmoji(client, "Previous"))

        if (page == 1) {
            button1.setDisabled()
        }

        let button2 = new Discord.MessageButton()
            .setCustomId(`avantiHelp,${interaction.user.id},${page},${category}`)
            .setStyle("PRIMARY")
            .setEmoji(getEmoji(client, "Next"))

        if (page == totPage) {
            button2.setDisabled()
        }

        row2
            .addComponents(button1)
            .addComponents(button2)

        embed
            .setFooter({ text: `Page ${page}/${totPage} - Usa /help (command) per avere piรน informazioni` })

        let select = new Discord.MessageSelectMenu()
            .setCustomId(`helpMenu,${interaction.user.id}`)
            .setPlaceholder('Select category...')
            .setMaxValues(1)
            .setMinValues(1)
            .addOptions({
                label: "General",
                emoji: "๐ก",
                value: "general",
                description: "/help, /code, /segnala, /video, ..."
            })
            .addOptions({
                label: "Community",
                emoji: "๐ก",
                value: "community",
                description: "/suggest, /poll, /birthday, /question, ..."
            })
            .addOptions({
                label: "Informations",
                emoji: "๐",
                value: "info",
                description: "/serverinfo, /channelinfo, /link, /youtube, ..."
            })
            .addOptions({
                label: "Music",
                emoji: "๐ต",
                value: "music",
                description: "/play, /queue, /shuffle, /lyrics, ..."
            })
            .addOptions({
                label: "Fun and Games",
                emoji: "๐",
                value: "fun",
                description: "/say, /meme, /funuser, /hack, ..."
            })
            .addOptions({
                label: "Ranking",
                emoji: "๐ต",
                value: "ranking",
                description: "/rank, /leaderboard, /buy, /inventory, ..."
            })
            .addOptions({
                label: "Moderation",
                emoji: "๐ฎ",
                value: "moderation",
                description: "/infractions, /ban, /tempmute, /badwords, ..."
            })
            .addOptions({
                label: "Tickets and Private rooms",
                emoji: "๐",
                value: "rooms",
                description: "/tclose, /tadd, /pinfo, /prename, /pdelete, ..."
            })

        let row = new Discord.MessageActionRow()
            .addComponents(select)

        interaction.message.edit({ embeds: [embed], components: [row2, row] })
    },
};