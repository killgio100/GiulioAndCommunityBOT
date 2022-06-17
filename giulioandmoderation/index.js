const Discord = require("discord.js");
const fs = require("fs")
const moment = require("moment")
const express = require("express")
const { DisTube } = require("distube")
const { SpotifyPlugin } = require("@distube/spotify")
const { SoundCloudPlugin } = require("@distube/soundcloud")
const settings = require("./config/general/settings.json")
const colors = require("./config/general/colors.json")
const log = require("./config/general/log.json")
const illustrations = require("./config/general/illustrations.json")
const { codeError } = require('./functions/general/codeError');
const { replyMessage } = require('./functions/general/replyMessage');
const { isMaintenance } = require('./functions/general/isMaintenance');
const { getUserPermissionLevel } = require('./functions/general/getUserPermissionLevel');
const { getUser } = require('./functions/database/getUser');
const { addUser } = require('./functions/database/addUser');
const { checkBadwords } = require('./functions/moderation/checkBadwords');
const { blockedChannels } = require("./functions/general/blockedChannels");
const { hasSufficientLevels } = require("./functions/leveling/hasSufficientLevels");
const { getServer } = require("./functions/database/getServer");

require('events').EventEmitter.prototype._maxListeners = 100;

const clientModeration = new Discord.Client({
    intents: 32767,
    allowedMentions: { parse: ['users', 'roles'], repliedUser: true }
})

try {
    require("dotenv").config()
} catch {

}

clientModeration.login(process.env.tokenModeration)

clientModeration.app = express();
clientModeration.app.use(express.json());

const distube = new DisTube(client, {
    youtubeDL: false,
    plugins: [new SpotifyPlugin(), new SoundCloudPlugin()],
    leaveOnEmpty: true,
    leaveOnStop: true,
    emptyCooldown: 20,
})

let cooldownCommands = []
const subtractCommandCooldown = () => {
    for (let index in cooldownCommands) {
        cooldownCommands[index].cooldown = cooldownCommands[index].cooldown - 1
    }

    cooldownCommands = cooldownCommands.filter(x => x.cooldown > 0)
}
module.exports = { subtractCommandCooldown, distube }

//Commands Handler
clientModeration.commands = new Discord.Collection();
const commandsFolder = fs.readdirSync("./commands");
for (const folder of commandsFolder) {
    const commandsFiles = fs.readdirSync(`./commands/${folder}`);
    for (const file of commandsFiles) {
        if (file.endsWith(".js")) {
            const command = require(`./commands/${folder}/${file}`);
            switch (command.client) {
                case "moderation": {
                    clientModeration.commands.set(command.name, command);
                } break;
            }
        }
        else {
            const commandsFiles2 = fs.readdirSync(`./commands/${folder}/${file}`)
            for (const file2 of commandsFiles2) {
                const command = require(`./commands/${folder}/${file}/${file2}`);
                switch (command.client) {
                    case "moderation": {
                        clientModeration.commands.set(command.name, command);
                    } break;
                }
            }
        }
    }
}

//Autocomplete Handler
let i = 0
clientModeration.autocomplete = new Discord.Collection();
const autocompleteFolder = fs.readdirSync("./autocomplete");
for (const folder of autocompleteFolder) {
    const autocompleteFiles = fs.readdirSync(`./autocomplete/${folder}`);
    for (const file of autocompleteFiles) {
        if (file.endsWith(".js")) {
            const autocomplete = require(`./autocomplete/${folder}/${file}`);
            switch (autocomplete.client) {
                case "moderation": {
                    clientModeration.autocomplete.set(i, autocomplete);
                } break;
            }
            i++
        }
        else {
            const autocompleteFiles2 = fs.readdirSync(`./autocomplete/${folder}/${file}`)
            for (const file2 of autocompleteFiles2) {
                const autocomplete = require(`./autocomplete/${folder}/${file}/${file2}`);
                switch (autocomplete.client) {
                    case "moderation": {
                        clientModeration.autocomplete.set(i, autocomplete);
                    } break;
                }
                i++
            }
        }
    }
}

