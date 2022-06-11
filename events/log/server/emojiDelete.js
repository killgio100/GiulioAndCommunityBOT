const Discord = require('discord.js');
const moment = require('moment');
const settings = require('../../../config/general/settings.json');
const log = require("../../../config/general/log.json")
const colors = require("../../../config/general/colors.json")
const { isMaintenance } = require("../../../functions/general/isMaintenance");

module.exports = {
    name: `emojiDelete`,
    client: "general",
    async execute(client, emoji) {
        if (isMaintenance()) return

        if (emoji.guild.id != settings.idServer) return

        const fetchedLogs = await emoji.guild.fetchAuditLogs({
            limit: 1,
            type: 'EMOJI_DELETE',
        });
        const logs = fetchedLogs.entries.first();

        let embed = new Discord.MessageEmbed()
            .setTitle(":wastebasket: Emoji deleted :wastebasket:")
            .setColor(colors.red)
            .setThumbnail(emoji.url)
            .addField(":alarm_clock: Time", `${moment().format("ddd DD MMM YYYY, HH:mm:ss")}`, false)
            .addField(":brain: Executor", `${logs.executor.toString()} - ${logs.executor.tag}\nID: ${logs.executor.id}`, false)
            .addField(":smiley: Emoji", `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}> - [Image](https://cdn.discordapp.com/emojis/${emoji.id}.webp?size=512)`)
            .addField(":page_with_curl: Name", emoji.name)
            .addField(":receipt: ID", emoji.id)

        client.channels.cache.get(log.server.emojiSticker).send({ embeds: [embed] })
    },
};