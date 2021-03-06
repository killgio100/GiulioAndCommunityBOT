const Discord = require("discord.js")
const { isMaintenance } = require("../../../functions/general/isMaintenance")
const { getEmoji } = require("../../../functions/general/getEmoji")
const { replyMessage } = require("../../../functions/general/replyMessage");

module.exports = {
    name: `interactionCreate`,
    async execute(client, interaction) {
        if (!interaction.isButton()) return
        if (!interaction.customId.startsWith("indietroCode")) return

        interaction.deferUpdate().catch(() => { })

        if (isMaintenance(interaction.user.id)) return

        if (interaction.customId.split(",")[1] != interaction.user.id) return replyMessage(client, interaction, "Warning", "Bottone non tuo", "Questo bottone รจ in un comando eseguito da un'altra persona, esegui anche tu il comando per poterlo premere")

        let category = interaction.customId.split(",")[3]
        let select = new Discord.MessageSelectMenu()
            .setCustomId(`codeMenu,${interaction.user.id}`)
            .setPlaceholder('Select category...')
            .setMaxValues(1)
            .setMinValues(1)
            .addOptions({
                label: "Utility",
                emoji: "๐งฐ",
                value: "codeUtility",
            })
            .addOptions({
                label: "Moderation",
                emoji: "๐จ",
                value: "codeModeration",
            })
            .addOptions({
                label: "Altri comandi",
                emoji: "๐ก",
                value: "codeCommands",
            })
            .addOptions({
                label: "Fun",
                emoji: "๐คฃ",
                value: "codeFun",
            })
            .addOptions({
                label: "Gestione messaggi/canali/ruoli/utenti",
                emoji: "๐",
                value: "codeManage",
            })
            .addOptions({
                label: "Errori comuni",
                emoji: "๐ซ",
                value: "codeErrors",
            })

        let row = new Discord.MessageActionRow()
            .addComponents(select)

        let embed = new Discord.MessageEmbed()
            .setDescription("Per potere ottenere il **codice** e la **spiegazione** delle funzioni qua sotto utilizza il command `/code [id]`")

        switch (category) {
            case "utility": {
                embed
                    .setTitle("๐งฐ UTILITY codes ๐งฐ")
                    .setColor("#CA253B")
            } break
            case "moderation": {
                embed
                    .setTitle("๐จ MODERATION codes ๐จ")
                    .setColor("#5E666A")
            } break
            case "commands": {
                embed
                    .setTitle("๐ก COMMANDS codes ๐ก")
                    .setColor("#A98ED0")
            } break
            case "fun": {
                embed
                    .setTitle("๐ FUN codes ๐")
                    .setColor("#F0C048")
            } break
            case "manage": {
                embed
                    .setTitle("๐ MANAGING codes ๐")
                    .setColor("#53A9E9")
            } break
            case "errors": {
                embed
                    .setTitle("๐ซ ERRORS codes ๐ซ")
                    .setColor("#B82E40")
            } break
        }

        let row2 = new Discord.MessageActionRow()
        let codes = [...client.codes.filter(x => x.category == category).map(x => x)]

        let totPage = Math.ceil(codes.length / 5)
        let page = parseInt(interaction.customId.split(",")[2]) - 1
        if (page < 1) page = 1

        for (let i = 5 * (page - 1); i < 5 * page; i++) {
            if (codes[i]) {
                embed
                    .addField(`${codes[i].name}`, `
${codes[i].description}
`, false)
            }
        }

        let button1 = new Discord.MessageButton()
            .setCustomId(`indietroCode,${interaction.user.id},${page},${category}`)
            .setStyle("PRIMARY")
            .setEmoji(getEmoji(client, "Previous"))

        if (page == 1) {
            button1.setDisabled()
        }

        let button2 = new Discord.MessageButton()
            .setCustomId(`avantiCode,${interaction.user.id},${page},${category}`)
            .setStyle("PRIMARY")
            .setEmoji(getEmoji(client, "Next"))

        if (page == totPage) {
            button2.setDisabled()
        }

        row2
            .addComponents(button1)
            .addComponents(button2)

        if (totPage > 1)
            embed.setFooter({ text: `Page ${page}/${totPage}` })

        interaction.message.edit({ embeds: [embed], components: category ? [row2, row] : [row] })
    },
};