//Events Handler
clientModeration.events = 0;
const eventsFolders = fs.readdirSync('./events').filter(x => x != "music");
for (const folder of eventsFolders) {
    const eventsFiles = fs.readdirSync(`./events/${folder}`)

    for (const file of eventsFiles) {
        if (file.endsWith(".js")) {
            const event = require(`./events/${folder}/${file}`)
            switch (event.client) {
                case "moderation": {
                    clientModeration.on(event.name, (...args) => event.execute(clientModeration, ...args));
                    clientModeration.events++
                } break;
            }
        }
        else {
            const eventsFiles2 = fs.readdirSync(`./events/${folder}/${file}`)
            for (const file2 of eventsFiles2) {
                const event = require(`./events/${folder}/${file}/${file2}`);
                switch (event.client) {
                    case "moderation": {
                        clientModeration.on(event.name, (...args) => event.execute(clientModeration, ...args));
                        clientModeration.events++
                    } break;
                }
            }
        }
    }
}

process.on("uncaughtException", err => {
    codeError(clientModeration, err);
})
process.on("unhandledRejection", err => {
    codeError(clientModeration, err);
})

clientModeration.on("interactionCreate", async interaction => {
    if (!interaction.isCommand()) return

    if (isMaintenance(interaction.user.id)) return

    let userstats = getUser(interaction.user.id)
    if (!userstats) userstats = addUser(interaction.member)[0]

    const comando = clientModeration.commands.get(interaction.commandName)
    if (!comando) return

    if (comando.client != "moderation") return

    if (comando.permissionLevel > getUserPermissionLevel(clientModeration, interaction.user.id)) {
        return replyMessage(clientModeration, interaction, "NonPermesso", "", "", comando)
    }

    if (comando.otherGuild && interaction.guild.id != settings.idServer && getUserPermissionLevel(clientModeration, interaction.user.id) <= 2) {
        return replyMessage(clientModeration, interaction, "NonPermesso", "", "I comandi in questo server sono accessibili sono dagli utenti Owner", comando)
    }

    if (blockedChannels.includes(interaction.channelId) && getUserPermissionLevel(clientModeration, interaction.user.id) <= 2) {
        return replyMessage(clientModeration, interaction, "CanaleNonConcesso", "", "", comando)
    }

    if (comando.channelsGranted.length != 0 && !comando.channelsGranted.includes(interaction.channelId) && !comando.channelsGranted.includes(clientModeration.channels.cache.get(interaction.channelId).parentId)) {
        let serverstats = getServer()
        if (getUserPermissionLevel(clientModeration, interaction.user.id) >= 2) {

        }
        else if (clientModeration.channels.cache.get(interaction.channelId).parentId == settings.idCanaliServer.categoriaAdmin) {

        }
        else if (getUserPermissionLevel(clientModeration, interaction.user.id) >= 1 && (comando.category == "moderation" || comando.name == "video" || comando.name == "code")) {

        }
        else if (serverstats.privateRooms.find(x => x.owners.includes(interaction.user.id))?.channel == interaction.channelId) {

        }
        else if (serverstats.tickets.find(x => x.owner == interaction.user.id)?.channel == interaction.channelId && (getUserPermissionLevel(clientModeration, interaction.user.id) >= 1 || serverstats.tickets.find(x => x.owner == interaction.user.id))) {

        }
        else {
            return replyMessage(clientModeration, interaction, "CanaleNonConcesso", "", "", comando)
        }
    }

    let cooldown = cooldownCommands.find(x => x.user == interaction.user.id && x.command == comando.name)
    if (cooldown && cooldown.cooldown > 0) {
        let embed = new Discord.MessageEmbed()
            .setTitle("Sei in cooldown")
            .setColor(colors.orange)
            .setDescription(`Puoi utilizzare il comando \`/${comando.name}\` tra **${cooldown.cooldown} secondi**`)

        interaction.reply({ embeds: [embed], ephemeral: true })
        return
    }
    else {
        if (comando.cooldown) {
            cooldownCommands.push({ user: interaction.user.id, command: comando.name, cooldown: comando.cooldown })
        }
    }

    if (interaction.channelId == settings.idCanaliServer.onewordstory && (!getUserPermissionLevel(clientModeration, interaction.user.id) || comando.name == "say")) {
        let embed = new Discord.MessageEmbed()
            .setTitle("Canale non concesso")
            .setColor(colors.yellow)
            .setDescription(`In questo canale non è possibile eseguire nessun comando`)

        interaction.reply({ embeds: [embed], ephemeral: true })

        let embed2 = new Discord.MessageEmbed()
            .setTitle(":construction: Channel not granted :construction:")
            .setColor(colors.yellow)
            .setThumbnail(interaction.guild.members.cache.get(interaction.user.id).displayAvatarURL({ dynamic: true }) || interaction.user.displayAvatarURL({ dynamic: true }))
            .addField(":alarm_clock: Time", `${moment().format("ddd DD MMM YYYY, HH:mm:ss")}`)
            .addField(":bust_in_silhouette: Member", `${interaction.user.toString()} - ID: ${interaction.user.id}`)
            .addField(":anchor: Channel", `#${clientModeration.channels.cache.get(interaction.channelId).name} - ID: ${interaction.channelId}`)

        if (comando) {
            let testoCommand = `/${comando.name}${interaction.options._subcommand ? `${interaction.options._subcommand} ` : ""}`
            interaction.options?._hoistedOptions?.forEach(option => {
                testoCommand += ` ${option.name}: \`${option.value}\``
            })
            embed2.addField(":page_facing_up: Command", testoCommand.length > 1024 ? `${testoCommand.slice(0, 1021)}...` : testoCommand)
        }

        if (!isMaintenance()) {
            clientModeration.channels.cache.get(log.commands.allCommands).send({ embeds: [embed2] })
        }

        return
    }

    if (getUserPermissionLevel(clientModeration, interaction.user.id) <= 1 && !hasSufficientLevels(clientModeration, userstats, comando.requiredLevel)) {
        return replyMessage(clientModeration, interaction, "InsufficientLevel", "", "", comando)
    }

    let testoCommand = `/${comando.name}${interaction.options._subcommand ? `${interaction.options._subcommand} ` : ""}`
    interaction.options._hoistedOptions.forEach(option => {
        testoCommand += ` ${option.name}: \`${option.value}\``
    })

    let [trovata, nonCensurato, censurato] = checkBadwords(testoCommand);

    if (trovata && !getUserPermissionLevel(clientModeration, interaction.user.id) && !interaction.member.roles.cache.has(settings.idRuoloFeatureActivator)) {
        let embed = new Discord.MessageEmbed()
            .setAuthor({ name: `[BAD WORDS] ${interaction.member.nickname || interaction.user.username}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })
            .setDescription("L'utilizzo di certe parole in questo server non è consentito")
            .setThumbnail(illustrations.badWords)
            .setColor(colors.purple)
            .addField(":envelope: Message command", censurato.slice(0, 1024))
            .setFooter({ text: "User ID: " + interaction.user.id })

        interaction.reply({ content: "Comando non valido" })
        interaction.deleteReply()

        clientModeration.channels.cache.get(interaction.channelId).send({ embeds: [embed] })
            .then(msg => {
                let embed = new Discord.MessageEmbed()
                    .setTitle(":sweat_drops: Badwords :sweat_drops:")
                    .setColor(colors.purple)
                    .setDescription(`[Message link](https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id})`)
                    .setThumbnail(interaction.member.displayAvatarURL({ dynamic: true }))
                    .addField(":alarm_clock: Time", `${moment().format("ddd DD MMM YYYY, HH:mm:ss")}`)
                    .addField(":bust_in_silhouette: Member", `${interaction.user.toString()} - ${interaction.user.tag}\nID: ${interaction.user.id}`)
                    .addField(":anchor: Channel", `${clientModeration.channels.cache.get(interaction.channelId).toString()} - #${clientModeration.channels.cache.get(interaction.channelId).name}\nID: ${interaction.channelId}`)
                    .addField(":envelope: Message command", nonCensurato.slice(0, 1024))

                if (!isMaintenance())
                    clientModeration.channels.cache.get(log.moderation.badwords).send({ embeds: [embed] })
            })

        embed = new Discord.MessageEmbed()
            .setTitle("Hai detto una parolaccia")
            .setColor(colors.purple)
            .setThumbnail(illustrations.badWords)
            .addField(":envelope: Message", censurato.slice(0, 1024))
            .addField(":anchor: Channel", clientModeration.channels.cache.get(interaction.channelId).toString())

        clientModeration.users.cache.get(interaction.user.id).send({ embeds: [embed] })
            .catch(() => { })
        return
    }

    let result = await comando.execute(clientModeration, interaction, comando)
    if (!result) {
        let embed = new Discord.MessageEmbed()
            .setTitle(":bookmark: Command executed :bookmark:")
            .setColor(colors.blue)
            .setThumbnail(interaction.member.displayAvatarURL({ dynamic: true }))
            .addField(":alarm_clock: Time", `${moment().format("ddd DD MMM YYYY, HH:mm:ss")}`)
            .addField(":bust_in_silhouette: Member", `${interaction.user.toString()} - ID: ${interaction.user.id}`)
            .addField(":anchor: Channel", `#${clientModeration.channels.cache.get(interaction.channelId).name} - ID: ${interaction.channelId}`)
            .addField(":page_facing_up: Command", testoCommand.length > 1024 ? `${testoCommand.slice(0, 1021)}...` : testoCommand)

        if (!isMaintenance())
            clientModeration.channels.cache.get(log.commands.allCommands).send({ embeds: [embed] })
    }
})

clientModeration.on("interactionCreate", async interaction => {
    if (!interaction.isAutocomplete()) return

    const autocomplete = clientModeration.autocomplete.find(x => x.commandName == interaction.commandName && x.optionName == interaction.options.getFocused(true).name)
    if (!autocomplete) return

    let response = await autocomplete.getResponse(clientModeration, interaction.options.getFocused(true), interaction)
    if (!response) return

    interaction.respond(response.slice(0, 25))
})

clientModeration.app.post("/badwords", (req, res) => {
    const { authorization } = req.headers

    if (authorization != process.env.apiKey) return res.sendStatus(401)

    const { userId, channelId, nonCensurato, censurato } = req.body

    let member = clientModeration.guilds.cache.get(settings.idServer).members.cache.get(userId)

    let embed = new Discord.MessageEmbed()
        .setAuthor({ name: `[BAD WORDS] ${member.nickname || member.user.username}`, iconURL: member.displayAvatarURL({ dynamic: true }) })
        .setDescription("L'utilizzo di certe parole in questo server non è consentito")
        .setThumbnail(illustrations.badWords)
        .setColor(colors.purple)
        .addField(":envelope: Message command", censurato.slice(0, 1024))
        .setFooter({ text: "User ID: " + member.user.id })

    clientModeration.channels.cache.get(channelId).send({ embeds: [embed] })
        .then(msg => {
            let embed = new Discord.MessageEmbed()
                .setTitle(":sweat_drops: Badwords :sweat_drops:")
                .setColor(colors.purple)
                .setDescription(`[Message link](https://discord.com/channels/${msg.guild.id}/${msg.channel.id}/${msg.id})`)
                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                .addField(":alarm_clock: Time", `${moment().format("ddd DD MMM YYYY, HH:mm:ss")}`)
                .addField(":bust_in_silhouette: Member", `${member.user.toString()} - ${member.user.tag}\nID: ${member.user.id}`)
                .addField(":anchor: Channel", `${clientModeration.channels.cache.get(channelId).toString()} - #${clientModeration.channels.cache.get(channelId).name}\nID: ${channelId}`)
                .addField(":envelope: Message command", nonCensurato.slice(0, 1024))

            if (!isMaintenance())
                clientModeration.channels.cache.get(log.moderation.badwords).send({ embeds: [embed] })
        })

    embed = new Discord.MessageEmbed()
        .setTitle("Hai detto una parolaccia")
        .setColor(colors.purple)
        .setThumbnail(illustrations.badWords)
        .addField(":envelope: Message", censurato.slice(0, 1024))
        .addField(":anchor: Channel", clientModeration.channels.cache.get(channelId).toString())

    clientModeration.users.cache.get(member.user.id).send({ embeds: [embed] })
        .catch(() => { })

    res.sendStatus(200)
})

clientModeration.app.get("/client", (req, res) => {
    const { authorization } = req.headers

    if (authorization != process.env.apiKey) return res.sendStatus(401)

    res.send({
        user: clientModeration.user,
        ping: clientModeration.ws.ping,
        uptime: clientModeration.uptime,
        avatar: clientModeration.user.avatarURL({ size: 1024 }),
        createdAt: clientModeration.user.createdAt,
        commands: clientModeration.commands,
        token: clientModeration.token,
    })
})

clientModeration.app.get("/reload/:command", async (req, res) => {
    const { authorization } = req.headers

    if (authorization != process.env.apiKey) return res.sendStatus(401)

    let { command } = req.params

    if (!clientModeration.commands.has(command)) return res.sendStatus(404)

    let server = clientModeration.guilds.cache.get(settings.idServer)

    command = clientModeration.commands.get(command)

    await server.commands.fetch()
        .then(async commands => {
            commands.forEach(async command2 => {
                if (command2.name == command.name) {
                    await command2.delete()
                }
            })
        })

    let data = command.data || {}
    data.name = command.name
    data.description = command.description

    await server.commands.create(data)

    res.sendStatus(200)
})